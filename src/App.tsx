import { useCallback, useEffect, useMemo, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CompareBar } from './components/CompareBar';
import { CompareDrawerModal } from './components/CompareDrawerModal';
import { Footer } from './components/Footer';
import { AppRoute, Header } from './components/Header';
import { RoomDetailPage } from './components/RoomDetailPage';
import { SearchPage } from './components/SearchPage';
import { TopPage } from './components/TopPage';
import { FACILITY_ROOMS } from './data/facilityRooms';
import { DEFAULT_FILTERS, PurposeType, SearchFilters } from './types/facility';
import { parseHashOrPath } from './utils/basePath';
import {
  GoogleMapsPlacesProvider,
  NoApiKeyPlacesProvider,
} from './utils/facilityPlacesCache';
import {
  filterAndSortRooms,
  filtersToSearchParams,
  searchParamsToFilters,
} from './utils/searchFilter';

const GOOGLE_MAPS_API_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
).trim();

interface RouteState {
  route: AppRoute;
  roomId: string | null;
  filters: SearchFilters;
}

const COMPARE_STORAGE_KEY = 'hakosagashi_compare_ids_v2';

function loadInitialCompareIds(): string[] {
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(FACILITY_ROOMS.map((r) => r.id));
    return parsed
      .filter((id): id is string => typeof id === 'string' && validIds.has(id))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function parseBrowserLocation(): RouteState {
  const { path, search } = parseHashOrPath(
    window.location.hash,
    window.location.pathname,
    window.location.search
  );
  if (path.startsWith('/rooms/')) {
    const id = decodeURIComponent(path.replace('/rooms/', '').split('/')[0] ?? '');
    return {
      route: 'detail',
      roomId: id || null,
      filters: DEFAULT_FILTERS,
    };
  }
  if (path === '/search') {
    return {
      route: 'search',
      roomId: null,
      filters: searchParamsToFilters(search),
    };
  }
  return {
    route: 'top',
    roomId: null,
    filters: DEFAULT_FILTERS,
  };
}

export default function App() {
  const [routeState, setRouteState] = useState<RouteState>(() =>
    parseBrowserLocation()
  );
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    loadInitialCompareIds()
  );
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Listen for Google Maps Platform Demo Key quota exhaustion events
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Persist compare IDs
  useEffect(() => {
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [compareIds]);

  // Sync browser back/forward and hash navigation
  useEffect(() => {
    const handleRouteChange = () => {
      setRouteState(parseBrowserLocation());
      const { sectionId } = parseHashOrPath(
        window.location.hash,
        window.location.pathname,
        window.location.search
      );
      if (sectionId) {
        requestAnimationFrame(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const selectedRoom = useMemo(
    () => FACILITY_ROOMS.find((r) => r.id === routeState.roomId),
    [routeState.roomId]
  );

  // Update document title per view
  useEffect(() => {
    if (routeState.route === 'detail' && selectedRoom) {
      document.title = `${selectedRoom.roomName}（${selectedRoom.facilityName}）｜HakoSagashi`;
    } else if (routeState.route === 'search') {
      document.title = '施設・部屋を検索｜HakoSagashi';
    } else {
      document.title = 'HakoSagashi｜練習場所を探す手間と、予約前の不安をなくす。';
    }
  }, [routeState.route, selectedRoom]);

  const navigateHome = useCallback((sectionId?: string) => {
    const targetHash = sectionId ? `#${sectionId}` : '#/';
    window.history.pushState({}, '', targetHash);
    setRouteState({ route: 'top', roomId: null, filters: DEFAULT_FILTERS });

    if (sectionId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  const navigateSearch = useCallback((nextFilters: SearchFilters) => {
    const params = filtersToSearchParams(nextFilters);
    const qs = params.toString();
    const targetHash = qs ? `#/search?${qs}` : '#/search';
    window.history.pushState({}, '', targetHash);
    setRouteState({
      route: 'search',
      roomId: null,
      filters: nextFilters,
    });
    window.scrollTo({ top: 0 });
  }, []);

  const updateSearchFilters = useCallback((nextFilters: SearchFilters) => {
    const params = filtersToSearchParams(nextFilters);
    const qs = params.toString();
    const targetHash = qs ? `#/search?${qs}` : '#/search';
    window.history.replaceState({}, '', targetHash);
    setRouteState((prev) => ({
      ...prev,
      route: 'search',
      filters: nextFilters,
    }));
  }, []);

  const navigateDetail = useCallback((roomId: string) => {
    window.history.pushState({}, '', `#/rooms/${encodeURIComponent(roomId)}`);
    setRouteState((prev) => ({
      ...prev,
      route: 'detail',
      roomId,
    }));
    window.scrollTo({ top: 0 });
  }, []);

  const handleBackFromDetail = useCallback(() => {
    const params = filtersToSearchParams(routeState.filters);
    const qs = params.toString();
    const targetHash = qs ? `#/search?${qs}` : '#/search';
    window.history.pushState({}, '', targetHash);
    setRouteState((prev) => ({
      ...prev,
      route: 'search',
      roomId: null,
    }));
    window.scrollTo({ top: 0 });
  }, [routeState.filters]);

  const handleSelectPurpose = useCallback(
    (purpose: PurposeType) => {
      navigateSearch({
        ...DEFAULT_FILTERS,
        purposes: [purpose],
      });
    },
    [navigateSearch]
  );

  const toggleCompare = useCallback((roomId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, roomId];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareModalOpen(false);
  }, []);

  const filteredRooms = useMemo(
    () => filterAndSortRooms(FACILITY_ROOMS, routeState.filters),
    [routeState.filters]
  );

  const compareRooms = useMemo(
    () =>
      compareIds
        .map((id) => FACILITY_ROOMS.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [compareIds]
  );

  const appShell = (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        currentRoute={routeState.route}
        onNavigateHome={navigateHome}
        onNavigateSearch={() => navigateSearch(routeState.filters)}
      />

      <main className="flex-1">
        {routeState.route === 'top' && (
          <TopPage
            rooms={FACILITY_ROOMS}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onSubmitSearch={navigateSearch}
            onSelectPurpose={handleSelectPurpose}
            onSelectRoom={navigateDetail}
            onViewAllRooms={() => navigateSearch(DEFAULT_FILTERS)}
          />
        )}

        {routeState.route === 'search' && (
          <SearchPage
            allRooms={FACILITY_ROOMS}
            filteredRooms={filteredRooms}
            filters={routeState.filters}
            compareIds={compareIds}
            quotaExceeded={quotaExceeded}
            onToggleCompare={toggleCompare}
            onUpdateFilters={updateSearchFilters}
            onSelectRoom={navigateDetail}
          />
        )}

        {routeState.route === 'detail' && (
          <RoomDetailPage
            room={selectedRoom}
            allRooms={FACILITY_ROOMS}
            compareIds={compareIds}
            quotaExceeded={quotaExceeded}
            onToggleCompare={toggleCompare}
            onSelectRoom={navigateDetail}
            onBackToSearch={handleBackFromDetail}
          />
        )}
      </main>

      <Footer
        hasCompareBar={compareRooms.length > 0}
        onNavigateHome={navigateHome}
        onNavigateSearch={() => navigateSearch(DEFAULT_FILTERS)}
      />

      <CompareBar
        compareRooms={compareRooms}
        onOpenCompare={() => setCompareModalOpen(true)}
        onClearCompare={clearCompare}
      />

      <CompareDrawerModal
        open={compareModalOpen}
        compareRooms={compareRooms}
        onClose={() => setCompareModalOpen(false)}
        onRemoveRoom={toggleCompare}
        onSelectRoom={navigateDetail}
      />
    </div>
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return <NoApiKeyPlacesProvider>{appShell}</NoApiKeyPlacesProvider>;
  }

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      language="ja"
      region="JP"
      libraries={['places', 'marker']}
    >
      <GoogleMapsPlacesProvider>{appShell}</GoogleMapsPlacesProvider>
    </APIProvider>
  );
}
