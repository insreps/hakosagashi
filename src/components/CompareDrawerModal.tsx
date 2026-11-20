import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Calculator, Check, Share2, Trash2, X } from 'lucide-react';
import { REGISTRATION_BARRIER_LABELS, RoomRecord } from '../types/facility';
import {
  estimateRoomSessionCost,
  SESSION_DAY_TYPE_LABELS,
  SessionDayType,
} from '../utils/priceCalculator';

interface CompareDrawerModalProps {
  open: boolean;
  compareRooms: RoomRecord[];
  onClose: () => void;
  onRemoveRoom: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export function CompareDrawerModal({
  open,
  compareRooms,
  onClose,
  onRemoveRoom,
  onSelectRoom,
}: CompareDrawerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dayType, setDayType] = useState<SessionDayType>('weekend_day');
  const [hours, setHours] = useState<number>(3);
  const [participants, setParticipants] = useState<number>(8);
  const [commercialEvent, setCommercialEvent] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCopyShareUrl = async () => {
    if (compareRooms.length === 0) return;
    const ids = compareRooms.map((r) => encodeURIComponent(r.id)).join(',');
    const url = `${window.location.origin}${window.location.pathname}#/compare?ids=${ids}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="compare-modal-title"
      className="m-auto max-w-5xl w-[calc(100%-1.5rem)] max-h-[88vh] rounded-lg border border-[#DED8CE] bg-white p-0 shadow-xl backdrop:bg-[#1C1917]/50"
    >
      {open && (
        <div className="flex flex-col max-h-[88vh]">
          <div className="px-5 py-4 border-b border-[#E4DFD7] flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#FAF8F5]">
            <div>
              <h2
                id="compare-modal-title"
                className="font-display text-lg font-bold text-[#1C1917]"
              >
                選択した部屋の設備・条件・料金比較
              </h2>
              <p className="text-xs text-[#57534E] mt-0.5">
                最大3室まで、総額試算・1人あたり金額・広さ・設備・利用ルールを横並びで比較できます。
              </p>
            </div>
            <div className="flex items-center gap-2">
              {compareRooms.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-white hover:bg-[#F2EFE9] border border-[#DED8CE] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0D5C53]" aria-hidden="true" />
                      <span className="text-[#0D5C53]">比較URLをコピー済</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>比較URLをコピー</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                aria-label="比較表を閉じる"
                onClick={onClose}
                className="p-2 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-[#ECE7DF] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="overflow-auto p-5 flex-1 space-y-5">
            {compareRooms.length === 0 ? (
              <p className="text-sm text-[#57534E] text-center py-8">
                比較リストに部屋が追加されていません。
              </p>
            ) : (
              <>
                {/* Cross-room Cost & Split-Pay Bar */}
                <div className="bg-[#FAF8F5] border border-[#E4DFD7] rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                    <Calculator className="w-4 h-4 text-[#0D5C53]" aria-hidden="true" />
                    <span>割り勘・総額シミュレーター（全比較部屋に即時反映）</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label htmlFor="cmp-daytype" className="block text-[#57534E] mb-1">
                        曜日・時間帯
                      </label>
                      <select
                        id="cmp-daytype"
                        value={dayType}
                        onChange={(e) => setDayType(e.target.value as SessionDayType)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#DED8CE] rounded-md text-[#1C1917]"
                      >
                        {(Object.keys(SESSION_DAY_TYPE_LABELS) as SessionDayType[]).map(
                          (key) => (
                            <option key={key} value={key}>
                              {SESSION_DAY_TYPE_LABELS[key]}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="cmp-hours" className="block text-[#57534E] mb-1">
                        利用時間
                      </label>
                      <select
                        id="cmp-hours"
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#DED8CE] rounded-md text-[#1C1917]"
                      >
                        {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                          <option key={h} value={h}>
                            {h}時間
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="cmp-participants" className="block text-[#57534E] mb-1">
                        参加人数（名）
                      </label>
                      <input
                        id="cmp-participants"
                        type="number"
                        min={1}
                        max={200}
                        value={participants}
                        onChange={(e) =>
                          setParticipants(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#DED8CE] rounded-md text-[#1C1917] tabular-nums"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-[#1C1917] cursor-pointer py-1.5">
                        <input
                          type="checkbox"
                          checked={commercialEvent}
                          onChange={(e) => setCommercialEvent(e.target.checked)}
                          className="w-4 h-4 accent-[#0D5C53] rounded"
                        />
                        <span>入場料・参加費徴収</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="min-w-[640px]">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E4DFD7] align-top">
                        <th className="sticky left-0 z-10 bg-white w-36 py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          比較項目
                        </th>
                        {compareRooms.map((room) => (
                          <th
                            key={room.id}
                            className="py-3 px-3 text-left font-normal min-w-[200px]"
                          >
                            <div className="space-y-1">
                              <span className="block text-xs text-[#0D5C53] font-semibold">
                                {room.facilityCategory === 'public'
                                  ? '公共施設'
                                  : '民間スペース'}
                                {' · '}
                                {room.ward}
                              </span>
                              <span className="block text-xs text-[#57534E]">
                                {room.facilityName}
                              </span>
                              <span className="block text-base font-bold text-[#1C1917]">
                                {room.roomName}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveRoom(room.id)}
                                aria-label={`${room.roomName}を比較から外す`}
                                className="inline-flex items-center gap-1 text-xs text-[#57534E] hover:text-red-700 pt-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>外す</span>
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE7DF]">
                      <tr className="bg-[#EEF6F4]">
                        <th className="sticky left-0 z-10 bg-[#EEF6F4] py-3 pr-4 pl-2 text-left text-xs font-semibold text-[#09433D]">
                          試算総額 / 1人あたり
                        </th>
                        {compareRooms.map((room) => {
                          const calc = estimateRoomSessionCost(room, {
                            dayType,
                            hours,
                            participants,
                            commercialEvent,
                            selectedOptionIds: [],
                          });
                          return (
                            <td key={room.id} className="py-3 px-3 tabular-nums">
                              <div className="text-base font-bold text-[#09433D]">
                                ¥{calc.totalYen.toLocaleString()}
                                <span className="text-xs font-medium text-[#57534E] ml-1.5">
                                  （1人 ¥{calc.perPersonYen.toLocaleString()}）
                                </span>
                              </div>
                              <p className="text-[11px] text-[#57534E] mt-0.5">
                                {calc.appliedUnitsLabel}
                              </p>
                              {calc.capacityWarning && (
                                <p className="text-[11px] text-[#78350F] font-medium mt-0.5">
                                  ※ 定員（{room.capacity}名）超過
                                </p>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          1時間料金目安
                        </th>
                        {compareRooms.map((room) => (
                          <td
                            key={room.id}
                            className="py-3 px-3 font-bold text-[#1C1917] tabular-nums"
                          >
                            ¥{room.hourlyRateMin.toLocaleString()}〜
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          広さ・定員
                        </th>
                        {compareRooms.map((room) => (
                          <td
                            key={room.id}
                            className="py-3 px-3 text-[#1C1917] tabular-nums"
                          >
                            {room.areaSqm}㎡ ／ {room.capacity}名
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          最寄り駅
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-3 px-3 text-[#57534E] text-xs">
                            {room.nearestStation}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          床材
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-3 px-3 text-[#57534E] text-xs">
                            {room.flooring}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          鏡・バー
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-3 px-3 text-[#57534E] text-xs">
                            鏡：{room.mirror.available ? 'あり' : 'なし'} ／ バー：
                            {room.barre.available ? 'あり' : 'なし'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          防音・ドラム
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-3 px-3 text-[#57534E] text-xs">
                            <span className="font-semibold text-[#1C1917] block">
                              {room.drumsAllowed ? 'ドラム・打楽器可' : 'ドラム不可'}
                            </span>
                            <span>{room.soundproofing.level}</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          ピアノ・アンプ
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-3 px-3 text-[#57534E] text-xs">
                            ピアノ：{room.piano.available ? room.piano.type : 'なし'}
                            <br />
                            アンプ：{room.ampsAvailable ? '常設あり' : 'なし'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          登録・利用条件
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-3 px-3 text-[#57534E] text-xs">
                            区外：{room.outsideWardAllowed ? '可' : '不可'} ／ 個人：
                            {room.individualAllowed ? '可' : '不可'}
                            <br />
                            登録：{REGISTRATION_BARRIER_LABELS[room.registrationBarrier]}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-3 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          主な注意事項
                        </th>
                        {compareRooms.map((room) => (
                          <td
                            key={room.id}
                            className="py-3 px-3 text-[#92400E] text-xs leading-relaxed"
                          >
                            {room.cautionsSummary}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white py-4 pr-4 text-left text-xs font-semibold text-[#57534E]">
                          詳細ページ
                        </th>
                        {compareRooms.map((room) => (
                          <td key={room.id} className="py-4 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectRoom(room.id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <span>詳細を見る</span>
                              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
