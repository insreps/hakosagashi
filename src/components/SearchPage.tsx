import { useRef, useState } from 'react';
import {
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ALL_EQUIPMENT_KEYS,
  ALL_PURPOSES,
  DEFAULT_FILTERS,
  EQUIPMENT_LABELS,
  EquipmentKey,
  FacilityCategory,
  PurposeType,
  RoomRecord,
  SearchFilters,
  SortOption,
} from '../types/facility';
import { getFacilityKey } from '../utils/mapGeometry';
import { countActiveFilters } from '../utils/searchFilter';
import { FacilitySearchMap } from './FacilitySearchMap';
import { RoomCard } from './RoomCard';

type SearchViewMode = 'split' | 'list' | 'map';

interface SearchPageProps {
  allRooms: RoomRecord[];
  filteredRooms: RoomRecord[];
  filters: SearchFilters;
  compareIds: string[];
  quotaExceeded: boolean;
  onToggleCompare: (roomId: string) => void;
  onUpdateFilters: (next: SearchFilters) => void;
  onSelectRoom: (roomId: string) => void;
}

export function SearchPage({
  allRooms,
  filteredRooms,
  filters,
  compareIds,
  quotaExceeded,
  onToggleCompare,
  onUpdateFilters,
  onSelectRoom,
}: SearchPageProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<SearchViewMode>('split');
  const [selectedFacilityKey, setSelectedFacilityKey] = useState<string | null>(
    null
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  const resetAllFilters = () => {
    onUpdateFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
  };

  const setCategory = (facilityCategory: FacilityCategory | 'all') => {
    onUpdateFilters({ ...filters, facilityCategory });
  };

  const filterSidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">絞り込み条件</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:text-teal-900 cursor-pointer"
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
          className="block text-xs font-semibold text-slate-800 mb-2"
        >
          エリア・駅名・施設名
        </label>
        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="filter-keyword"
            type="text"
            value={filters.keyword}
            onChange={(e) =>
              onUpdateFilters({ ...filters, keyword: e.target.value })
            }
            placeholder="梅田、なんば、新大阪、天王寺など"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700"
          />
        </div>
      </div>

      {/* 用途 */}
      <fieldset>
        <legend className="text-xs font-semibold text-slate-800 mb-2">
          用途
        </legend>
        <div className="space-y-2">
          {ALL_PURPOSES.map((purpose) => {
            const checked = filters.purposes.includes(purpose);
            return (
              <label
                key={purpose}
                className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePurpose(purpose)}
                  className="w-4 h-4 accent-teal-700 rounded"
                />
                <span>{purpose}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 設備 */}
      <fieldset className="pt-4 border-t border-slate-100">
        <legend className="text-xs font-semibold text-slate-800 mb-2">
          設備
        </legend>
        <div className="space-y-2">
          {ALL_EQUIPMENT_KEYS.map((key) => {
            const checked = filters.equipment.includes(key);
            return (
              <label
                key={key}
                className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEquipment(key)}
                  className="w-4 h-4 accent-teal-700 rounded"
                />
                <span>{EQUIPMENT_LABELS[key]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* その他 */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <h3 className="text-xs font-semibold text-slate-800">その他</h3>

        <div>
          <label
            htmlFor="filter-budget"
            className="block text-xs text-slate-600 mb-1.5"
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
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
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
            className="block text-xs text-slate-600 mb-1.5"
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
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
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
            className="block text-xs text-slate-600 mb-1.5"
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
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700"
          >
            <option value="">指定なし</option>
            <option value="30">30㎡以上</option>
            <option value="60">60㎡以上</option>
            <option value="90">90㎡以上</option>
            <option value="120">120㎡以上</option>
          </select>
        </div>

        <div className="space-y-2.5 pt-1">
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={filters.outsideWardOnly}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  outsideWardOnly: e.target.checked,
                })
              }
              className="w-4 h-4 accent-teal-700 rounded"
            />
            <span>区外利用可能のみ</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={filters.individualOnly}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  individualOnly: e.target.checked,
                })
              }
              className="w-4 h-4 accent-teal-700 rounded"
            />
            <span>個人利用可能のみ</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      {/* Page Title & Sample Disclaimer */}
      <div className="mb-6 pb-5 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">
            施設検索 · 大阪市内エリアの実在施設情報
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            練習場所を探す
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            aria-expanded={mobileFiltersOpen}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>
              絞り込み{activeCount > 0 ? `（${activeCount}）` : ''}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
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
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700"
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
        <div className="lg:hidden mb-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-teal-800">
              条件を変更するとリアルタイムで結果に反映されます
            </span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="絞り込みパネルを閉じる"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {filterSidebarContent}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside
          aria-label="検索条件フィルター"
          className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
        >
          {filterSidebarContent}
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-5">
          {/* Facility Category Segmented Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              role="group"
              aria-label="施設種別の切り替え"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start"
            >
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-pressed={filters.facilityCategory === 'all'}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filters.facilityCategory === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                すべて（{allRooms.length}）
              </button>
              <button
                type="button"
                onClick={() => setCategory('public')}
                aria-pressed={filters.facilityCategory === 'public'}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filters.facilityCategory === 'public'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                公共施設（{publicCount}）
              </button>
              <button
                type="button"
                onClick={() => setCategory('private')}
                aria-pressed={filters.facilityCategory === 'private'}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  filters.facilityCategory === 'private'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                民間スペース（{privateCount}）
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Switcher */}
              <div
                role="group"
                aria-label="表示形式の切り替え"
                className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  aria-pressed={viewMode === 'split'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>地図＋一覧</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>一覧のみ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  aria-pressed={viewMode === 'map'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>地図のみ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Result Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-sm text-slate-700 tabular-nums">
              全 <span className="font-semibold text-slate-900">{allRooms.length}</span>{' '}
              件中{' '}
              <span className="font-bold text-teal-800 text-base">
                {filteredRooms.length}
              </span>{' '}
              件の部屋を表示中
            </p>

            {activeCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {filters.facilityCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
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
                {filters.keyword && (
                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ ...filters, keyword: '' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-md cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-md cursor-pointer"
                  >
                    <span>{EQUIPMENT_LABELS[eq]}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
                {filters.maxBudget !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ ...filters, maxBudget: null })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
                  >
                    <span>個人利用可</span>
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
              className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4"
            >
              <p className="text-base font-bold text-slate-900">
                指定された条件に一致する部屋が見つかりませんでした
              </p>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                予算の上限や広さ、必須設備の条件を少し緩めるか、すべての条件をリセットして再度お試しください。
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
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
