import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  CollisionBehavior,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowRight,
  ExternalLink,
  Layers,
  Loader2,
  MapPin,
  TrainFront,
} from 'lucide-react';
import { useFacilityPlaces } from '../utils/facilityPlacesCache';
import {
  FacilityLocationGroup,
  formatDistanceJapanese,
  groupRoomsByFacility,
  LatLngLiteral,
  NearbyTransitStation,
  ResolvedFacilityPlace,
} from '../utils/mapGeometry';
import { RoomRecord } from '../types/facility';

interface FacilitySearchMapProps {
  filteredRooms: RoomRecord[];
  selectedFacilityKey: string | null;
  onSelectFacilityKey: (key: string | null) => void;
  onSelectRoom: (roomId: string) => void;
  quotaExceeded: boolean;
  expandedHeight?: boolean;
}

const OSAKA_DEFAULT_CENTER: LatLngLiteral = { lat: 34.6937, lng: 135.5023 };
const Z_INDEX_SELECTED = 1000;
const Z_INDEX_HOVER = 999;

function TransitLayerOverlay({ enabled }: { enabled: boolean }) {
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

function MapViewportSync({
  groups,
  resolvedPlaces,
  selectedFacilityKey,
  focusTrigger,
}: {
  groups: FacilityLocationGroup[];
  resolvedPlaces: Record<string, ResolvedFacilityPlace>;
  selectedFacilityKey: string | null;
  focusTrigger: number;
}) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');

  const resolvedSignature = useMemo(
    () =>
      groups
        .map((g) => {
          const p = resolvedPlaces[g.facilityKey];
          return p ? `${g.facilityKey}:${p.location.lat.toFixed(4)},${p.location.lng.toFixed(4)}` : '';
        })
        .filter(Boolean)
        .join('|'),
    [groups, resolvedPlaces]
  );

  // Fit bounds when filtered facility locations change
  useEffect(() => {
    if (!map || !coreLib) return;
    const locations = groups
      .map((g) => resolvedPlaces[g.facilityKey]?.location)
      .filter((loc): loc is LatLngLiteral => Boolean(loc));

    if (locations.length === 0) return;

    if (locations.length === 1) {
      map.panTo(locations[0]);
      if ((map.getZoom() ?? 12) < 14) {
        map.setZoom(14);
      }
      return;
    }

    const bounds = new coreLib.LatLngBounds();
    for (const loc of locations) {
      bounds.extend(loc);
    }
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  }, [map, coreLib, resolvedSignature]);

  // Pan to explicitly focused facility when user selects it
  useEffect(() => {
    if (!map || !selectedFacilityKey || focusTrigger === 0) return;
    const place = resolvedPlaces[selectedFacilityKey];
    if (!place) return;
    map.panTo(place.location);
    if ((map.getZoom() ?? 12) < 14) {
      map.setZoom(14);
    }
  }, [map, selectedFacilityKey, focusTrigger, resolvedPlaces]);

  return null;
}

