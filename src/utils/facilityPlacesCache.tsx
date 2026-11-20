import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  APILoadingStatus,
  useApiLoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  calculateDistanceMeters,
  estimateWalkingMinutes,
  FacilityLocationGroup,
  isQuotaExceededError,
  LatLngLiteral,
  NearbyTransitStation,
  ResolvedFacilityPlace,
} from './mapGeometry';

export interface FacilityPlacesContextValue {
  hasApiKey: boolean;
  apiStatus: APILoadingStatus | 'NO_API_KEY';
  resolvedPlaces: Record<string, ResolvedFacilityPlace>;
  resolvingKeys: Record<string, boolean>;
  failedKeys: Record<string, boolean>;
  nearbyStations: Record<string, NearbyTransitStation[]>;
  loadingStationsKeys: Record<string, boolean>;
  ensureFacilityPlace: (group: FacilityLocationGroup) => Promise<ResolvedFacilityPlace | null>;
  ensureNearbyTransit: (
    facilityKey: string,
    location: LatLngLiteral
  ) => Promise<NearbyTransitStation[]>;
}

const DEFAULT_CONTEXT: FacilityPlacesContextValue = {
  hasApiKey: false,
  apiStatus: 'NO_API_KEY',
  resolvedPlaces: {},
  resolvingKeys: {},
  failedKeys: {},
  nearbyStations: {},
  loadingStationsKeys: {},
  ensureFacilityPlace: async () => null,
  ensureNearbyTransit: async () => [],
};

const FacilityPlacesContext = createContext<FacilityPlacesContextValue>(DEFAULT_CONTEXT);

// Osaka City center bias for Place.searchByText queries
const OSAKA_CITY_BIAS: LatLngLiteral = { lat: 34.6937, lng: 135.5023 };

function toLatLngLiteral(
  loc: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
): LatLngLiteral | null {
  if (!loc) return null;
  if (typeof (loc as google.maps.LatLng).lat === 'function') {
    const latLng = loc as google.maps.LatLng;
    return { lat: latLng.lat(), lng: latLng.lng() };
  }
  const literal = loc as google.maps.LatLngLiteral;
  if (typeof literal.lat === 'number' && typeof literal.lng === 'number') {
    return { lat: literal.lat, lng: literal.lng };
  }
  return null;
}

function dispatchQuotaExceeded() {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}

