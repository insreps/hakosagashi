import { AlertTriangle, ArrowLeftRight, ArrowRight, Check, Heart, MapPin } from 'lucide-react';
import { REGISTRATION_BARRIER_LABELS, RoomRecord } from '../types/facility';
import { SafeRoomImage } from './SafeRoomImage';

interface RoomCardProps {
  room: RoomRecord;
  onSelectRoom: (roomId: string) => void;
  isCompared?: boolean;
  canAddCompare?: boolean;
  onToggleCompare?: (roomId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (roomId: string) => void;
  isMapSelected?: boolean;
  onLocateOnMap?: (room: RoomRecord) => void;
}

export function RoomCard({
  room,
  onSelectRoom,
  isCompared = false,
  canAddCompare = true,
  onToggleCompare,
  isFavorite = false,
  onToggleFavorite,
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
      className={`bg-white border rounded-lg overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-200 ${
        isMapSelected
          ? 'border-[#B45309] ring-2 ring-[#FDE68A]'
          : 'border-[#E4DFD7] hover:border-[#C5BEB2] hover:shadow-[0_10px_28px_-14px_rgba(28,25,23,0.12)]'
      }`}
    >
      <div className="aspect-[4/3] w-full bg-[#F2EFE9] overflow-hidden border-b border-[#ECE7DF]">
        <SafeRoomImage
          src={room.imageUrl}
          alt={`${room.facilityName} ${room.roomName}の設備イメージ`}
          fallbackTitle={`${room.facilityName} / ${room.roomName}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          {/* Unboxed metadata line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E] min-w-0">
              <span className="font-semibold text-[#0D5C53]">{categoryLabel}</span>
              <span className="text-[#A8A29E]" aria-hidden="true">
                ·
              </span>
              <span>{room.ward}</span>
              <span className="text-[#A8A29E]" aria-hidden="true">
                ·
              </span>
              <span>{REGISTRATION_BARRIER_LABELS[room.registrationBarrier]}</span>
            </div>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(room.id)}
                aria-pressed={isFavorite}
                aria-label={
                  isFavorite
                    ? `${room.roomName}をお気に入りから解除`
                    : `${room.roomName}をお気に入りに追加`
                }
                className={`p-1.5 rounded-md transition-colors shrink-0 cursor-pointer ${
                  isFavorite
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'text-[#78716C] hover:text-rose-700 hover:bg-[#F2EFE9]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <div>
            <p className="text-xs text-[#57534E] truncate">{room.facilityName}</p>
            <h3 className="text-[17px] font-bold text-[#1C1917] mt-0.5 leading-snug">
              {room.roomName}
            </h3>
          </div>

          <div className="flex items-start justify-between gap-2 text-xs text-[#57534E]">
            <div className="flex items-start gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="line-clamp-1">{room.nearestStation}</span>
            </div>
            {onLocateOnMap && (
              <button
                type="button"
                onClick={() => onLocateOnMap(room)}
                aria-label={`${room.facilityName}を地図で確認`}
                className="shrink-0 text-[11px] font-semibold text-[#0D5C53] hover:text-[#09433D] hover:underline cursor-pointer whitespace-nowrap"
              >
                地図で確認
              </button>
            )}
          </div>

          {/* Core numeric metrics with hairline grid */}
          <dl className="grid grid-cols-3 divide-x divide-[#ECE7DF] py-3 border-y border-[#ECE7DF] text-sm">
            <div className="pr-2">
              <dt className="text-[11px] text-[#57534E]">料金目安 / 1h</dt>
              <dd className="font-semibold text-[#1C1917] tabular-nums mt-0.5">
                ¥{room.hourlyRateMin.toLocaleString()}〜
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-[11px] text-[#57534E]">広さ</dt>
              <dd className="font-semibold text-[#1C1917] tabular-nums mt-0.5">
                {room.areaSqm}㎡
              </dd>
            </div>
            <div className="pl-3">
              <dt className="text-[11px] text-[#57534E]">定員</dt>
              <dd className="font-semibold text-[#1C1917] tabular-nums mt-0.5">
                {room.capacity}名
              </dd>
            </div>
          </dl>

          <div className="space-y-1.5 text-xs">
            <div className="text-[#1C1917] line-clamp-1">
              <span className="text-[#57534E]">主な設備：</span>
              <span>{equipmentText}</span>
            </div>
            <div className="text-[#1C1917] line-clamp-1">
              <span className="text-[#57534E]">対応用途：</span>
              <span>{room.purposes.join(' / ')}</span>
            </div>
            <div className="text-[#1C1917]">
              <span className="text-[#57534E]">利用区分：</span>
              <span>
                {room.outsideWardAllowed ? '区外利用可' : '区内限定'} ·{' '}
                {room.individualAllowed ? '個人利用可' : '団体利用'} ·{' '}
                {room.groupRegistrationRequired ? '団体登録要' : '団体登録不要'}
              </span>
            </div>
          </div>

          {/* Quiet hairline caution summary */}
          <div className="pt-2.5 border-t border-[#ECE7DF] flex items-start gap-1.5 text-xs text-[#92400E]">
            <AlertTriangle
              className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5"
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
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#1C1917] hover:bg-[#0D5C53] rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>詳細を見る</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(room.id)}
              aria-pressed={isCompared}
              aria-label={
                isCompared
                  ? `${room.roomName}を比較リストから外す`
                  : !canAddCompare
                    ? `${room.roomName}（比較リスト上限3室に達しています）`
                    : `${room.roomName}を比較リストに追加`
              }
              title={
                !isCompared && !canAddCompare
                  ? '比較リストは最大3室までです'
                  : undefined
              }
              className={`inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompared
                  ? 'bg-[#0D5C53] text-white border-[#0D5C53]'
                  : canAddCompare
                    ? 'bg-white text-[#1C1917] border-[#DED8CE] hover:bg-[#F2EFE9]'
                    : 'bg-[#F2EFE9] text-[#78716C] border-[#DED8CE] hover:bg-[#ECE7DF]'
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
                  <span>{canAddCompare ? '比較' : '上限3室'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
