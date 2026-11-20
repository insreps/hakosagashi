import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Heart,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  ALL_EQUIPMENT_KEYS,
  ALL_FLOOR_CATEGORIES,
  ALL_PURPOSES,
  ALL_SOUNDPROOF_TIERS,
  DEFAULT_FILTERS,
  EQUIPMENT_LABELS,
  EquipmentKey,
  FacilityCategory,
  FLOOR_CATEGORY_LABELS,
  FloorCategory,
  PurposeType,
  RoomRecord,
  SearchFilters,
  SortOption,
  SOUNDPROOF_TIER_LABELS,
  SoundproofTier,
} from '../types/facility';
import { getFacilityKey } from '../utils/mapGeometry';
import { countActiveFilters } from '../utils/searchFilter';
import { FacilitySearchMap } from './FacilitySearchMap';
import { RoomCard } from './RoomCard';

type SearchViewMode = 'split' | 'list' | 'map';

interface SavedSearchPreset {
  id: string;
  name: string;
  filters: SearchFilters;
}

const PRESETS_STORAGE_KEY = 'hakosagashi_saved_presets_v1';

function loadSavedPresets(): SavedSearchPreset[] {
  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 5);
  } catch {
    return [];
  }
}

interface SearchPageProps {
  allRooms: RoomRecord[];
  filteredRooms: RoomRecord[];
  filters: SearchFilters;
  compareIds: string[];
  favoriteIds: string[];
  quotaExceeded: boolean;
  onToggleCompare: (roomId: string) => void;
  onToggleFavorite: (roomId: string) => void;
  onUpdateFilters: (next: SearchFilters) => void;
  onSelectRoom: (roomId: string) => void;
}