function FacilityMarkerWithRef({
  group,
  place,
  isSelected,
  isHovered,
  zIndex,
  onHover,
  onMarkerClick,
}: {
  group: FacilityLocationGroup;
  place: ResolvedFacilityPlace;
  isSelected: boolean;
  isHovered: boolean;
  zIndex: number;
  onHover: (hovered: boolean) => void;
  onMarkerClick: (
    group: FacilityLocationGroup,
    marker: google.maps.marker.AdvancedMarkerElement
  ) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const pinColors = isSelected
    ? { background: '#d97706', borderColor: '#92400e', glyphColor: '#ffffff' }
    : group.facilityCategory === 'public'
      ? { background: '#0f766e', borderColor: '#115e59', glyphColor: '#ffffff' }
      : { background: '#1e293b', borderColor: '#0f172a', glyphColor: '#ffffff' };

  return (
    <AdvancedMarker
      ref={markerRef}
      position={place.location}
      title={`${group.facilityName}（${group.rooms.length}室）`}
      zIndex={zIndex}
      collisionBehavior={
        isSelected
          ? CollisionBehavior.REQUIRED
          : CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL
      }
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={() => {
        if (marker) {
          onMarkerClick(group, marker);
        }
      }}
    >
      <Pin
        background={pinColors.background}
        borderColor={pinColors.borderColor}
        glyphColor={pinColors.glyphColor}
        scale={isSelected ? 1.25 : isHovered ? 1.12 : 1}
      >
        <span className="text-[11px] font-bold leading-none tabular-nums">
          {group.rooms.length}
        </span>
      </Pin>
    </AdvancedMarker>
  );
}

function StationBadgeMarker({
  station,
  onClick,
}: {
  station: NearbyTransitStation;
  onClick: () => void;
}) {
  return (
    <AdvancedMarker
      position={station.location}
      title={`${station.displayName}（${formatDistanceJapanese(station.distanceMeters)}）`}
      zIndex={600}
      collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
      onClick={onClick}
    >
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 border border-sky-600 shadow-sm text-[11px] font-semibold text-slate-900 whitespace-nowrap">
        <TrainFront className="w-3 h-3 text-sky-700 shrink-0" aria-hidden="true" />
        <span>{station.displayName}</span>
        <span className="text-sky-800 tabular-nums">
          徒歩{station.walkingMinutes}分
        </span>
      </div>
    </AdvancedMarker>
  );
}

export function FacilitySearchMap({
  filteredRooms,
  selectedFacilityKey,
  onSelectFacilityKey,
  onSelectRoom,
  quotaExceeded,
  expandedHeight = false,
}: FacilitySearchMapProps) {
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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [infoAnchorMarker, setInfoAnchorMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const facilityGroups = useMemo(
    () => groupRoomsByFacility(filteredRooms),
    [filteredRooms]
  );

  // Resolve unique facilities when API is loaded (deduplicated & cached across searches)
  useEffect(() => {
    if (!hasApiKey || quotaExceeded) return;
    if (apiStatus !== APILoadingStatus.LOADED) return;

    for (const group of facilityGroups) {
      if (!resolvedPlaces[group.facilityKey]) {
        void ensureFacilityPlace(group);
      }
    }
  }, [
    hasApiKey,
    quotaExceeded,
    apiStatus,
    facilityGroups,
    resolvedPlaces,
    ensureFacilityPlace,
  ]);

  // Clear selection if selected facility is no longer in filtered results
  useEffect(() => {
    if (
      selectedFacilityKey &&
      !facilityGroups.some((g) => g.facilityKey === selectedFacilityKey)
    ) {
      onSelectFacilityKey(null);
      setInfoOpen(false);
      setInfoAnchorMarker(null);
    }
  }, [facilityGroups, selectedFacilityKey, onSelectFacilityKey]);

  // Fetch nearby transit stations on demand when a facility is selected and resolved
  useEffect(() => {
    if (!hasApiKey || quotaExceeded || !selectedFacilityKey) return;
    const place = resolvedPlaces[selectedFacilityKey];
    if (!place) return;
    if (!nearbyStations[selectedFacilityKey]) {
      void ensureNearbyTransit(selectedFacilityKey, place.location);
    }
  }, [
    hasApiKey,
    quotaExceeded,
    selectedFacilityKey,
    resolvedPlaces,
    nearbyStations,
    ensureNearbyTransit,
  ]);

  const sortedMarkerItems = useMemo(() => {
    return facilityGroups
      .map((group) => ({
        group,
        place: resolvedPlaces[group.facilityKey],
      }))
      .filter(
        (item): item is { group: FacilityLocationGroup; place: ResolvedFacilityPlace } =>
          Boolean(item.place)
      )
      .sort((a, b) => b.place.location.lat - a.place.location.lat)
      .map((item, idx) => ({ ...item, baseZIndex: idx }));
  }, [facilityGroups, resolvedPlaces]);

  const selectedGroup = useMemo(
    () =>
      facilityGroups.find((g) => g.facilityKey === selectedFacilityKey) ?? null,
    [facilityGroups, selectedFacilityKey]
  );

  const selectedPlace = selectedFacilityKey
    ? resolvedPlaces[selectedFacilityKey]
    : undefined;
  const selectedStations = selectedFacilityKey
    ? nearbyStations[selectedFacilityKey] ?? []
    : [];
  const isLoadingSelectedStations = selectedFacilityKey
    ? Boolean(loadingStationsKeys[selectedFacilityKey])
    : false;

  const isResolvingAny = facilityGroups.some(
    (g) => Boolean(resolvingKeys[g.facilityKey])
  );

  const handleMarkerClick = (
    group: FacilityLocationGroup,
    marker: google.maps.marker.AdvancedMarkerElement
  ) => {
    onSelectFacilityKey(group.facilityKey);
    setInfoAnchorMarker(marker);
    setInfoOpen(true);
    setFocusTrigger((n) => n + 1);
  };

  const handleListSelectFacility = (group: FacilityLocationGroup) => {
    onSelectFacilityKey(group.facilityKey);
    setInfoOpen(false);
    setFocusTrigger((n) => n + 1);
  };

  const mapUnavailable =
    !hasApiKey ||
    quotaExceeded ||
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <section
      data-testid="facility-map-section"
      aria-label="検索結果の施設マップと最寄り駅アクセス"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Map Header Controls */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span>施設所在地・最寄り駅マップ</span>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {facilityGroups.length}施設（{filteredRooms.length}室）を表示
          </span>
          {isResolvingAny && (
            <span className="inline-flex items-center gap-1 text-xs text-teal-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>位置を取得中...</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block" aria-hidden="true" />
              <span>公共施設</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" aria-hidden="true" />
              <span>民間スペース</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTransitLayer((prev) => !prev)}
            aria-pressed={showTransitLayer}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              showTransitLayer
                ? 'bg-sky-50 text-sky-900 border-sky-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>路線図・駅ネットワーク {showTransitLayer ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {mapUnavailable ? (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 leading-relaxed">
            {quotaExceeded
              ? '現在 Google Maps の利用上限に達しているため、インタラクティブ地図を一時停止しています。各施設の住所・最寄り駅情報は下記からご確認いただけます。'
              : !hasApiKey
                ? 'Google Maps APIキーが未設定のため、インタラクティブ地図の代わりに各施設の最寄り駅一覧と外部地図リンクを表示しています。'
                : '地図の読み込みに失敗したため、各施設の最寄り駅一覧と外部地図リンクを表示しています。'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {facilityGroups.map((group) => (
              <div
                key={group.facilityKey}
                className="border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <p className="text-[11px] font-semibold text-teal-800">
                    {group.facilityCategory === 'public' ? '公共施設' : '民間スペース'} ·{' '}
                    {group.ward}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {group.facilityName}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                    <TrainFront className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{group.nearestStation}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{group.address}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectRoom(group.rooms[0].id)}
                    className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                  >
                    {group.rooms.length > 1
                      ? `${group.rooms[0].roomName} 他${group.rooms.length - 1}室を見る`
                      : `${group.rooms[0].roomName}の詳細`}
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${group.facilityName} ${group.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    <span>Google マップで開く</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12">
          {/* Interactive Map Canvas */}
          <div
            data-testid="facility-map-canvas"
            className={`xl:col-span-8 relative w-full ${
              expandedHeight
                ? 'h-[460px] sm:h-[540px] lg:h-[600px]'
                : 'h-[360px] sm:h-[420px] lg:h-[460px]'
            }`}
          >
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={OSAKA_DEFAULT_CENTER}
              defaultZoom={12}
              gestureHandling="cooperative"
              mapTypeControl={false}
              streetViewControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <TransitLayerOverlay enabled={showTransitLayer} />
              <MapViewportSync
                groups={facilityGroups}
                resolvedPlaces={resolvedPlaces}
                selectedFacilityKey={selectedFacilityKey}
                focusTrigger={focusTrigger}
              />

              {sortedMarkerItems.map(({ group, place, baseZIndex }) => {
                const isSelected = selectedFacilityKey === group.facilityKey;
                const isHovered = hoveredKey === group.facilityKey;
                const zIndex = isSelected
                  ? Z_INDEX_SELECTED
                  : isHovered
                    ? Z_INDEX_HOVER
                    : baseZIndex;

                return (
                  <FacilityMarkerWithRef
                    key={group.facilityKey}
                    group={group}
                    place={place}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    zIndex={zIndex}
                    onHover={(hovered) =>
                      setHoveredKey(hovered ? group.facilityKey : null)
                    }
                    onMarkerClick={handleMarkerClick}
                  />
                );
              })}

              {selectedStations.map((station) => (
                <StationBadgeMarker
                  key={station.id}
                  station={station}
                  onClick={() => setFocusTrigger((n) => n + 1)}
                />
              ))}

              {infoOpen && selectedGroup && selectedPlace && infoAnchorMarker && (
                <InfoWindow
                  anchor={infoAnchorMarker}
                  maxWidth={290}
                  onCloseClick={() => setInfoOpen(false)}
                >
                  <div className="p-1 space-y-2 text-slate-900">
                    <div>
                      <p className="text-[11px] font-semibold text-teal-800">
                        {selectedGroup.facilityCategory === 'public'
                          ? '公共施設'
                          : '民間レンタルスペース'}{' '}
                        · {selectedGroup.ward}
                      </p>
                      <h3 className="text-sm font-bold leading-snug mt-0.5">
                        {selectedGroup.facilityName}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {selectedPlace.formattedAddress}
                      </p>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 rounded px-2 py-1.5">
                      <span className="font-semibold text-slate-800">
                        最寄り駅：
                      </span>
                      <span>{selectedGroup.nearestStation}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-600">
                        条件に一致する部屋（{selectedGroup.rooms.length}室）
                      </p>
                      {selectedGroup.rooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => onSelectRoom(room.id)}
                          className="w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-900 transition-colors cursor-pointer"
                        >
                          <span className="truncate">{room.roomName}</span>
                          <span className="shrink-0 tabular-nums">
                            ¥{room.hourlyRateMin.toLocaleString()}〜
                          </span>
                        </button>
                      ))}
                    </div>

                    {selectedPlace.googleMapsURI && (
                      <a
                        href={selectedPlace.googleMapsURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 hover:underline"
                      >
                        <span>Google マップでルートを見る</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </div>

          {/* Transit Proximity & Facility Selector Side Panel */}
          <div
            className={`xl:col-span-4 border-t xl:border-t-0 xl:border-l border-slate-200 flex flex-col justify-between bg-white overflow-y-auto ${
              expandedHeight
                ? 'max-h-[460px] xl:h-[600px] xl:max-h-none'
                : 'max-h-[380px] xl:h-[460px] xl:max-h-none'
            }`}
          >
            {selectedGroup ? (
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-teal-800">
                      選択中の施設 · {selectedGroup.ward}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                      {selectedGroup.facilityName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedPlace?.formattedAddress ?? selectedGroup.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFacilityKey(null);
                      setInfoOpen(false);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 shrink-0 cursor-pointer"
                  >
                    一覧へ
                  </button>
                </div>

                {/* Nearby Transit Proximity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <TrainFront className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
                    <span>周辺の駅・アクセス目安</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    {selectedGroup.nearestStation}
                  </p>

                  {isLoadingSelectedStations ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-700" aria-hidden="true" />
                      <span>周辺の鉄道・地下鉄駅を検索中...</span>
                    </div>
                  ) : selectedStations.length > 0 ? (
                    <ul
                      data-testid="nearby-stations-list"
                      className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white"
                    >
                      {selectedStations.map((station) => (
                        <li
                          key={station.id}
                          className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate">
                            {station.displayName}
                          </span>
                          <span className="shrink-0 text-sky-900 font-medium tabular-nums">
                            {formatDistanceJapanese(station.distanceMeters)}（徒歩約
                            {station.walkingMinutes}分）
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Matching Rooms in this Facility */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    一致した部屋（{selectedGroup.rooms.length}室）
                  </p>
                  <div className="space-y-2">
                    {selectedGroup.rooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => onSelectRoom(room.id)}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {room.roomName}
                          </p>
                          <p className="text-[11px] text-slate-600 tabular-nums mt-0.5">
                            ¥{room.hourlyRateMin.toLocaleString()}〜/h · {room.areaSqm}㎡ · 定員
                            {room.capacity}名
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    施設を選択して最寄り駅を確認
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    地図上のピンまたは下記リストをクリックすると、周辺の鉄道・地下鉄駅と徒歩距離を確認できます。
                  </p>
                </div>

                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {facilityGroups.map((group) => (
                    <li key={group.facilityKey}>
                      <button
                        type="button"
                        onClick={() => handleListSelectFacility(group)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {group.facilityName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {group.nearestStation}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-teal-800 tabular-nums">
                          {group.rooms.length}室 · ¥
                          {group.minHourlyRate.toLocaleString()}〜
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
