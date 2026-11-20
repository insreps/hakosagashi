import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Calculator,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flag,
  Heart,
  Info,
  MapPin,
  MinusCircle,
  X,
} from 'lucide-react';
import { REGISTRATION_BARRIER_LABELS, RoomRecord } from '../types/facility';
import {
  buildBookingReminderIcs,
  calculateReservationOpenDate,
} from '../utils/icsGenerator';
import {
  estimateRoomSessionCost,
  SESSION_DAY_TYPE_LABELS,
  SessionDayType,
} from '../utils/priceCalculator';
import { formatRoomShareText, getRelatedRooms } from '../utils/searchFilter';
import { RoomAccessMap } from './RoomAccessMap';
import { RoomCard } from './RoomCard';
import { SafeRoomImage } from './SafeRoomImage';

interface RoomDetailPageProps {
  room: RoomRecord | undefined;
  allRooms: RoomRecord[];
  compareIds: string[];
  favoriteIds: string[];
  quotaExceeded: boolean;
  onToggleCompare: (roomId: string) => void;
  onToggleFavorite: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
  onBackToSearch: () => void;
}

function getDefaultPracticeDateIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function isVerificationStale(lastVerifiedAt: string): boolean {
  const verifiedTime = Date.parse(lastVerifiedAt);
  if (Number.isNaN(verifiedTime)) return false;
  const daysElapsed = (Date.now() - verifiedTime) / (1000 * 60 * 60 * 24);
  return daysElapsed > 120;
}

