import { ArrowLeftRight, X } from 'lucide-react';
import { RoomRecord } from '../types/facility';

interface CompareBarProps {
  compareRooms: RoomRecord[];
  onOpenCompare: () => void;
  onClearCompare: () => void;
}

export function CompareBar({
  compareRooms,
  onOpenCompare,
  onClearCompare,
}: CompareBarProps) {
  if (compareRooms.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="部屋の比較リスト"
      className="fixed bottom-0 inset-x-0 z-30 bg-[#1C1917] text-[#FAF8F5] border-t border-stone-800 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ArrowLeftRight
            className="w-4 h-4 text-[#66B8AD] shrink-0"
            aria-hidden="true"
          />
          <p className="text-xs sm:text-sm font-medium truncate">
            <span className="font-bold text-[#66B8AD] tabular-nums">
              {compareRooms.length}
            </span>
            <span className="text-stone-300"> / 3室を比較中：</span>
            <span className="hidden md:inline text-stone-200">
              {compareRooms.map((r) => r.roomName).join(' ・ ')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearCompare}
            aria-label="比較リストをクリア"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:text-white rounded hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>クリア</span>
          </button>
          <button
            type="button"
            onClick={onOpenCompare}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#117368] rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            比較表を見る
          </button>
        </div>
      </div>
    </div>
  );
}
