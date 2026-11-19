import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  MapPin,
  MinusCircle,
  X,
} from 'lucide-react';
import { RoomRecord } from '../types/facility';
import { formatRoomShareText, getRelatedRooms } from '../utils/searchFilter';
import { RoomAccessMap } from './RoomAccessMap';
import { RoomCard } from './RoomCard';
import { SafeRoomImage } from './SafeRoomImage';

interface RoomDetailPageProps {
  room: RoomRecord | undefined;
  allRooms: RoomRecord[];
  compareIds: string[];
  quotaExceeded: boolean;
  onToggleCompare: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
  onBackToSearch: () => void;
}

export function RoomDetailPage({
  room,
  allRooms,
  compareIds,
  quotaExceeded,
  onToggleCompare,
  onSelectRoom,
  onBackToSearch,
}: RoomDetailPageProps) {
  const [linkDialog, setLinkDialog] = useState<{
    label: string;
    url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setCopied(false);
  }, [room?.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (linkDialog && !dialog.open) {
      dialog.showModal();
    } else if (!linkDialog && dialog.open) {
      dialog.close();
    }
  }, [linkDialog]);

  if (!room) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          指定された部屋情報が見つかりませんでした
        </h1>
        <p className="text-sm text-slate-600">
          URLが変更されたか、該当する部屋IDが存在しない可能性があります。
        </p>
        <button
          type="button"
          onClick={onBackToSearch}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>施設検索ページへ戻る</span>
        </button>
      </div>
    );
  }

  const categoryLabel =
    room.facilityCategory === 'public' ? '公共施設' : '民間レンタルスペース';
  const isCompared = compareIds.includes(room.id);
  const canAddCompare = compareIds.length < 3;
  const relatedRooms = getRelatedRooms(room, allRooms, 3);

  const handleCopyShare = async () => {
    const shareText = formatRoomShareText(room, window.location.href);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const quickChecks = [
    { label: '壁面鏡', ok: room.mirror.available, value: room.mirror.available ? 'あり' : 'なし' },
    { label: 'ドラム・打楽器', ok: room.drumsAllowed, value: room.drumsAllowed ? '使用可' : '使用不可' },
    { label: 'ピアノ', ok: room.piano.available, value: room.piano.available ? 'あり' : 'なし' },
    { label: '区外利用', ok: room.outsideWardAllowed, value: room.outsideWardAllowed ? '可能' : '区内限定' },
    { label: '個人利用', ok: room.individualAllowed, value: room.individualAllowed ? '可能' : '団体のみ' },
    { label: '団体登録', ok: !room.groupRegistrationRequired, value: room.groupRegistrationRequired ? '事前登録要' : '不要' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Back navigation & utility actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToSearch}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>検索結果に戻る</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span className="text-teal-800">共有用テキストをコピーしました</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>部屋情報をコピー</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleCompare(room.id)}
            disabled={!isCompared && !canAddCompare}
            aria-pressed={isCompared}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              isCompared
                ? 'bg-slate-900 text-white border-slate-900 cursor-pointer'
                : canAddCompare
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>比較リストに追加済</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                <span>比較に追加</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {room.isSampleData ? (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-slate-700">
          <Info
            className="w-4 h-4 text-slate-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            <strong className="font-semibold text-slate-900">サンプル情報：</strong>
            この施設および部屋の料金・設備・予約条件は動作確認用の架空データです。実在施設の確定情報ではありません。
          </p>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-slate-700">
          <Info
            className="w-4 h-4 text-slate-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            <strong className="font-semibold text-slate-900">予約前のご確認：</strong>
            掲載情報は各施設の公式サイト等の公開情報をもとに整理しています（最終確認日：
            <span className="tabular-nums">{room.lastVerifiedAt}</span>
            ）。最新の空き状況・料金改定・利用規約は必ず公式サイトをご確認ください。
          </p>
        </div>
      )}

      {/* Main Header & Visual */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 aspect-[4/3] lg:aspect-auto bg-slate-100">
            <SafeRoomImage
              src={room.imageUrl}
              alt={`${room.facilityName} ${room.roomName}`}
              fallbackTitle={`${room.facilityName} / ${room.roomName}`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-teal-800">
                  {categoryLabel}
                </span>
                {room.isSampleData && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>サンプル情報</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{room.ward}</span>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">
                  {room.facilityName}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1 leading-tight text-balance">
                  {room.roomName}
                </h1>
              </div>

              <div className="space-y-1.5 text-sm text-slate-700 pt-1">
                <div className="flex items-start gap-2">
                  <MapPin
                    className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p>{room.nearestStation}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <p className="text-xs text-slate-500">{room.address}</p>
                      <button
                        type="button"
                        onClick={() => {
                          document
                            .getElementById('access-map-section')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                      >
                        周辺マップ・駅を見る
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-700">
                <span className="text-slate-500">利用可能な用途：</span>
                <span className="font-medium">{room.purposes.join(' · ')}</span>
              </div>
            </div>

            {/* Key stats & Official link buttons */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">1時間料金目安</dt>
                  <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                    ¥{room.hourlyRateMin.toLocaleString()}〜
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">広さ</dt>
                  <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                    {room.areaSqm}㎡
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">定員</dt>
                  <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                    {room.capacity}名
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col sm:flex-row gap-3">
                {room.isSampleData ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLinkDialog({
                          label: '公式予約ページ（サンプル）',
                          url: room.officialBookingUrl,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>公式予約ページ</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLinkDialog({
                          label: '施設の公式サイト（サンプル）',
                          url: room.officialSiteUrl,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>施設の公式サイト</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={room.officialBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <span>公式予約ページ</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                    <a
                      href={room.officialSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <span>施設の公式サイト</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Condition Checklist Strip */}
      <section aria-label="設備・利用条件の早見表" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickChecks.map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 flex flex-col justify-between gap-1"
          >
            <span className="text-[11px] font-medium text-slate-500">
              {item.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
              {item.ok ? (
                <CheckCircle2
                  className="w-4 h-4 text-teal-700 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <MinusCircle
                  className="w-4 h-4 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>{item.value}</span>
            </span>
          </div>
        ))}
      </section>

      {/* Prominent Cautions Callout */}
      <section
        aria-labelledby="cautions-heading"
        className="bg-amber-50 border border-amber-300 rounded-xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2.5 text-amber-950">
          <AlertTriangle
            className="w-5 h-5 text-amber-700 shrink-0"
            aria-hidden="true"
          />
          <h2 id="cautions-heading" className="text-base font-bold">
            利用制限・重要な注意事項
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-amber-950 leading-relaxed list-disc pl-5">
          {room.cautions.map((caution, idx) => (
            <li key={idx}>{caution}</li>
          ))}
        </ul>
      </section>

      {/* Room Specifications Table */}
      <section
        aria-labelledby="specs-heading"
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <h2
          id="specs-heading"
          className="font-display text-lg font-bold text-slate-900"
        >
          設備・部屋スペック詳細
        </h2>
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">広さ・定員</dt>
            <dd className="sm:col-span-2 text-slate-900 tabular-nums">
              {room.areaSqm}㎡ ／ 定員 {room.capacity}名
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">床材</dt>
            <dd className="sm:col-span-2 text-slate-900">{room.flooring}</dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">鏡の有無</dt>
            <dd className="sm:col-span-2 text-slate-900">
              <span className="font-semibold">
                {room.mirror.available ? 'あり' : 'なし'}
              </span>
              {room.mirror.available && ` — ${room.mirror.description}`}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">レッスンバー</dt>
            <dd className="sm:col-span-2 text-slate-900">
              {room.barre.available ? room.barre.description : 'なし'}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">防音性能</dt>
            <dd className="sm:col-span-2 text-slate-900 space-y-1">
              <p className="font-semibold">{room.soundproofing.level}</p>
              <p className="text-slate-600">{room.soundproofing.description}</p>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">ドラム・打楽器の使用可否</dt>
            <dd className="sm:col-span-2 text-slate-900 space-y-1">
              <p className="font-semibold">
                {room.drumsAllowed ? '使用可能' : '使用不可'}
              </p>
              <p className="text-slate-600">{room.drumsNote}</p>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">ピアノの種類</dt>
            <dd className="sm:col-span-2 text-slate-900">{room.piano.type}</dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">アンプ・音響設備</dt>
            <dd className="sm:col-span-2 text-slate-900">
              {room.audioEquipment}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">利用可能な用途</dt>
            <dd className="sm:col-span-2 text-slate-900">
              {room.purposes.join(' / ')}
            </dd>
          </div>
        </dl>
      </section>

      {/* Pricing & Reservation Rules */}
      <section
        aria-labelledby="rules-heading"
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-teal-800" aria-hidden="true" />
          <h2
            id="rules-heading"
            className="font-display text-lg font-bold text-slate-900"
          >
            利用料金・登録・抽選予約ルール
          </h2>
        </div>

        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">利用料金</dt>
            <dd className="sm:col-span-2 text-slate-900 tabular-nums">
              {room.pricingNote}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">利用区分（区外・個人）</dt>
            <dd className="sm:col-span-2 text-slate-900 flex flex-wrap gap-x-6 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    room.outsideWardAllowed ? 'text-teal-700' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                区外利用：{room.outsideWardAllowed ? '可能' : '不可（区内限定）'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    room.individualAllowed ? 'text-teal-700' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                個人利用：{room.individualAllowed ? '可能' : '不可（団体のみ）'}
              </span>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">団体登録の必要性・登録方法</dt>
            <dd className="sm:col-span-2 text-slate-900 space-y-1">
              <p className="font-semibold">
                {room.groupRegistrationRequired ? '団体登録が必要' : '団体登録不要'}
              </p>
              <p className="text-slate-600">{room.registrationRule}</p>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">抽選・予約ルール</dt>
            <dd className="sm:col-span-2 text-slate-900">
              {room.reservationRule}
            </dd>
          </div>
        </dl>
      </section>

      {/* Metadata / Verification Info */}
      <section
        aria-labelledby="source-heading"
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <h2
          id="source-heading"
          className="font-display text-lg font-bold text-slate-900"
        >
          基本情報・出典
        </h2>
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">所在地</dt>
            <dd className="sm:col-span-2 text-slate-900">{room.address}</dd>
          </div>
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">最寄り駅</dt>
            <dd className="sm:col-span-2 text-slate-900">
              {room.nearestStation}
            </dd>
          </div>
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">最終確認日</dt>
            <dd className="sm:col-span-2 text-slate-900 tabular-nums">
              {room.lastVerifiedAt}
              {room.isSampleData && '（サンプル確認日）'}
            </dd>
          </div>
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-slate-600">情報の出典</dt>
            <dd className="sm:col-span-2 text-slate-900">{room.sourceInfo}</dd>
          </div>
        </dl>
      </section>

      {/* Access & Transit Proximity Map */}
      <RoomAccessMap room={room} quotaExceeded={quotaExceeded} />

      {/* Related Rooms */}
      {relatedRooms.length > 0 && (
        <section aria-labelledby="related-heading" className="pt-4 space-y-5">
          <div>
            <h2
              id="related-heading"
              className="font-display text-xl font-bold text-slate-900"
            >
              似た条件・用途の他の部屋{room.isSampleData ? '（サンプル情報）' : ''}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              条件や利用ルールを見比べたい場合は、あわせてご確認ください。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedRooms.map((candidate) => (
              <RoomCard
                key={candidate.id}
                room={candidate}
                onSelectRoom={onSelectRoom}
                isCompared={compareIds.includes(candidate.id)}
                canAddCompare={compareIds.length < 3}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sample External Link Notice Dialog */}
      <dialog
        ref={dialogRef}
        onClose={() => setLinkDialog(null)}
        aria-labelledby="sample-link-dialog-title"
        className="m-auto max-w-md w-[calc(100%-2rem)] rounded-xl border border-slate-200 bg-white p-6 shadow-lg backdrop:bg-slate-900/40"
      >
        {linkDialog && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3
                id="sample-link-dialog-title"
                className="text-base font-bold text-slate-900"
              >
                {linkDialog.label}
              </h3>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setLinkDialog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              現在は動作確認用のサンプルデータを表示しているため、実際の外部施設URLには遷移しません。実データ導入時には以下の形式で各施設の公式ページへリンクされます。
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono-num text-slate-700 break-all">
              {linkDialog.url}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLinkDialog(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                確認しました
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