export function GoogleMapsPlacesProvider({ children }: { children: ReactNode }) {
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();

  const [resolvedPlaces, setResolvedPlaces] = useState<
    Record<string, ResolvedFacilityPlace>
  >({});
  const [resolvingKeys, setResolvingKeys] = useState<Record<string, boolean>>({});
  const [failedKeys, setFailedKeys] = useState<Record<string, boolean>>({});
  const [nearbyStations, setNearbyStations] = useState<
    Record<string, NearbyTransitStation[]>
  >({});
  const [loadingStationsKeys, setLoadingStationsKeys] = useState<
    Record<string, boolean>
  >({});

  // In-flight deduplication and synchronous cache refs (never use global Map if Map component is imported)
  const resolvedCacheRef = useRef<Record<string, ResolvedFacilityPlace>>({});
  const inFlightPlaceRef = useRef<
    Record<string, Promise<ResolvedFacilityPlace | null> | undefined>
  >({});
  const stationsCacheRef = useRef<Record<string, NearbyTransitStation[]>>({});
  const inFlightStationsRef = useRef<
    Record<string, Promise<NearbyTransitStation[]> | undefined>
  >({});

  const ensureFacilityPlace = useCallback(
    async (group: FacilityLocationGroup): Promise<ResolvedFacilityPlace | null> => {
      const key = group.facilityKey;
      const cached = resolvedCacheRef.current[key];
      if (cached) return cached;

      const existingPromise = inFlightPlaceRef.current[key];
      if (existingPromise) return existingPromise;

      if (!placesLib) return null;

      const promise = (async (): Promise<ResolvedFacilityPlace | null> => {
        setResolvingKeys((prev) => ({ ...prev, [key]: true }));
        setFailedKeys((prev) => {
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });

        try {
          const cleanAddress = group.address.replace(/〒\d{3}-\d{4}\s*/, '');
          const { places } = await placesLib.Place.searchByText({
            textQuery: `${group.facilityName} ${cleanAddress}`,
            fields: [
              'id',
              'displayName',
              'formattedAddress',
              'location',
              'googleMapsURI',
            ],
            locationBias: OSAKA_CITY_BIAS,
            maxResultCount: 1,
            language: 'ja',
            region: 'JP',
            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          });

          const first = places?.[0];
          const location = toLatLngLiteral(first?.location);
          if (!first || !location) {
            // Fallback query by address alone in case facility name has parenthetical subtitle
            const fallbackRes = await placesLib.Place.searchByText({
              textQuery: cleanAddress,
              fields: [
                'id',
                'displayName',
                'formattedAddress',
                'location',
                'googleMapsURI',
              ],
              locationBias: OSAKA_CITY_BIAS,
              maxResultCount: 1,
              language: 'ja',
              region: 'JP',
              internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
            });
            const fallbackPlace = fallbackRes.places?.[0];
            const fallbackLoc = toLatLngLiteral(fallbackPlace?.location);
            if (!fallbackPlace || !fallbackLoc) {
              setFailedKeys((prev) => ({ ...prev, [key]: true }));
              return null;
            }
            const resolvedFallback: ResolvedFacilityPlace = {
              facilityKey: key,
              placeId: fallbackPlace.id,
              displayName: fallbackPlace.displayName || group.facilityName,
              formattedAddress: fallbackPlace.formattedAddress || group.address,
              location: fallbackLoc,
              googleMapsURI: fallbackPlace.googleMapsURI ?? undefined,
            };
            resolvedCacheRef.current[key] = resolvedFallback;
            setResolvedPlaces((prev) => ({ ...prev, [key]: resolvedFallback }));
            return resolvedFallback;
          }

          const resolved: ResolvedFacilityPlace = {
            facilityKey: key,
            placeId: first.id,
            displayName: first.displayName || group.facilityName,
            formattedAddress: first.formattedAddress || group.address,
            location,
            googleMapsURI: first.googleMapsURI ?? undefined,
          };
          resolvedCacheRef.current[key] = resolved;
          setResolvedPlaces((prev) => ({ ...prev, [key]: resolved }));
          return resolved;
        } catch (err) {
          if (isQuotaExceededError(err)) {
            dispatchQuotaExceeded();
          }
          setFailedKeys((prev) => ({ ...prev, [key]: true }));
          return null;
        } finally {
          delete inFlightPlaceRef.current[key];
          setResolvingKeys((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      })();

      inFlightPlaceRef.current[key] = promise;
      return promise;
    },
    [placesLib]
  );

  const ensureNearbyTransit = useCallback(
    async (
      facilityKey: string,
      location: LatLngLiteral
    ): Promise<NearbyTransitStation[]> => {
      const cached = stationsCacheRef.current[facilityKey];
      if (cached) return cached;

      const existingPromise = inFlightStationsRef.current[facilityKey];
      if (existingPromise) return existingPromise;

      if (!placesLib) return [];

      const promise = (async (): Promise<NearbyTransitStation[]> => {
        setLoadingStationsKeys((prev) => ({ ...prev, [facilityKey]: true }));
        try {
          const { places } = await placesLib.Place.searchNearby({
            fields: [
              'id',
              'displayName',
              'location',
              'primaryType',
              'googleMapsURI',
            ],
            locationRestriction: {
              center: location,
              radius: 1500,
            },
            includedPrimaryTypes: [
              'subway_station',
              'train_station',
              'light_rail_station',
            ],
            maxResultCount: 6,
            rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
            language: 'ja',
            region: 'JP',
            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          });

          const list: NearbyTransitStation[] = [];
          const seenNames: Record<string, boolean> = {};

          for (const p of places ?? []) {
            const loc = toLatLngLiteral(p.location);
            const name = p.displayName?.trim();
            if (!loc || !name) continue;
            // Deduplicate multi-line entries sharing the same normalized station base name
            const dedupeKey = name.replace(/\s+/g, '').replace(/駅$/, '');
            if (seenNames[dedupeKey]) continue;
            seenNames[dedupeKey] = true;

            const distanceMeters = calculateDistanceMeters(location, loc);
            list.push({
              id: p.id,
              displayName: name,
              location: loc,
              distanceMeters,
              walkingMinutes: estimateWalkingMinutes(distanceMeters),
              primaryType: p.primaryType ?? undefined,
              googleMapsURI: p.googleMapsURI ?? undefined,
            });
          }

          list.sort((a, b) => a.distanceMeters - b.distanceMeters);
          const trimmed = list.slice(0, 4);
          stationsCacheRef.current[facilityKey] = trimmed;
          setNearbyStations((prev) => ({ ...prev, [facilityKey]: trimmed }));
          return trimmed;
        } catch (err) {
          if (isQuotaExceededError(err)) {
            dispatchQuotaExceeded();
          }
          return [];
        } finally {
          delete inFlightStationsRef.current[facilityKey];
          setLoadingStationsKeys((prev) => {
            if (!prev[facilityKey]) return prev;
            const next = { ...prev };
            delete next[facilityKey];
            return next;
          });
        }
      })();

      inFlightStationsRef.current[facilityKey] = promise;
      return promise;
    },
    [placesLib]
  );

  const value = useMemo<FacilityPlacesContextValue>(
    () => ({
      hasApiKey: true,
      apiStatus,
      resolvedPlaces,
      resolvingKeys,
      failedKeys,
      nearbyStations,
      loadingStationsKeys,
      ensureFacilityPlace,
      ensureNearbyTransit,
    }),
    [
      apiStatus,
      resolvedPlaces,
      resolvingKeys,
      failedKeys,
      nearbyStations,
      loadingStationsKeys,
      ensureFacilityPlace,
      ensureNearbyTransit,
    ]
  );

  return (
    <FacilityPlacesContext.Provider value={value}>
      {children}
    </FacilityPlacesContext.Provider>
  );
}

export function NoApiKeyPlacesProvider({ children }: { children: ReactNode }) {
  return (
    <FacilityPlacesContext.Provider value={DEFAULT_CONTEXT}>
      {children}
    </FacilityPlacesContext.Provider>
  );
}

export function useFacilityPlaces() {
  return useContext(FacilityPlacesContext);
}