export function SearchPage({
  allRooms,
  filteredRooms,
  filters,
  compareIds,
  favoriteIds,
  quotaExceeded,
  onToggleCompare,
  onToggleFavorite,
  onUpdateFilters,
  onSelectRoom,
}: SearchPageProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<SearchViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'split'
  );
  const userPickedViewModeRef = useRef(false);
  const [selectedFacilityKey, setSelectedFacilityKey] = useState<string | null>(
    null
  );
  const [savedPresets, setSavedPresets] = useState<SavedSearchPreset[]>(() =>
    loadSavedPresets()
  );
  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const syncViewMode = () => {
      if (userPickedViewModeRef.current) return;
      setViewMode(mq.matches ? 'list' : 'split');
    };
    syncViewMode();
    mq.addEventListener('change', syncViewMode);
    return () => mq.removeEventListener('change', syncViewMode);
  }, []);

  const handleSelectViewMode = (mode: SearchViewMode) => {
    userPickedViewModeRef.current = true;
    setViewMode(mode);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(savedPresets));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedPresets]);

  const handleLocateOnMap = (room: RoomRecord) => {
    const key = getFacilityKey(room.facilityName, room.address);
    setSelectedFacilityKey(key);
    if (viewMode === 'list') {
      setViewMode('split');
    }
    requestAnimationFrame(() => {
      mapContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  };

  const activeCount = countActiveFilters(filters);
  const publicCount = allRooms.filter((r) => r.facilityCategory === 'public').length;
  const privateCount = allRooms.filter((r) => r.facilityCategory === 'private').length;

  const togglePurpose = (purpose: PurposeType) => {
    const next = filters.purposes.includes(purpose)
      ? filters.purposes.filter((p) => p !== purpose)
      : [...filters.purposes, purpose];
    onUpdateFilters({ ...filters, purposes: next });
  };

  const toggleEquipment = (key: EquipmentKey) => {
    const next = filters.equipment.includes(key)
      ? filters.equipment.filter((k) => k !== key)
      : [...filters.equipment, key];
    onUpdateFilters({ ...filters, equipment: next });
  };

  const toggleFloor = (floor: FloorCategory) => {
    const next = filters.floorCategories.includes(floor)
      ? filters.floorCategories.filter((f) => f !== floor)
      : [...filters.floorCategories, floor];
    onUpdateFilters({ ...filters, floorCategories: next });
  };

  const toggleSoundproof = (tier: SoundproofTier) => {
    const next = filters.soundproofTiers.includes(tier)
      ? filters.soundproofTiers.filter((s) => s !== tier)
      : [...filters.soundproofTiers, tier];
    onUpdateFilters({ ...filters, soundproofTiers: next });
  };

  const resetAllFilters = () => {
    onUpdateFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
  };

  const setCategory = (facilityCategory: FacilityCategory | 'all') => {
    onUpdateFilters({ ...filters, facilityCategory });
  };

  const handleSavePreset = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = presetName.trim();
    if (!trimmed) return;
    const newPreset: SavedSearchPreset = {
      id: `preset-${Date.now()}`,
      name: trimmed,
      filters: { ...filters },
    };
    setSavedPresets((prev) => [newPreset, ...prev].slice(0, 5));
    setPresetName('');
    setPresetFormOpen(false);
  };

  const handleDeletePreset = (id: string) => {
    setSavedPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const filterSidebarContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD7]">
        <h2 className="text-sm font-bold text-[#1C1917]">絞り込み条件</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0D5C53] hover:text-[#09433D] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>リセット</span>
          </button>
        )}
      </div>

      {/* Keyword */}
      <div>
        <label
          htmlFor="filter-keyword"
          className="block text-xs font-semibold text-[#1C1917] mb-1.5"
        >
          エリア・駅名・施設名
        </label>
        <div className="relative">
          <Search
            className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="filter-keyword"
            type="text"
            value={filters.keyword}
            onChange={(e) =>
              onUpdateFilters({ ...filters, keyword: e.target.value })
            }
            placeholder="例：梅田、なんば、新大阪"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:bg-white focus:border-[#0D5C53] transition-colors"
          />
        </div>
      </div>

      {/* 用途 */}
      <fieldset>
        <legend className="text-xs font-semibold text-[#1C1917] mb-2">
          用途
        </legend>
        <div className="space-y-1.5">
          {ALL_PURPOSES.map((purpose) => {
            const checked = filters.purposes.includes(purpose);
            return (
              <label
                key={purpose}
                className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePurpose(purpose)}
                  className="w-4 h-4 accent-[#0D5C53] rounded"
                />
                <span>{purpose}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 設備 */}
      <fieldset className="pt-3.5 border-t border-[#ECE7DF]">
        <legend className="text-xs font-semibold text-[#1C1917] mb-2">
          設備
        </legend>
        <div className="space-y-1.5">
          {ALL_EQUIPMENT_KEYS.map((key) => {
            const checked = filters.equipment.includes(key);
            return (
              <label
                key={key}
                className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEquipment(key)}
                  className="w-4 h-4 accent-[#0D5C53] rounded"
                />
                <span>{EQUIPMENT_LABELS[key]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 床材 */}
      <fieldset className="pt-3.5 border-t border-[#ECE7DF]">
        <legend className="text-xs font-semibold text-[#1C1917] mb-2">
          床材の種類
        </legend>
        <div className="space-y-1.5">
          {ALL_FLOOR_CATEGORIES.map((floor) => {
            const checked = filters.floorCategories.includes(floor);
            return (
              <label
                key={floor}
                className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFloor(floor)}
                  className="w-4 h-4 accent-[#0D5C53] rounded"
                />
                <span>{FLOOR_CATEGORY_LABELS[floor]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 防音レベル */}
      <fieldset className="pt-3.5 border-t border-[#ECE7DF]">
        <legend className="text-xs font-semibold text-[#1C1917] mb-2">
          防音レベル
        </legend>
        <div className="space-y-1.5">
          {ALL_SOUNDPROOF_TIERS.map((tier) => {
            const checked = filters.soundproofTiers.includes(tier);
            return (
              <label
                key={tier}
                className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSoundproof(tier)}
                  className="w-4 h-4 accent-[#0D5C53] rounded"
                />
                <span>{SOUNDPROOF_TIER_LABELS[tier]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* その他 */}
      <div className="pt-3.5 border-t border-[#ECE7DF] space-y-3.5">
        <h3 className="text-xs font-semibold text-[#1C1917]">予算・規模・利用ルール</h3>

        <div>
          <label
            htmlFor="filter-budget"
            className="block text-xs text-[#57534E] mb-1.5"
          >
            予算上限（1時間あたり）
          </label>
          <select
            id="filter-budget"
            value={filters.maxBudget ?? ''}
            onChange={(e) =>
              onUpdateFilters({
                ...filters,
                maxBudget: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53]"
          >
            <option value="">指定なし</option>
            <option value="800">800円以下 / 時間</option>
            <option value="1000">1,000円以下 / 時間</option>
            <option value="1500">1,500円以下 / 時間</option>
            <option value="2500">2,500円以下 / 時間</option>
            <option value="3500">3,500円以下 / 時間</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-capacity"
            className="block text-xs text-[#57534E] mb-1.5"
          >
            利用人数（定員）
          </label>
          <select
            id="filter-capacity"
            value={filters.minCapacity ?? ''}
            onChange={(e) =>
              onUpdateFilters({
                ...filters,
                minCapacity: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53]"
          >
            <option value="">指定なし</option>
            <option value="5">5名以上</option>
            <option value="10">10名以上</option>
            <option value="20">20名以上</option>
            <option value="30">30名以上</option>
            <option value="50">50名以上</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-area"
            className="block text-xs text-[#57534E] mb-1.5"
          >
            広さ（床面積）
          </label>
          <select
            id="filter-area"
            value={filters.minAreaSqm ?? ''}
            onChange={(e) =>
              onUpdateFilters({
                ...filters,
                minAreaSqm: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53]"
          >
            <option value="">指定なし</option>
            <option value="30">30㎡以上</option>
            <option value="60">60㎡以上</option>
            <option value="90">90㎡以上</option>
            <option value="120">120㎡以上</option>
          </select>
        </div>

        <div className="space-y-2.5 pt-1">
          <label className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]">
            <input
              type="checkbox"
              checked={filters.outsideWardOnly}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  outsideWardOnly: e.target.checked,
                })
              }
              className="w-4 h-4 accent-[#0D5C53] rounded"
            />
            <span>区外利用可能のみ</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]">
            <input
              type="checkbox"
              checked={filters.individualOnly}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  individualOnly: e.target.checked,
                })
              }
              className="w-4 h-4 accent-[#0D5C53] rounded"
            />
            <span>個人利用可能のみ</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]">
            <input
              type="checkbox"
              checked={filters.noGroupRegOnly}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  noGroupRegOnly: e.target.checked,
                })
              }
              className="w-4 h-4 accent-[#0D5C53] rounded"
            />
            <span>団体登録不要のみ</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-[#57534E] cursor-pointer hover:text-[#1C1917]">
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  favoritesOnly: e.target.checked,
                })
              }
              className="w-4 h-4 accent-[#0D5C53] rounded"
            />
            <span>お気に入りのみ（{favoriteIds.length}）</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      {/* Page Title */}
      <div className="mb-7 pb-5 border-b border-[#E4DFD7] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0D5C53] mb-1">
            施設検索 · 大阪市内エリアの実在施設情報
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            練習場所を探す
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            aria-expanded={mobileFiltersOpen}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1C1917] bg-white border border-[#DED8CE] rounded-md hover:bg-[#F2EFE9] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>
              絞り込み{activeCount > 0 ? `（${activeCount}）` : ''}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-medium text-[#57534E] whitespace-nowrap"
            >
              並び替え：
            </label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  sort: e.target.value as SortOption,
                })
              }
              className="px-3 py-2 text-sm bg-white border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#0D5C53]"
            >
              <option value="recommended">おすすめ順</option>
              <option value="price_asc">料金が安い順</option>
              <option value="area_desc">広い順</option>
              <option value="capacity_desc">定員が多い順</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile expandable filter panel */}
      {mobileFiltersOpen && (
        <div className="lg:hidden mb-6 bg-white border border-[#E4DFD7] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#0D5C53]">
              条件を変更するとリアルタイムで結果に反映されます
            </span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="絞り込みパネルを閉じる"
              className="p-1.5 rounded-md text-[#57534E] hover:bg-[#F2EFE9] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {filterSidebarContent}
          <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 px-5 py-3 bg-white/95 backdrop-blur-sm border-t border-[#E4DFD7] flex items-center justify-between gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer tabular-nums"
            >
              該当する {filteredRooms.length} 件の部屋を表示
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside
          aria-label="検索条件フィルター"
          className="hidden lg:block lg:col-span-3 bg-white border border-[#E4DFD7] rounded-lg p-5"
        >
          {filterSidebarContent}
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-5">
          <h2 className="sr-only">検索結果一覧・マップ</h2>

          {/* Facility Category Segmented Control + Favorites Quick Toggle & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="施設種別の切り替え"
                className="inline-flex items-center gap-1 p-1 bg-[#ECE7DF] rounded-md"
              >
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  aria-pressed={filters.facilityCategory === 'all'}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                    filters.facilityCategory === 'all'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  すべて（{allRooms.length}）
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('public')}
                  aria-pressed={filters.facilityCategory === 'public'}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                    filters.facilityCategory === 'public'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  公共施設（{publicCount}）
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('private')}
                  aria-pressed={filters.facilityCategory === 'private'}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                    filters.facilityCategory === 'private'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  民間スペース（{privateCount}）
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    ...filters,
                    favoritesOnly: !filters.favoritesOnly,
                  })
                }
                aria-pressed={filters.favoritesOnly}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filters.favoritesOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-white border-[#DED8CE] text-[#1C1917] hover:bg-[#F2EFE9]'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    filters.favoritesOnly ? 'fill-current text-rose-600' : 'text-[#78716C]'
                  }`}
                  aria-hidden="true"
                />
                <span>お気に入り（{favoriteIds.length}）</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Switcher */}
              <div
                role="group"
                aria-label="表示形式の切り替え"
                className="inline-flex items-center gap-1 p-1 bg-[#ECE7DF] rounded-md"
              >
                <button
                  type="button"
                  onClick={() => handleSelectViewMode('split')}
                  aria-pressed={viewMode === 'split'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>地図＋一覧</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>一覧のみ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectViewMode('map')}
                  aria-pressed={viewMode === 'map'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>地図のみ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Result Summary & Saved Presets Bar */}
          <div className="bg-white border border-[#E4DFD7] rounded-lg px-4 py-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-[#57534E] tabular-nums">
                全 <span className="font-semibold text-[#1C1917]">{allRooms.length}</span>{' '}
                件中{' '}
                <span className="font-bold text-[#0D5C53] text-base">
                  {filteredRooms.length}
                </span>{' '}
                件の部屋を表示中
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {activeCount > 0 && !presetFormOpen && (
                  <button
                    type="button"
                    onClick={() => setPresetFormOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0D5C53] bg-[#EEF6F4] hover:bg-[#DFEEEC] border border-[#C5DFDA] rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>この条件を保存</span>
                  </button>
                )}
              </div>
            </div>

            {presetFormOpen && (
              <form
                onSubmit={handleSavePreset}
                className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ECE7DF]"
              >
                <label htmlFor="preset-name-input" className="sr-only">
                  保存する検索条件の名前
                </label>
                <input
                  id="preset-name-input"
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="例：月曜ダンス用・梅田バンド練習"
                  maxLength={30}
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md cursor-pointer"
                >
                  保存する
                </button>
                <button
                  type="button"
                  onClick={() => setPresetFormOpen(false)}
                  className="px-2.5 py-1.5 text-xs text-[#57534E] hover:bg-[#F2EFE9] rounded-md cursor-pointer"
                >
                  キャンセル
                </button>
              </form>
            )}

            {savedPresets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ECE7DF] text-xs">
                <span className="inline-flex items-center gap-1 text-[#57534E] font-medium">
                  <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>保存済み条件：</span>
                </span>
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="inline-flex items-center bg-[#FAF8F5] border border-[#DED8CE] rounded overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => onUpdateFilters(preset.filters)}
                      className="px-2.5 py-1 text-[#1C1917] hover:bg-[#EEF6F4] hover:text-[#09433D] font-medium cursor-pointer"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      aria-label={`保存済み条件「${preset.name}」を削除`}
                      className="px-1.5 py-1 text-[#78716C] hover:text-red-700 hover:bg-[#F2EFE9] border-l border-[#DED8CE] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                {filters.facilityCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>
                      種別:{' '}
                      {filters.facilityCategory === 'public'
                        ? '公共施設'
                        : '民間スペース'}
                    </span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.favoritesOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, favoritesOnly: false })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded cursor-pointer"
                  >
                    <span>お気に入りのみ</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.keyword && (
                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ ...filters, keyword: '' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>キーワード: {filters.keyword}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.purposes.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePurpose(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF6F4] hover:bg-[#DFEEEC] text-[#09433D] rounded cursor-pointer"
                  >
                    <span>用途: {p}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
                {filters.equipment.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleEquipment(eq)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF6F4] hover:bg-[#DFEEEC] text-[#09433D] rounded cursor-pointer"
                  >
                    <span>{EQUIPMENT_LABELS[eq]}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
                {filters.floorCategories.map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => toggleFloor(fl)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>床材: {FLOOR_CATEGORY_LABELS[fl]}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
                {filters.soundproofTiers.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleSoundproof(st)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>防音: {SOUNDPROOF_TIER_LABELS[st]}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
                {filters.maxBudget !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, maxBudget: null })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>¥{filters.maxBudget.toLocaleString()}以下</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.minCapacity !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, minCapacity: null })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>{filters.minCapacity}名以上</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.minAreaSqm !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, minAreaSqm: null })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>{filters.minAreaSqm}㎡以上</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.outsideWardOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, outsideWardOnly: false })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>区外利用可</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.individualOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, individualOnly: false })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>個人利用可</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {filters.noGroupRegOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, noGroupRegOnly: false })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E4DFD7] text-[#1C1917] rounded cursor-pointer"
                  >
                    <span>団体登録不要</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Interactive Google Map + Results Grid or Empty State */}
          {filteredRooms.length === 0 ? (
            <div
              data-testid="empty-results"
              className="bg-white border border-[#E4DFD7] rounded-lg p-10 text-center space-y-4"
            >
              <p className="text-base font-bold text-[#1C1917]">
                指定された条件に一致する部屋が見つかりませんでした
              </p>
              <p className="text-sm text-[#57534E] max-w-md mx-auto leading-relaxed">
                予算の上限や広さ、必須設備の条件を少し緩めるか、すべての条件をリセットして再度お試しください。
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>条件をすべてクリアする</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {viewMode !== 'list' && (
                <div ref={mapContainerRef}>
                  <FacilitySearchMap
                    filteredRooms={filteredRooms}
                    selectedFacilityKey={selectedFacilityKey}
                    onSelectFacilityKey={setSelectedFacilityKey}
                    onSelectRoom={onSelectRoom}
                    quotaExceeded={quotaExceeded}
                    expandedHeight={viewMode === 'map'}
                  />
                </div>
              )}

              {viewMode !== 'map' && (
                <div
                  data-testid="search-results-grid"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onSelectRoom={onSelectRoom}
                      isCompared={compareIds.includes(room.id)}
                      canAddCompare={compareIds.length < 3}
                      onToggleCompare={onToggleCompare}
                      isFavorite={favoriteIds.includes(room.id)}
                      onToggleFavorite={onToggleFavorite}
                      isMapSelected={
                        selectedFacilityKey ===
                        getFacilityKey(room.facilityName, room.address)
                      }
                      onLocateOnMap={handleLocateOnMap}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
