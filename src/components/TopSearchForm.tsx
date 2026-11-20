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

const QUICK_AREAS = ['梅田', 'なんば', '天王寺', '新大阪', '阿倍野', '森小路'];

export function TopSearchForm({ onSubmitSearch }: TopSearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [purpose, setPurpose] = useState<PurposeType | ''>('');
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [equipment, setEquipment] = useState<EquipmentKey[]>([]);

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
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="施設・部屋条件検索フォーム"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="hero-keyword"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            エリア・駅名
          </label>
          <input
            id="hero-keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例：梅田、なんば、新大阪、天王寺"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
          />
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-500">候補：</span>
            {QUICK_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setKeyword(area)}
                className={`text-[11px] px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  keyword === area
                    ? 'bg-teal-700 text-white font-medium'
                    : 'text-slate-600 hover:text-teal-800 hover:bg-teal-50'
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
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            利用目的
          </label>
          <select
            id="hero-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as PurposeType | '')}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
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
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            利用人数
          </label>
          <select
            id="hero-capacity"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
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
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            予算上限（1時間あたり）
          </label>
          <select
            id="hero-budget"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
          >
            <option value="">指定なし</option>
            <option value="1000">1,000円以下 / 時間</option>
            <option value="1500">1,500円以下 / 時間</option>
            <option value="2500">2,500円以下 / 時間</option>
            <option value="3500">3,500円以下 / 時間</option>
          </select>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <fieldset className="flex-1">
          <legend className="text-xs font-semibold text-slate-700 mb-2">
            必要な設備（複数選択可）
          </legend>
          <div className="flex flex-wrap gap-2">
            {ALL_EQUIPMENT_KEYS.map((key) => {
              const checked = equipment.includes(key);
              return (
                <label
                  key={key}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors select-none ${
                    checked
                      ? 'bg-teal-50 border-teal-700 text-teal-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEquipment(key)}
                    className="accent-teal-700 w-3.5 h-3.5 rounded"
                  />
                  <span className="whitespace-nowrap">{EQUIPMENT_LABELS[key]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="shrink-0">
          <button
            type="submit"
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>この条件で検索する</span>
          </button>
        </div>
      </div>
    </form>
  );
}
