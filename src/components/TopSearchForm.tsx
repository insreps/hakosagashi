import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import {
  ALL_EQUIPMENT_KEYS,
  ALL_PURPOSES,
  DEFAULT_FILTERS,
  EQUIPMENT_LABELS,
  EquipmentKey,
  PurposeType,
  SearchFilters,
} from '../types/facility';

interface TopSearchFormProps {
  onSubmitSearch: (filters: SearchFilters) => void;
}

const QUICK_AREAS = ['梅田', 'なんば', '天王寺', '新大阪', '心斎橋'];

export function TopSearchForm({ onSubmitSearch }: TopSearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [purpose, setPurpose] = useState<PurposeType | ''>('');
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [equipment, setEquipment] = useState<EquipmentKey[]>([]);
  const [noGroupRegOnly, setNoGroupRegOnly] = useState(false);

  const toggleEquipment = (key: EquipmentKey) => {
    setEquipment((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitSearch({
      ...DEFAULT_FILTERS,
      keyword: keyword.trim(),
      purposes: purpose ? [purpose] : [],
      equipment,
      minCapacity: minCapacity ? Number(minCapacity) : null,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      noGroupRegOnly,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="施設・部屋条件検索フォーム"
      className="bg-white border border-[#DED8CE] rounded-lg p-5 sm:p-6 shadow-[0_10px_30px_-14px_rgba(28,25,23,0.08)]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="hero-keyword"
            className="block text-xs font-semibold text-[#1C1917] mb-1.5"
          >
            エリア・駅名
          </label>
          <input
            id="hero-keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例：梅田、なんば、新大阪"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:bg-white focus:border-[#0D5C53] focus:ring-2 focus:ring-[#0D5C53]/15 transition-colors"
          />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2">
            <span className="text-[11px] text-[#78716C]">主要エリア：</span>
            {QUICK_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setKeyword(keyword === area ? '' : area)}
                className={`text-[11px] pb-0.5 border-b transition-colors cursor-pointer whitespace-nowrap ${
                  keyword === area
                    ? 'border-[#0D5C53] text-[#0D5C53] font-semibold'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917] hover:border-[#A8A29E]'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="hero-purpose"
            className="block text-xs font-semibold text-[#1C1917] mb-1.5"
          >
            利用目的
          </label>
          <select
            id="hero-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as PurposeType | '')}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53] focus:ring-2 focus:ring-[#0D5C53]/15 transition-colors"
          >
            <option value="">すべての用途</option>
            {ALL_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="hero-capacity"
            className="block text-xs font-semibold text-[#1C1917] mb-1.5"
          >
            利用人数
          </label>
          <select
            id="hero-capacity"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53] focus:ring-2 focus:ring-[#0D5C53]/15 transition-colors"
          >
            <option value="">指定なし</option>
            <option value="1">1名〜（個人利用可など）</option>
            <option value="5">5名以上</option>
            <option value="10">10名以上</option>
            <option value="20">20名以上</option>
            <option value="35">35名以上（大人数・合奏）</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="hero-budget"
            className="block text-xs font-semibold text-[#1C1917] mb-1.5"
          >
            予算上限（1時間あたり）
          </label>
          <select
            id="hero-budget"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:bg-white focus:border-[#0D5C53] focus:ring-2 focus:ring-[#0D5C53]/15 transition-colors"
          >
            <option value="">指定なし</option>
            <option value="1000">1,000円以下 / 時間</option>
            <option value="1500">1,500円以下 / 時間</option>
            <option value="2500">2,500円以下 / 時間</option>
            <option value="3500">3,500円以下 / 時間</option>
          </select>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#ECE7DF] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <fieldset className="flex-1">
          <legend className="text-xs font-semibold text-[#1C1917] mb-2">
            必要な設備・利用ルール（複数選択可）
          </legend>
          <div className="flex flex-wrap gap-2">
            {ALL_EQUIPMENT_KEYS.map((key) => {
              const checked = equipment.includes(key);
              return (
                <label
                  key={key}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors select-none ${
                    checked
                      ? 'bg-[#EEF6F4] border-[#0D5C53] text-[#09433D]'
                      : 'bg-[#FAF8F5] border-[#DED8CE] text-[#1C1917] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEquipment(key)}
                    className="accent-[#0D5C53] w-3.5 h-3.5 rounded"
                  />
                  <span className="whitespace-nowrap">{EQUIPMENT_LABELS[key]}</span>
                </label>
              );
            })}
            <label
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors select-none ${
                noGroupRegOnly
                  ? 'bg-[#EEF6F4] border-[#0D5C53] text-[#09433D]'
                  : 'bg-[#FAF8F5] border-[#DED8CE] text-[#1C1917] hover:bg-[#F2EFE9]'
              }`}
            >
              <input
                type="checkbox"
                checked={noGroupRegOnly}
                onChange={(e) => setNoGroupRegOnly(e.target.checked)}
                className="accent-[#0D5C53] w-3.5 h-3.5 rounded"
              />
              <span className="whitespace-nowrap">団体登録不要のみ</span>
            </label>
          </div>
        </fieldset>

        <div className="shrink-0">
          <button
            type="submit"
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>この条件で検索する</span>
          </button>
        </div>
      </div>
    </form>
  );
}