export function RoomDetailPage({
  room,
  allRooms,
  compareIds,
  favoriteIds,
  quotaExceeded,
  onToggleCompare,
  onToggleFavorite,
  onSelectRoom,
  onBackToSearch,
}: RoomDetailPageProps) {
  const [copied, setCopied] = useState(false);

  // Cost Simulator State
  const [dayType, setDayType] = useState<SessionDayType>('weekend_day');
  const [hours, setHours] = useState<number>(3);
  const [participants, setParticipants] = useState<number>(8);
  const [commercialEvent, setCommercialEvent] = useState<boolean>(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  // Calendar Reminder State
  const [practiceDateIso, setPracticeDateIso] = useState<string>(() =>
    getDefaultPracticeDateIso()
  );

  // Report Correction Dialog State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('料金・時間区分の改定');
  const [reportNote, setReportNote] = useState('');
  const [reportCopied, setReportCopied] = useState(false);
  const reportDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setCopied(false);
    setSelectedOptionIds([]);
    setCommercialEvent(false);
    if (room) {
      setParticipants(Math.min(8, room.capacity));
    }
  }, [room?.id, room?.capacity]);

  useEffect(() => {
    const dialog = reportDialogRef.current;
    if (!dialog) return;
    if (reportOpen && !dialog.open) {
      dialog.showModal();
    } else if (!reportOpen && dialog.open) {
      dialog.close();
    }
  }, [reportOpen]);

  const costEstimate = useMemo(() => {
    if (!room) return null;
    return estimateRoomSessionCost(room, {
      dayType,
      hours,
      participants,
      commercialEvent,
      selectedOptionIds,
    });
  }, [room, dayType, hours, participants, commercialEvent, selectedOptionIds]);

  const bookingOpenEstimate = useMemo(() => {
    if (!room) return null;
    return calculateReservationOpenDate(practiceDateIso, room.reservationLeadMeta);
  }, [room, practiceDateIso]);

  if (!room) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-5">
        <p className="text-xs font-semibold text-[#0D5C53]">部屋情報が見つかりません</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917]">
          指定された部屋情報が見つかりませんでした
        </h1>
        <p className="text-sm text-[#57534E] leading-relaxed">
          URLが変更されたか、該当する部屋IDが存在しない可能性があります。一覧ページから条件に合う部屋をお探しください。
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToSearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>施設検索ページへ戻る</span>
          </button>
          <a
            href="#/"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-[#1C1917] bg-white hover:bg-[#F2EFE9] border border-[#DED8CE] rounded-md transition-colors"
          >
            トップページへ
          </a>
        </div>
      </div>
    );
  }

  const categoryLabel =
    room.facilityCategory === 'public' ? '公共施設' : '民間レンタルスペース';
  const isCompared = compareIds.includes(room.id);
  const canAddCompare = compareIds.length < 3;
  const isFavorite = favoriteIds.includes(room.id);
  const relatedRooms = getRelatedRooms(room, allRooms, 3);
  const sameOfficialUrl = room.officialBookingUrl === room.officialSiteUrl;
  const staleCheck = isVerificationStale(room.lastVerifiedAt);

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

  const handleDownloadIcs = () => {
    if (!bookingOpenEstimate) return;
    const icsContent = buildBookingReminderIcs(
      room,
      practiceDateIso,
      bookingOpenEstimate.openDateIso,
      window.location.href
    );
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hakosagashi-${room.id}-${bookingOpenEstimate.openDateIso}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopyReport = async (e: FormEvent) => {
    e.preventDefault();
    const text = [
      '【HakoSagashi 情報修正・更新リクエスト】',
      `対象施設: ${room.facilityName}`,
      `対象部屋: ${room.roomName} (ID: ${room.id})`,
      `種別: ${reportCategory}`,
      `内容: ${reportNote.trim() || '（未記入）'}`,
      `確認日: ${new Date().toISOString().slice(0, 10)}`,
      `ページURL: ${window.location.href}`,
    ].join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setReportCopied(true);
      window.setTimeout(() => setReportCopied(false), 3000);
    } catch {
      setReportCopied(true);
      window.setTimeout(() => setReportCopied(false), 3000);
    }
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
      {/* Back navigation & utility actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToSearch}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>検索結果に戻る</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(room.id)}
            aria-pressed={isFavorite}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              isFavorite
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-[#1C1917] border-[#DED8CE] hover:bg-[#F2EFE9]'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span>{isFavorite ? 'お気に入り済' : 'お気に入り'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-white hover:bg-[#F2EFE9] border border-[#DED8CE] rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0D5C53]" aria-hidden="true" />
                <span className="text-[#0D5C53]">共有用テキストをコピーしました</span>
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
            aria-pressed={isCompared}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              isCompared
                ? 'bg-[#1C1917] text-white border-[#1C1917]'
                : canAddCompare
                  ? 'bg-white text-[#1C1917] border-[#DED8CE] hover:bg-[#F2EFE9]'
                  : 'bg-[#F2EFE9] text-[#78716C] border-[#DED8CE] hover:bg-[#ECE7DF]'
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
                <span>{canAddCompare ? '比較に追加' : '比較上限（3室）'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unboxed Hairline Verification Note */}
      <div
        className={`pb-4 border-b flex items-start gap-2 text-xs ${
          staleCheck
            ? 'border-[#F5E1A4] text-[#92400E]'
            : 'border-[#E4DFD7] text-[#57534E]'
        }`}
      >
        <Info
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            staleCheck ? 'text-[#B45309]' : 'text-[#0D5C53]'
          }`}
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong className="font-semibold text-[#1C1917]">予約前のご確認：</strong>
          掲載情報は各施設の公式サイト等の公開情報をもとに整理しています（最終確認日：
          <span className="tabular-nums font-medium text-[#1C1917]">{room.lastVerifiedAt}</span>
          {staleCheck ? ' · 確認から日数が経過しているため最新情報を再確認ください' : ' · 最新確認済'}
          ）。最新の空き状況・料金改定・利用規約は必ず公式サイトをご確認ください。
        </p>
      </div>

      {/* Main Header & Visual Dossier */}
      <section className="bg-white border border-[#DED8CE] rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col bg-[#F2EFE9] border-b lg:border-b-0 lg:border-r border-[#E4DFD7]">
            <div className="aspect-[4/3] lg:flex-1 overflow-hidden">
              <SafeRoomImage
                src={room.imageUrl}
                alt={`${room.facilityName} ${room.roomName}の設備種別イメージ`}
                fallbackTitle={`${room.facilityName} / ${room.roomName}`}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="px-4 py-2 text-[11px] text-[#57534E] bg-[#FAF8F5] border-t border-[#E4DFD7]">
              ※ 写真は設備種別のイメージです。実際の室内の広さ・備品配置は公式サイトをご確認ください。
            </p>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E]">
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

              <div>
                <p className="text-sm font-medium text-[#57534E]">
                  {room.facilityName}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1 leading-tight text-balance">
                  {room.roomName}
                </h1>
              </div>

              <div className="space-y-1.5 text-sm text-[#1C1917] pt-1">
                <div className="flex items-start gap-2">
                  <MapPin
                    className="w-4 h-4 text-[#78716C] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p>{room.nearestStation}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <p className="text-xs text-[#57534E]">{room.address}</p>
                      <button
                        type="button"
                        onClick={() => {
                          document
                            .getElementById('access-map-section')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="text-xs font-semibold text-[#0D5C53] hover:underline cursor-pointer"
                      >
                        周辺マップ・駅を見る
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-[#1C1917]">
                <span className="text-[#57534E]">利用可能な用途：</span>
                <span className="font-medium">{room.purposes.join(' · ')}</span>
              </div>
            </div>

            {/* Key stats & Official link buttons */}
            <div className="space-y-4 pt-4 border-t border-[#ECE7DF]">
              <dl className="grid grid-cols-3 divide-x divide-[#ECE7DF] text-sm">
                <div className="pr-3">
                  <dt className="text-xs text-[#57534E]">1時間料金目安</dt>
                  <dd className="font-bold text-[#1C1917] tabular-nums mt-0.5">
                    ¥{room.hourlyRateMin.toLocaleString()}〜
                  </dd>
                </div>
                <div className="px-3">
                  <dt className="text-xs text-[#57534E]">広さ</dt>
                  <dd className="font-bold text-[#1C1917] tabular-nums mt-0.5">
                    {room.areaSqm}㎡
                  </dd>
                </div>
                <div className="pl-3">
                  <dt className="text-xs text-[#57534E]">定員</dt>
                  <dd className="font-bold text-[#1C1917] tabular-nums mt-0.5">
                    {room.capacity}名
                  </dd>
                </div>
              </dl>

              {sameOfficialUrl ? (
                <div className="space-y-1.5">
                  <a
                    href={room.officialSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors whitespace-nowrap"
                  >
                    <span>公式サイト・予約案内を開く</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <p className="text-[11px] text-[#57534E]">
                    予約方式：{REGISTRATION_BARRIER_LABELS[room.registrationBarrier]}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={room.officialBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors whitespace-nowrap"
                  >
                    <span>公式予約ページ</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <a
                    href={room.officialSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#1C1917] bg-white hover:bg-[#F2EFE9] border border-[#DED8CE] rounded-md transition-colors whitespace-nowrap"
                  >
                    <span>施設の公式サイト</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Condition Checklist Strip: Unified hairline grid instead of 6 cloned boxes */}
      <section
        aria-label="設備・利用条件の早見表"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#E4DFD7] border border-[#E4DFD7] rounded-lg overflow-hidden"
      >
        {quickChecks.map((item) => (
          <div
            key={item.label}
            className="bg-white px-4 py-3.5 flex flex-col justify-between gap-1.5"
          >
            <span className="text-[11px] font-medium text-[#57534E]">
              {item.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
              {item.ok ? (
                <CheckCircle2
                  className="w-4 h-4 text-[#0D5C53] shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <MinusCircle
                  className="w-4 h-4 text-[#A8A29E] shrink-0"
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
        className="bg-[#FFFBEB] border border-[#F5D67B] rounded-lg p-6 space-y-3"
      >
        <div className="flex items-center gap-2.5 text-[#78350F]">
          <AlertTriangle
            className="w-5 h-5 text-[#B45309] shrink-0"
            aria-hidden="true"
          />
          <h2 id="cautions-heading" className="text-base font-bold">
            利用制限・重要な注意事項
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-[#78350F] leading-relaxed list-disc pl-5">
          {room.cautions.map((caution, idx) => (
            <li key={idx}>{caution}</li>
          ))}
        </ul>
      </section>

      {/* Interactive Cost & Per-Person Split Simulator: Warm stone tactile console */}
      {costEstimate && (
        <section
          aria-labelledby="cost-sim-heading"
          className="bg-[#F2EFE9]/90 border border-[#DED8CE] rounded-lg p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-[#0D5C53]" aria-hidden="true" />
            <div>
              <h2
                id="cost-sim-heading"
                className="font-display text-lg font-bold text-[#1C1917]"
              >
                利用料金・割り勘シミュレーター
              </h2>
              <p className="text-xs text-[#57534E]">
                時間帯・利用時間・参加人数を入力して、合計目安と1人あたりの負担額を試算できます。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <label htmlFor="sim-daytype" className="block text-xs font-medium text-[#57534E] mb-1">
                曜日・時間帯
              </label>
              <select
                id="sim-daytype"
                value={dayType}
                onChange={(e) => setDayType(e.target.value as SessionDayType)}
                className="w-full px-3 py-2 bg-white border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#0D5C53]"
              >
                {(Object.keys(SESSION_DAY_TYPE_LABELS) as SessionDayType[]).map((k) => (
                  <option key={k} value={k}>
                    {SESSION_DAY_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sim-hours" className="block text-xs font-medium text-[#57534E] mb-1">
                利用時間
              </label>
              <select
                id="sim-hours"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#DED8CE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#0D5C53]"
              >
                {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                  <option key={h} value={h}>
                    {h}時間
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sim-participants" className="block text-xs font-medium text-[#57534E] mb-1">
                参加人数（名）
              </label>
              <input
                id="sim-participants"
                type="number"
                min={1}
                max={300}
                value={participants}
                onChange={(e) =>
                  setParticipants(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full px-3 py-2 bg-white border border-[#DED8CE] rounded-md text-[#1C1917] tabular-nums focus:outline-none focus:border-[#0D5C53]"
              />
            </div>

            <div className="flex items-end">
              {room.pricingModel.commercialMultiplier ? (
                <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={commercialEvent}
                    onChange={(e) => setCommercialEvent(e.target.checked)}
                    className="w-4 h-4 accent-[#0D5C53] rounded"
                  />
                  <span>入場料・参加費徴収あり（×{room.pricingModel.commercialMultiplier}）</span>
                </label>
              ) : (
                <span className="text-xs text-[#57534E] py-2">
                  ※ 営利規定は公式規約をご参照ください
                </span>
              )}
            </div>
          </div>

          {room.pricingModel.paidOptions && room.pricingModel.paidOptions.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-3">
              {room.pricingModel.paidOptions.map((opt) => (
                <label
                  key={opt.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DED8CE] rounded-md text-xs text-[#1C1917] cursor-pointer hover:border-[#0D5C53]"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptionIds.includes(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                    className="w-3.5 h-3.5 accent-[#0D5C53] rounded"
                  />
                  <span>
                    {opt.label}（+¥{opt.price.toLocaleString()}
                    {opt.unit === 'per_hour' ? '/h' : ''}）
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-[#DED8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[#09433D] font-medium">
                試算内訳：{costEstimate.appliedUnitsLabel}
                {costEstimate.optionsCostYen > 0 &&
                  ` ＋ 付帯機材 ¥${costEstimate.optionsCostYen.toLocaleString()}`}
              </p>
              {costEstimate.capacityWarning && (
                <p className="text-xs font-semibold text-[#92400E]">
                  ※ {costEstimate.capacityWarning}
                </p>
              )}
            </div>
            <div className="flex items-baseline gap-6 shrink-0 tabular-nums">
              <div>
                <span className="block text-[11px] text-[#57534E]">合計目安</span>
                <span className="text-xl font-bold text-[#1C1917]">
                  ¥{costEstimate.totalYen.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#0D5C53] font-medium">1人あたり</span>
                <span className="text-2xl font-bold text-[#0D5C53]">
                  ¥{costEstimate.perPersonYen.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Room Specifications Table: Open editorial specification table directly on canvas */}
      <section aria-labelledby="specs-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="specs-heading"
            className="font-display text-lg font-bold text-[#1C1917]"
          >
            設備・部屋スペック詳細
          </h2>
          <span className="text-xs text-[#78716C]">
            部屋固有仕様
          </span>
        </div>
        <dl className="border-y border-[#E4DFD7] divide-y divide-[#E4DFD7] text-sm">
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">広さ・定員</dt>
            <dd className="sm:col-span-2 text-[#1C1917] tabular-nums">
              {room.areaSqm}㎡ ／ 定員 {room.capacity}名
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">床材</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">{room.flooring}</dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">鏡の有無</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">
              <span className="font-semibold">
                {room.mirror.available ? 'あり' : 'なし'}
              </span>
              {room.mirror.available && ` — ${room.mirror.description}`}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">レッスンバー</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">
              {room.barre.available ? room.barre.description : 'なし'}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">防音性能</dt>
            <dd className="sm:col-span-2 text-[#1C1917] space-y-1">
              <p className="font-semibold">{room.soundproofing.level}</p>
              <p className="text-[#57534E]">{room.soundproofing.description}</p>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">ドラム・打楽器の使用可否</dt>
            <dd className="sm:col-span-2 text-[#1C1917] space-y-1">
              <p className="font-semibold">
                {room.drumsAllowed ? '使用可能' : '使用不可'}
              </p>
              <p className="text-[#57534E]">{room.drumsNote}</p>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">ピアノの種類</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">{room.piano.type}</dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">アンプ・音響設備</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">
              {room.audioEquipment}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">利用可能な用途</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">
              {room.purposes.join(' / ')}
            </dd>
          </div>
        </dl>
      </section>

      {/* Pricing, Connected 3-Step Booking Guide & ICS Reminder */}
      <section
        aria-labelledby="rules-heading"
        className="bg-white border border-[#DED8CE] rounded-lg p-6 space-y-6"
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#0D5C53]" aria-hidden="true" />
          <h2
            id="rules-heading"
            className="font-display text-lg font-bold text-[#1C1917]"
          >
            予約手順・利用料金・抽選ルール
          </h2>
        </div>

        {/* Connected 3-step guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#E4DFD7] border border-[#E4DFD7] rounded-md overflow-hidden">
          <div className="bg-[#FAF8F5] p-4 space-y-1.5">
            <span className="font-mono-num text-[11px] font-semibold text-[#0D5C53]">
              STEP 1 · 登録・申請準備
            </span>
            <p className="text-sm font-bold text-[#1C1917]">
              {REGISTRATION_BARRIER_LABELS[room.registrationBarrier]}
            </p>
            <p className="text-xs text-[#57534E] leading-relaxed">
              {room.registrationRule}
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-4 space-y-1.5">
            <span className="font-mono-num text-[11px] font-semibold text-[#0D5C53]">
              STEP 2 · 受付開始タイミング
            </span>
            <p className="text-sm font-bold text-[#1C1917]">
              {room.reservationLeadMeta.releaseDayNote}
            </p>
            <p className="text-xs text-[#57534E] leading-relaxed">
              {room.reservationRule}
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-4 space-y-1.5">
            <span className="font-mono-num text-[11px] font-semibold text-[#0D5C53]">
              STEP 3 · 当日の確認・精算
            </span>
            <p className="text-sm font-bold text-[#1C1917]">
              {room.outsideWardAllowed ? '区外・市外利用OK' : '区内・市内限定'}
            </p>
            <p className="text-xs text-[#57534E] leading-relaxed">
              {room.cautionsSummary}
            </p>
          </div>
        </div>

        {/* Reservation Release Date + .ics Calendar Export */}
        {bookingOpenEstimate && (
          <div className="bg-[#FAF8F5] border border-[#E4DFD7] rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="practice-date-input"
                  className="text-xs font-semibold text-[#1C1917]"
                >
                  利用予定日から予約解禁日を確認：
                </label>
                <input
                  id="practice-date-input"
                  type="date"
                  value={practiceDateIso}
                  onChange={(e) => {
                    if (e.target.value) setPracticeDateIso(e.target.value);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#DED8CE] rounded-md text-[#1C1917] tabular-nums focus:outline-none focus:border-[#0D5C53]"
                />
              </div>
              <p className="text-xs text-[#57534E]">
                予約目安日：
                <strong className="text-[#0D5C53] font-bold tabular-nums ml-1">
                  {bookingOpenEstimate.openDateIso}
                </strong>
                <span className="ml-2">
                  （{bookingOpenEstimate.ruleSummary}）
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0D5C53] bg-white hover:bg-[#EEF6F4] border border-[#C5DFDA] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" aria-hidden="true" />
              <span>カレンダーに予約リマインダーを追加 (.ics)</span>
            </button>
          </div>
        )}

        <dl className="divide-y divide-[#ECE7DF] text-sm">
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">利用料金詳細</dt>
            <dd className="sm:col-span-2 text-[#1C1917] tabular-nums">
              {room.pricingNote}
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">利用区分（区外・個人）</dt>
            <dd className="sm:col-span-2 text-[#1C1917] flex flex-wrap gap-x-6 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    room.outsideWardAllowed ? 'text-[#0D5C53]' : 'text-[#A8A29E]'
                  }`}
                  aria-hidden="true"
                />
                区外利用：{room.outsideWardAllowed ? '可能' : '不可（区内限定）'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    room.individualAllowed ? 'text-[#0D5C53]' : 'text-[#A8A29E]'
                  }`}
                  aria-hidden="true"
                />
                個人利用：{room.individualAllowed ? '可能' : '不可（団体のみ）'}
              </span>
            </dd>
          </div>
          <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">団体登録</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">
              {room.groupRegistrationRequired ? '団体登録が必要' : '団体登録不要'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Metadata / Verification Info: Open editorial section */}
      <section aria-labelledby="source-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="source-heading"
            className="font-display text-lg font-bold text-[#1C1917]"
          >
            基本情報・出典
          </h2>
          <button
            type="button"
            onClick={() => {
              setReportCopied(false);
              setReportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#0D5C53] cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>情報修正・料金改定を報告</span>
          </button>
        </div>
        <dl className="border-y border-[#E4DFD7] divide-y divide-[#E4DFD7] text-sm">
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">所在地</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">{room.address}</dd>
          </div>
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">最寄り駅</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">
              {room.nearestStation}
            </dd>
          </div>
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">最終確認日</dt>
            <dd className="sm:col-span-2 text-[#1C1917] tabular-nums">
              {room.lastVerifiedAt}
            </dd>
          </div>
          <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="font-medium text-[#57534E]">情報の出典</dt>
            <dd className="sm:col-span-2 text-[#1C1917]">{room.sourceInfo}</dd>
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
              className="font-display text-xl font-bold text-[#1C1917]"
            >
              似た条件・用途の他の部屋
            </h2>
            <p className="text-xs text-[#57534E] mt-1">
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
                isFavorite={favoriteIds.includes(candidate.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Report Correction Dialog */}
      <dialog
        ref={reportDialogRef}
        onClose={() => setReportOpen(false)}
        aria-labelledby="report-dialog-title"
        className="m-auto max-w-md w-[calc(100%-2rem)] rounded-lg border border-[#DED8CE] bg-white p-6 shadow-xl backdrop:bg-[#1C1917]/45"
      >
        {reportOpen && (
          <form onSubmit={handleCopyReport} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3
                id="report-dialog-title"
                className="text-base font-bold text-[#1C1917]"
              >
                掲載情報の修正リクエスト
              </h3>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setReportOpen(false)}
                className="p-1.5 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2EFE9] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-[#57534E] leading-relaxed">
              {room.facilityName}（{room.roomName}）について、料金改定・設備変更・リンク切れ等にお気づきの場合は下記テンプレートをコピーして運営窓口へお送りください。
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <label htmlFor="report-cat" className="block text-xs font-medium text-[#1C1917] mb-1">
                  修正種別
                </label>
                <select
                  id="report-cat"
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917]"
                >
                  <option value="料金・時間区分の改定">料金・時間区分の改定</option>
                  <option value="設備・備品情報の変更">設備・備品情報の変更</option>
                  <option value="利用ルール・リンク切れ">利用ルール・リンク切れ</option>
                </select>
              </div>
              <div>
                <label htmlFor="report-note" className="block text-xs font-medium text-[#1C1917] mb-1">
                  変更内容のメモ
                </label>
                <textarea
                  id="report-note"
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="例：令和8年4月より午後区分が3,600円に改定されています"
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DED8CE] rounded-md text-[#1C1917]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-3 py-2 text-xs font-medium text-[#57534E] hover:bg-[#F2EFE9] rounded-md cursor-pointer"
              >
                閉じる
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer"
              >
                {reportCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>報告文をコピーしました</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>報告内容をコピーする</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
