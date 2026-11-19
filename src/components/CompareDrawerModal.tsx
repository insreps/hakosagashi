import { useEffect, useRef } from 'react';
import { ArrowRight, Trash2, X } from 'lucide-react';
import { RoomRecord } from '../types/facility';

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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="compare-modal-title"
      className="m-auto max-w-5xl w-[calc(100%-1.5rem)] max-h-[88vh] rounded-xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2
              id="compare-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              選択した部屋の設備・条件比較
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              最大3室まで、広さ・料金・鏡・防音・利用ルールを横並びで比較できます。
            </p>
          </div>
          <button
            type="button"
            aria-label="比較表を閉じる"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-auto p-5 flex-1">
          {compareRooms.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">
              比較リストに部屋が追加されていません。
            </p>
          ) : (
            <div className="min-w-[640px]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 align-top">
                    <th className="w-36 py-3 pr-4 text-left text-xs font-semibold text-slate-500">
                      比較項目
                    </th>
                    {compareRooms.map((room) => (
                      <th
                        key={room.id}
                        className="py-3 px-3 text-left font-normal min-w-[200px]"
                      >
                        <div className="space-y-1">
                          <span className="block text-xs text-teal-800 font-medium">
                            {room.facilityCategory === 'public'
                              ? '公共施設'
                              : '民間スペース'}
                            {' · '}
                            {room.ward}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {room.facilityName}
                          </span>
                          <span className="block text-base font-bold text-slate-900">
                            {room.roomName}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveRoom(room.id)}
                            aria-label={`${room.roomName}を比較から外す`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 pt-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>外す</span>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      1時間料金目安
                    </th>
                    {compareRooms.map((room) => (
                      <td
                        key={room.id}
                        className="py-3 px-3 font-bold text-slate-900 tabular-nums"
                      >
                        ¥{room.hourlyRateMin.toLocaleString()}〜
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      広さ・定員
                    </th>
                    {compareRooms.map((room) => (
                      <td
                        key={room.id}
                        className="py-3 px-3 text-slate-800 tabular-nums"
                      >
                        {room.areaSqm}㎡ ／ {room.capacity}名
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      最寄り駅
                    </th>
                    {compareRooms.map((room) => (
                      <td key={room.id} className="py-3 px-3 text-slate-700 text-xs">
                        {room.nearestStation}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      床材
                    </th>
                    {compareRooms.map((room) => (
                      <td key={room.id} className="py-3 px-3 text-slate-700 text-xs">
                        {room.flooring}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      鏡・バー
                    </th>
                    {compareRooms.map((room) => (
                      <td key={room.id} className="py-3 px-3 text-slate-700 text-xs">
                        鏡：{room.mirror.available ? 'あり' : 'なし'} ／ バー：
                        {room.barre.available ? 'あり' : 'なし'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      防音・ドラム
                    </th>
                    {compareRooms.map((room) => (
                      <td key={room.id} className="py-3 px-3 text-slate-700 text-xs">
                        <span className="font-semibold block">
                          {room.drumsAllowed ? 'ドラム・打楽器可' : 'ドラム不可'}
                        </span>
                        <span className="text-slate-500">
                          {room.soundproofing.level}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      ピアノ・アンプ
                    </th>
                    {compareRooms.map((room) => (
                      <td key={room.id} className="py-3 px-3 text-slate-700 text-xs">
                        ピアノ：{room.piano.available ? room.piano.type : 'なし'}
                        <br />
                        アンプ：{room.ampsAvailable ? '常設あり' : 'なし'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      利用条件
                    </th>
                    {compareRooms.map((room) => (
                      <td key={room.id} className="py-3 px-3 text-slate-700 text-xs">
                        区外：{room.outsideWardAllowed ? '可' : '不可'} ／ 個人：
                        {room.individualAllowed ? '可' : '不可'}
                        <br />
                        団体登録：{room.groupRegistrationRequired ? '必要' : '不要'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-600">
                      主な注意事項
                    </th>
                    {compareRooms.map((room) => (
                      <td
                        key={room.id}
                        className="py-3 px-3 text-amber-950 bg-amber-50/60 text-xs leading-relaxed"
                      >
                        {room.cautionsSummary}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-4 pr-4 text-left text-xs font-semibold text-slate-600">
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
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
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
          )}
        </div>
      </div>
    </dialog>
  );
}
