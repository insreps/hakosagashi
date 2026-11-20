import { ArrowRight, CheckCircle2, Compass, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import {
  ALL_PURPOSES,
  DEFAULT_FILTERS,
  PurposeType,
  RoomRecord,
  SearchFilters,
} from '../types/facility';
import { RoomCard } from './RoomCard';
import { SafeRoomImage } from './SafeRoomImage';
import { TopSearchForm } from './TopSearchForm';

interface TopPageProps {
  rooms: RoomRecord[];
  compareIds: string[];
  favoriteIds: string[];
  onToggleCompare: (roomId: string) => void;
  onToggleFavorite: (roomId: string) => void;
  onSubmitSearch: (filters: SearchFilters) => void;
  onSelectPurpose: (purpose: PurposeType) => void;
  onSelectRoom: (roomId: string) => void;
  onViewAllRooms: () => void;
}

const PURPOSE_DESCRIPTIONS: Record<PurposeType, string> = {
  ダンス: '壁面鏡・レッスンバー・衝撃吸収床やリノリウム対応の部屋を探す',
  バンド: '防音構造・ドラムセット・ギター/ベースアンプ常設の部屋を探す',
  '吹奏楽・管弦楽': '大人数の合奏に対応できる広い部屋・打楽器や譜面台のある部屋を探す',
  'ピアノ・声楽': 'グランドピアノ・アップライトピアノ常設や個人練習向けの防音室を探す',
  演劇: '発声練習・立ち稽古・バミリ対応や遮光できる広い稽古場を探す',
  ヨガ: '無垢フローリングや静かな環境でマットを広げて使える部屋を探す',
};

export function TopPage({
  rooms,
  compareIds,
  favoriteIds,
  onToggleCompare,
  onToggleFavorite,
  onSubmitSearch,
  onSelectPurpose,
  onSelectRoom,
  onViewAllRooms,
}: TopPageProps) {
  const recommendedRooms = rooms
    .filter((r) => r.recommended)
    .sort((a, b) => a.recommendedOrder - b.recommendedOrder)
    .slice(0, 3);

  const purposeCounts = ALL_PURPOSES.reduce<Record<PurposeType, number>>(
    (acc, purpose) => {
      acc[purpose] = rooms.filter((r) => r.purposes.includes(purpose)).length;
      return acc;
    },
    {} as Record<PurposeType, number>
  );

  return (
    <div>
      {/* Hero Section: Warm architectural paper canvas with clean asymmetric split */}
      <section className="bg-[#FAF8F5] border-b border-[#E4DFD7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 lg:pt-14 lg:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 min-w-0 flex flex-col justify-center space-y-5">
              <p className="text-xs font-semibold tracking-wide text-[#0D5C53] leading-relaxed">
                <span className="inline-block">公共施設 × 民間レンタルスペース横断検索</span>
                <span className="hidden sm:inline mx-2 text-[#A8A29E]" aria-hidden="true">
                  ·
                </span>
                <span className="block sm:inline text-[#57534E] font-medium tabular-nums">
                  大阪市内エリア {rooms.length}室掲載中
                </span>
              </p>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#1C1917] leading-[1.18] tracking-tight text-balance">
                練習場所を探す手間と、
                <br className="hidden sm:inline" />
                予約前の不安をなくす。
              </h1>

              <p className="text-[15px] sm:text-[15.5px] text-[#57534E] leading-[1.75] max-w-xl">
                HakoSagashi（ハコさがし）は、ダンス・バンド・吹奏楽・演劇・ヨガなどの練習場所を、施設名だけでなく「鏡の有無」「床材」「防音性能」「ドラム可否」「団体登録や区外利用のルール」といった部屋単位の条件から探せるサービスです。
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 border-t border-[#E4DFD7] text-xs font-medium text-[#57534E]">
                <span className="whitespace-nowrap">部屋単位の設備比較</span>
                <span className="hidden sm:inline text-[#A8A29E]" aria-hidden="true">
                  ·
                </span>
                <span className="whitespace-nowrap">公共施設の抽選・登録ルール明記</span>
                <span className="hidden sm:inline text-[#A8A29E]" aria-hidden="true">
                  ·
                </span>
                <span className="whitespace-nowrap">割り勘試算・予約通知対応</span>
              </div>
            </div>

            <div className="lg:col-span-6 min-w-0">
              <div className="aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[290px] rounded-lg overflow-hidden border border-[#DED8CE] bg-[#F2EFE9]">
                <SafeRoomImage
                  src="/src/assets/images/hero_civic_arts_1795140072242.jpg"
                  alt="自然光が差し込む木目調の練習スタジオと多目的アトリウム"
                  fallbackTitle="HakoSagashi 練習スタジオイメージ"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Search Form Console */}
          <div className="mt-8 lg:mt-11">
            <TopSearchForm onSubmitSearch={onSubmitSearch} />
          </div>
        </div>
      </section>

      {/* Popular Purposes: Architectural Directory Index */}
      <section id="purposes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-semibold text-[#0D5C53] mb-1.5 tabular-nums">
              01 · ジャンル・活動内容別
            </p>
            <h2 className="font-display text-2xl sm:text-[1.75rem] font-bold text-[#1C1917] tracking-tight">
              人気の利用目的から探す
            </h2>
            <p className="text-sm text-[#57534E] mt-1.5">
              活動ジャンルに合った設備・防音条件を満たす部屋をすぐに見つけられます。
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAllRooms}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5C53] hover:text-[#09433D] cursor-pointer whitespace-nowrap self-start sm:self-auto group"
          >
            <span>すべての施設を見る</span>
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E4DFD7] border border-[#E4DFD7] rounded-lg overflow-hidden">
          {ALL_PURPOSES.map((purpose, idx) => (
            <button
              key={purpose}
              type="button"
              onClick={() => onSelectPurpose(purpose)}
              className="group text-left bg-white p-6 hover:bg-[#FAF8F5] transition-colors cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono-num text-[11px] font-medium text-[#78716C]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-base font-bold text-[#1C1917] group-hover:text-[#0D5C53] transition-colors">
                      {purpose}
                    </h3>
                  </div>
                  <span className="font-mono-num text-xs font-medium text-[#57534E] tabular-nums whitespace-nowrap">
                    {purposeCounts[purpose]}室
                  </span>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {PURPOSE_DESCRIPTIONS[purpose]}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D5C53]">
                <span>対応する部屋を見る</span>
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recommended Rooms: Warm stone surface band */}
      <section className="bg-[#F2EFE9]/80 border-y border-[#E4DFD7] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#0D5C53] mb-1.5 tabular-nums">
                02 · 代表的な掲載ルーム
              </p>
              <h2 className="font-display text-2xl sm:text-[1.75rem] font-bold text-[#1C1917] tracking-tight">
                おすすめの練習場所
              </h2>
              <p className="text-sm text-[#57534E] mt-1.5">
                設備内容・広さ・利用条件が分かりやすく、目的に合わせて選びやすい代表的な部屋です。
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onSubmitSearch({ ...DEFAULT_FILTERS, outsideWardOnly: true })
              }
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5C53] hover:text-[#09433D] cursor-pointer whitespace-nowrap self-start sm:self-auto group"
            >
              <span>区外利用可能な部屋を探す</span>
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelectRoom={onSelectRoom}
                isCompared={compareIds.includes(room.id)}
                canAddCompare={compareIds.length < 3}
                onToggleCompare={onToggleCompare}
                isFavorite={favoriteIds.includes(room.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features: Asymmetric 12-column editorial list */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <p className="text-xs font-semibold text-[#0D5C53] tabular-nums">
              03 · 部屋単位の情報整理
            </p>
            <h2 className="font-display text-2xl sm:text-[1.75rem] font-bold text-[#1C1917] tracking-tight leading-snug text-balance">
              HakoSagashiの特徴
            </h2>
            <p className="text-sm text-[#57534E] leading-[1.8]">
              従来の施設ポータルでは分かりにくかった「実際に練習できるかどうか」の判断材料を、部屋ごとに整理して掲載します。予約サイトへ遷移する前に、必要な条件をすべて確認できます。
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onViewAllRooms}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5C53] hover:text-[#09433D] cursor-pointer group"
              >
                <span>設備条件から探してみる</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 border-y border-[#E4DFD7] divide-y divide-[#E4DFD7]">
            <div className="py-7 first:pt-2 sm:flex items-start gap-6 space-y-3 sm:space-y-0">
              <div className="flex items-center gap-3 shrink-0 sm:w-20 pt-0.5 text-[#0D5C53]">
                <span className="font-mono-num text-sm font-semibold">01</span>
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#1C1917]">
                  鏡・床材・防音まで「部屋単位」で検索
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  施設全体ではなく部屋ごとに、壁面鏡の大きさ、レッスンバーの有無、フローリングやリノリウムの床材、ドラム・管楽器の音出し制限まで比較できます。
                </p>
              </div>
            </div>

            <div className="py-7 sm:flex items-start gap-6 space-y-3 sm:space-y-0">
              <div className="flex items-center gap-3 shrink-0 sm:w-20 pt-0.5 text-[#0D5C53]">
                <span className="font-mono-num text-sm font-semibold">02</span>
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#1C1917]">
                  見落としやすい制限・利用ルールを明記
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  「区外団体の利用可否」「事前の団体登録の必要性」「抽選申込の時期」「ヒールや松脂、大音量打楽器の禁止事項」など、予約前の不安を事前に解消します。
                </p>
              </div>
            </div>

            <div className="py-7 last:pb-2 sm:flex items-start gap-6 space-y-3 sm:space-y-0">
              <div className="flex items-center gap-3 shrink-0 sm:w-20 pt-0.5 text-[#0D5C53]">
                <span className="font-mono-num text-sm font-semibold">03</span>
                <Compass className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#1C1917]">
                  公共施設と民間スタジオを横断比較
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  1時間あたりの料金目安と広さ・定員を共通フォーマットで表示。コストを抑えたい定期練習も、直前予約したい個人練習も、同じ画面から探せます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How To Use: Connected architectural step strip on warm charcoal surface */}
      <section id="how-to-use" className="bg-[#1C1917] text-[#FAF8F5] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-white/15">
            <div>
              <p className="text-xs font-semibold text-[#66B8AD] mb-1.5 tabular-nums">
                04 · ご利用の流れ
              </p>
              <h2 className="font-display text-2xl sm:text-[1.75rem] font-bold tracking-tight">
                利用方法
              </h2>
              <p className="text-sm text-stone-300 mt-1.5">
                3つのステップで、練習目的に合う部屋を見つけられます。
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllRooms}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#0D5C53] hover:bg-[#117368] text-white rounded-md transition-colors cursor-pointer whitespace-nowrap self-start lg:self-auto"
            >
              <span>施設検索ページへ進む</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/15 pt-2">
            <div className="py-8 md:py-10 md:pr-8 space-y-3">
              <span className="font-mono-num text-xs font-semibold tracking-wider text-[#66B8AD]">
                STEP 01
              </span>
              <h3 className="text-base font-bold tracking-wide text-white">
                用途・設備・エリアで絞り込む
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                最寄り駅や区、利用目的、壁面鏡・ドラム・ピアノなどの必須設備、予算・人数・広さを組み合わせて検索します。
              </p>
            </div>

            <div className="py-8 md:py-10 md:px-8 space-y-3">
              <span className="font-mono-num text-xs font-semibold tracking-wider text-[#66B8AD]">
                STEP 02
              </span>
              <h3 className="text-base font-bold tracking-wide text-white">
                設備詳細と注意事項を確認する
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                部屋の詳細ページで、床材・防音性能・利用制限・登録方法・抽選ルール・最終確認日をチェックします。
              </p>
            </div>

            <div className="py-8 md:py-10 md:pl-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-num text-xs font-semibold tracking-wider text-[#66B8AD]">
                  STEP 03
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#66B8AD]" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold tracking-wide text-white">
                公式予約ページから申し込む
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                条件に合う部屋が見つかったら、施設の公式サイト・公式予約ページへ進み、最新の空き状況を確認して予約します。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
