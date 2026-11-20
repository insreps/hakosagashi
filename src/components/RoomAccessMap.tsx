import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  CollisionBehavior,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Layers, Loader2, MapPin, TrainFront } from 'lucide-react';
import { RoomRecord } from '../types/facility';
import { useFacilityPlaces } from '../utils/facilityPlacesCache';
import {
  formatDistanceJapanese,
  getFacilityKey,
  groupRoomsByFacility,
} from '../utils/mapGeometry';

interface RoomAccessMapProps {
  room: RoomRecord;
  quotaExceeded: boolean;
}

function SingleTransitLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const layerRef = useRef<google.maps.TransitLayer | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!layerRef.current) {
      layerRef.current = new mapsLib.TransitLayer();
    }
    const layer = layerRef.current;
    layer.setMap(enabled ? map : null);
    return () => {
      layer.setMap(null);
    };
  }, [map, mapsLib, enabled]);

  return null;
}

function CenterOnFacility({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(15);
  }, [map, lat, lng]);

  return null;
}

export function RoomAccessMap({ room, quotaExceeded }: RoomAccessMapProps) {
  const {
    hasApiKey,
    apiStatus,
    resolvedPlaces,
    resolvingKeys,
    nearbyStations,
    loadingStationsKeys,
    ensureFacilityPlace,
    ensureNearbyTransit,
  } = useFacilityPlaces();

  const [showTransitLayer, setShowTransitLayer] = useState(true);

  const facilityKey = getFacilityKey(room.facilityName, room.address);
  const group = useMemo(() => groupRoomsByFacility([room])[0], [room]);

  const place = resolvedPlaces[facilityKey];
  const stations = nearbyStations[facilityKey] ?? [];
  const isResolving = Boolean(resolvingKeys[facilityKey]);
  const isLoadingStations = Boolean(loadingStationsKeys[facilityKey]);

  useEffect(() => {
    if (!hasApiKey || quotaExceeded) return;
    if (apiStatus !== APILoadingStatus.LOADED) return;
    if (!place) {
      void ensureFacilityPlace(group);
    }
  }, [hasApiKey, quotaExceeded, apiStatus, place, group, ensureFacilityPlace]);

  useEffect(() => {
    if (!hasApiKey || quotaExceeded || !place) return;
    if (!nearbyStations[facilityKey]) {
      void ensureNearbyTransit(facilityKey, place.location);
    }
  }, [
    hasApiKey,
    quotaExceeded,
    place,
    facilityKey,
    nearbyStations,
    ensureNearbyTransit,
  ]);

  const mapUnavailable =
    !hasApiKey ||
    quotaExceeded ||
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <section
      id="access-map-section"
      aria-labelledby="access-map-heading"
      data-testid="room-access-map"
      className="scroll-mt-24 bg-white border border-[#DED8CE] rounded-lg p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#0D5C53]" aria-hidden="true" />
          <h2
            id="access-map-heading"
            className="font-display text-lg font-bold text-[#1C1917]"
          >
            周辺マップ・最寄り駅アクセス
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!mapUnavailable && (
            <button
              type="button"
              onClick={() => setShowTransitLayer((prev) => !prev)}
              aria-pressed={showTransitLayer}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                showTransitLayer
                  ? 'bg-[#EEF6F4] text-[#09433D] border-[#C5DFDA]'
                  : 'bg-white text-[#1C1917] border-[#DED8CE] hover:bg-[#F2EFE9]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>路線図表示 {showTransitLayer ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <a
            href={
              place?.googleMapsURI ??
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${room.facilityName} ${room.address}`
              )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#DED8CE] rounded-md transition-colors"
          >
            <span>Google マップで開く</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {mapUnavailable ? (
        <div className="bg-[#FAF8F5] border border-[#E4DFD7] rounded-md p-4 text-xs text-[#57534E] space-y-1.5">
          <p className="font-semibold text-[#1C1917]">{room.nearestStation}</p>
          <p>{room.address}</p>
          <p className="text-[#78716C]">
            {quotaExceeded
              ? '現在 Google Maps の利用上限に達しているため、地図表示を一時停止しています。'
              : '上記の「Google マップで開く」から周辺路線図や乗換ルートをご確認いただけます。'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 relative w-full h-[300px] sm:h-[340px] rounded-lg overflow-hidden border border-[#E4DFD7]">
            {isResolving && !place && (
              <div className="absolute inset-0 z-10 bg-[#FAF8F5]/85 flex items-center justify-center gap-2 text-xs text-[#57534E]">
                <Loader2 className="w-4 h-4 animate-spin text-[#0D5C53]" aria-hidden="true" />
                <span>施設の位置情報を読み込み中...</span>
              </div>
            )}
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: 34.6937, lng: 135.5023 }}
              defaultZoom={14}
              gestureHandling="cooperative"
              mapTypeControl={false}
              streetViewControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <SingleTransitLayer enabled={showTransitLayer} />
              {place && (
                <>
                  <CenterOnFacility
                    lat={place.location.lat}
                    lng={place.location.lng}
                  />
                  <AdvancedMarker
                    position={place.location}
                    title={room.facilityName}
                    zIndex={1000}
                    collisionBehavior={CollisionBehavior.REQUIRED}
                  >
                    <Pin
                      background="#0D5C53"
                      borderColor="#09433D"
                      glyphColor="#ffffff"
                      scale={1.15}
                    />
                  </AdvancedMarker>
                </>
              )}

              {stations.map((station) => (
                <AdvancedMarker
                  key={station.id}
                  position={station.location}
                  title={`${station.displayName}（徒歩約${station.walkingMinutes}分）`}
                  zIndex={600}
                  collisionBehavior={
                    CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
                  }
                >
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/95 border border-[#0D5C53] shadow-sm text-[11px] font-semibold text-[#1C1917] whitespace-nowrap">
                    <TrainFront
                      className="w-3 h-3 text-[#0D5C53] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{station.displayName}</span>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="bg-[#FAF8F5] border border-[#E4DFD7] rounded-md p-3.5 space-y-1">
              <p className="text-xs font-bold text-[#1C1917]">公称の最寄り駅</p>
              <p className="text-xs text-[#57534E] leading-relaxed">
                {room.nearestStation}
              </p>
              <p className="text-[11px] text-[#78716C] pt-1">
                {place?.formattedAddress ?? room.address}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <TrainFront className="w-4 h-4 text-[#0D5C53]" aria-hidden="true" />
                <span>周辺の鉄道・地下鉄駅（直線距離目安）</span>
              </p>

              {isLoadingStations ? (
                <div className="flex items-center gap-2 text-xs text-[#57534E] py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D5C53]" aria-hidden="true" />
                  <span>周辺駅を取得しています...</span>
                </div>
              ) : stations.length > 0 ? (
                <ul className="divide-y divide-[#ECE7DF] border border-[#E4DFD7] rounded-md bg-white">
                  {stations.map((station) => (
                    <li
                      key={station.id}
                      className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-semibold text-[#1C1917] truncate">
                        {station.displayName}
                      </span>
                      <span className="shrink-0 text-[#0D5C53] font-medium tabular-nums">
                        {formatDistanceJapanese(station.distanceMeters)}（徒歩約
                        {station.walkingMinutes}分）
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#57534E]">
                  周辺駅情報を読み込み中です。地図上の路線図とあわせてご確認ください。
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
