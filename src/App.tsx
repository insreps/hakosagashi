import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CompareBar } from './components/CompareBar';
import { CompareDrawerModal } from './components/CompareDrawerModal';
import { Footer } from './components/Footer';
import { AppRoute, Header } from './components/Header';
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

const SearchPage = lazy(() =>
  import('./components/SearchPage').then((m) => ({ default: m.SearchPage }))
);
const RoomDetailPage = lazy(() =>
  import('./components/RoomDetailPage').then((m) => ({ default: m.RoomDetailPage }))
);

const GOOGLE_MAPS_API_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
).trim();

interface RouteState {
  route: AppRoute;
  roomId: string | null;
  filters: SearchFilters;
  sharedCompareIds: string[] | null;
}

const COMPARE_STORAGE_KEY = 'hakosagashi_compare_ids_v2';
const FAVORITES_STORAGE_KEY = 'hakosagashi_favorites_v1';

function loadStoredRoomIds(storageKey: string, maxCount?: number): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(FACILITY_ROOMS.map((r) => r.id));
    const filtered = parsed.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id)
    );
    return maxCount ? filtered.slice(0, maxCount) : filtered;
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
      sharedCompareIds: null,
    };
  }
  if (path === '/compare') {
    const params = new URLSearchParams(search);
    const validIds = new Set(FACILITY_ROOMS.map((r) => r.id));
    const ids = (params.get('ids') ?? '')
      .split(',')
      .map((s) => decodeURIComponent(s.trim()))
      .filter((id) => validIds.has(id))
      .slice(0, 3);
    return {
      route: 'search',
      roomId: null,
      filters: DEFAULT_FILTERS,
      sharedCompareIds: ids.length > 0 ? ids : null,
    };
  }
  if (path === '/search') {
    return {
      route: 'search',
      roomId: null,
      filters: searchParamsToFilters(search),
      sharedCompareIds: null,
    };
  }
  return {
    route: 'top',
    roomId: null,
    filters: DEFAULT_FILTERS,
    sharedCompareIds: null,
  };
}

export default function App() {
  const [routeState, setRouteState] = useState<RouteState>(() =>
    parseBrowserLocation()
  );
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const initial = parseBrowserLocation();
    return initial.sharedCompareIds ?? loadStoredRoomIds(COMPARE_STORAGE_KEY, 3);
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    loadStoredRoomIds(FAVORITES_STORAGE_KEY)
  );
  const [compareModalOpen, setCompareModalOpen] = useState(() => {
    const initial = parseBrowserLocation();
    return Boolean(initial.sharedCompareIds && initial.sharedCompareIds.length > 0);
  });
  const [compareNotice, setCompareNotice] = useState<string | null>(null);
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

  // Persist favorite IDs
  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteIds]);

  // Sync browser back/forward and hash navigation
  useEffect(() => {
    const handleRouteChange = () => {
      const next = parseBrowserLocation();
      setRouteState(next);
      if (next.sharedCompareIds && next.sharedCompareIds.length > 0) {
        setCompareIds(next.sharedCompareIds);
        setCompareModalOpen(true);
      }
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
    setRouteState({
      route: 'top',
      roomId: null,
      filters: DEFAULT_FILTERS,
      sharedCompareIds: null,
    });

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
      sharedCompareIds: null,
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
      sharedCompareIds: null,
    }));
  }, []);

  const navigateDetail = useCallback((roomId: string) => {
    window.history.pushState({}, '', `#/rooms/${encodeURIComponent(roomId)}`);
    setRouteState((prev) => ({
      ...prev,
      route: 'detail',
      roomId,
      sharedCompareIds: null,
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
      sharedCompareIds: null,
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
        setCompareNotice(null);
        return prev.filter((id) => id !== roomId);
      }
      if (prev.length >= 3) {
        setCompareNotice(
          '比較できる部屋は最大3室までです。別の部屋を追加するには、下部バーまたは比較表から1室以上外してください。'
        );
        window.setTimeout(() => setCompareNotice(null), 4000);
        return prev;
      }
      setCompareNotice(null);
      return [...prev, roomId];
    });
  }, []);

  const toggleFavorite = useCallback((roomId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareModalOpen(false);
    setCompareNotice(null);
  }, []);

  const filteredRooms = useMemo(
    () => filterAndSortRooms(FACILITY_ROOMS, routeState.filters, favoriteIds),
    [routeState.filters, favoriteIds]
  );

  const compareRooms = useMemo(
    () =>
      compareIds
        .map((id) => FACILITY_ROOMS.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [compareIds]
  );

  const routeFallback = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-[#57534E]">
      読み込み中…
    </div>
  );

  const appShell = (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {quotaExceeded && (
        <div className="bg-[#F2EFE9] border-b border-[#DED8CE] text-[#57534E] px-4 py-2 text-xs text-center">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-[#1C1917] hover:text-[#0D5C53]"
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

      {compareNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 max-w-sm bg-[#1C1917] text-[#FAF8F5] text-xs leading-relaxed px-4 py-3 rounded-lg shadow-lg border border-stone-700"
        >
          {compareNotice}
        </div>
      )}

      <main className="flex-1">
        {routeState.route === 'top' && (
          <TopPage
            rooms={FACILITY_ROOMS}
            compareIds={compareIds}
            favoriteIds={favoriteIds}
            onToggleCompare={toggleCompare}
            onToggleFavorite={toggleFavorite}
            onSubmitSearch={navigateSearch}
            onSelectPurpose={handleSelectPurpose}
            onSelectRoom={navigateDetail}
            onViewAllRooms={() => navigateSearch(DEFAULT_FILTERS)}
          />
        )}

        {routeState.route === 'search' && (
          <Suspense fallback={routeFallback}>
            <SearchPage
              allRooms={FACILITY_ROOMS}
              filteredRooms={filteredRooms}
              filters={routeState.filters}
              compareIds={compareIds}
              favoriteIds={favoriteIds}
              quotaExceeded={quotaExceeded}
              onToggleCompare={toggleCompare}
              onToggleFavorite={toggleFavorite}
              onUpdateFilters={updateSearchFilters}
              onSelectRoom={navigateDetail}
            />
          </Suspense>
        )}

        {routeState.route === 'detail' && (
          <Suspense fallback={routeFallback}>
            <RoomDetailPage
              room={selectedRoom}
              allRooms={FACILITY_ROOMS}
              compareIds={compareIds}
              favoriteIds={favoriteIds}
              quotaExceeded={quotaExceeded}
              onToggleCompare={toggleCompare}
              onToggleFavorite={toggleFavorite}
              onSelectRoom={navigateDetail}
              onBackToSearch={handleBackFromDetail}
            />
          </Suspense>
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
