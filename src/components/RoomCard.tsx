import { AlertTriangle, ArrowLeftRight, ArrowRight, Check, MapPin } from 'lucide-react';
import { RoomRecord } from '../types/facility';
import { SafeRoomImage } from './SafeRoomImage';

interface RoomCardProps {
  room: RoomRecord;
  onSelectRoom: (roomId: string) => void;
  isCompared?: boolean;
  canAddCompare?: boolean;
  onToggleCompare?: (roomId: string) => void;
  isMapSelected?: boolean;
  onLocateOnMap?: (room: RoomRecord) => void;
}

export function RoomCard({
  room,
  onSelectRoom,
  isCompared = false,
  canAddCompare = true,
  onToggleCompare,
  isMapSelected = false,
  onLocateOnMap,
}: RoomCardProps) {
  const categoryLabel =
    room.facilityCategory === 'public' ? '公共施設' : '民間レンタルスペース';

  const equipmentSummaryParts: string[] = [];
  if (room.mirror.available) equipmentSummaryParts.push('壁面鏡');
  if (room.barre.available) equipmentSummaryParts.push('レッスンバー');
  if (room.piano.available) equipmentSummaryParts.push(room.piano.type.split('（')[0]);
  if (room.ampsAvailable) equipmentSummaryParts.push('アンプ常設');
  if (room.drumsAllowed) equipmentSummaryParts.push('ドラム・打楽器可');

  const equipmentText =
    equipmentSummaryParts.length > 0
      ? equipmentSummaryParts.join(' · ')
      : room.audioEquipment;

  return (
    <article
      className={`bg-white border rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5 ${
        isMapSelected
          ? 'border-amber-500 ring-2 ring-amber-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <SafeRoomImage
          src={room.imageUrl}
          alt={`${room.facilityName} ${room.roomName}の内観`}
          fallbackTitle={`${room.facilityName} / ${room.roomName}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          {/* Unboxed metadata line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-medium text-teal-800">{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            {room.isSampleData && (
              <>
                <span className="font-medium text-slate-600">サンプル情報</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{room.ward}</span>
          </div>

          <div>
            <p className="text-xs text-slate-600 truncate">{room.facilityName}</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug">
              {room.roomName}
            </h3>
          </div>

          <div className="flex items-start justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-start gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="line-clamp-1">{room.nearestStation}</span>
            </div>
            {onLocateOnMap && (
              <button
                type="button"
                onClick={() => onLocateOnMap(room)}
                aria-label={`${room.facilityName}を地図で確認`}
                className="shrink-0 text-[11px] font-semibold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer whitespace-nowrap"
              >
                地図で確認
              </button>
            )}
          </div>

          {/* Core numeric metrics with tabular numerals */}
          <dl className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-sm">
            <div>
              <dt className="text-[11px] text-slate-500">料金目安 / 1h</dt>
              <dd className="font-semibold text-slate-900 tabular-nums mt-0.5">
                ¥{room.hourlyRateMin.toLocaleString()}〜
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">広さ</dt>
              <dd className="font-semibold text-slate-900 tabular-nums mt-0.5">
                {room.areaSqm}㎡
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">定員</dt>
              <dd className="font-semibold text-slate-900 tabular-nums mt-0.5">
                {room.capacity}名
              </dd>
            </div>
          </dl>

          <div className="space-y-1.5 text-xs">
            <div className="text-slate-700 line-clamp-1">
              <span className="text-slate-500">主な設備：</span>
              <span>{equipmentText}</span>
            </div>
            <div className="text-slate-700 line-clamp-1">
              <span className="text-slate-500">対応用途：</span>
              <span>{room.purposes.join(' / ')}</span>
            </div>
            <div className="text-slate-700">
              <span className="text-slate-500">利用区分：</span>
              <span>
                {room.outsideWardAllowed ? '区外利用可' : '区内限定'} ·{' '}
                {room.individualAllowed ? '個人利用可' : '団体登録要'}
              </span>
            </div>
          </div>

          {/* Caution summary */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-amber-950">
            <AlertTriangle
              className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span className="leading-relaxed line-clamp-2">{room.cautionsSummary}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSelectRoom(room.id)}
            aria-label={`${room.facilityName} ${room.roomName}の詳細を見る`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>詳細を見る</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(room.id)}
              disabled={!isCompared && !canAddCompare}
              aria-pressed={isCompared}
              aria-label={
                isCompared
                  ? `${room.roomName}を比較リストから外す`
                  : `${room.roomName}を比較リストに追加`
              }
              title={
                !isCompared && !canAddCompare
                  ? '比較リストは最大3室までです'
                  : undefined
              }
              className={`inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isCompared
                  ? 'bg-slate-900 text-white border-slate-900 cursor-pointer'
                  : canAddCompare
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>比較中</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>比較</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
