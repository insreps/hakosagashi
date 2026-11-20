import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface FooterProps {
  hasCompareBar?: boolean;
  onNavigateHome: (sectionId?: string) => void;
  onNavigateSearch: () => void;
}

export function Footer({
  hasCompareBar = false,
  onNavigateHome,
  onNavigateSearch,
}: FooterProps) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (policyOpen && !dialog.open) {
      dialog.showModal();
    } else if (!policyOpen && dialog.open) {
      dialog.close();
    }
  }, [policyOpen]);

  return (
    <footer
      className={`bg-[#F2EFE9] border-t border-[#E4DFD7] mt-16 ${
        hasCompareBar ? 'pb-14' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#DED8CE]">
          <div className="md:col-span-5 space-y-3">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="font-display text-lg font-bold tracking-tight text-[#1C1917] inline-block hover:text-[#0D5C53] transition-colors"
            >
              HakoSagashi（ハコさがし）
            </a>
            <p className="text-sm text-[#57534E] leading-relaxed max-w-md">
              練習場所を探す手間と、予約前の不安をなくす。大阪市内エリアの公共施設と民間レンタルスペースを、部屋単位の設備・利用条件で比較できる検索プラットフォームです。
            </p>
          </div>

          <div className="md:col-span-7 md:pl-12 grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold tracking-wider text-[#57534E]">
                ナビゲーション
              </p>
              <ul className="space-y-2 text-[#1C1917]">
                <li>
                  <a
                    href="#/"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateHome();
                    }}
                    className="hover:text-[#0D5C53] transition-colors"
                  >
                    トップページ
                  </a>
                </li>
                <li>
                  <a
                    href="#/search"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateSearch();
                    }}
                    className="hover:text-[#0D5C53] transition-colors"
                  >
                    施設・部屋を検索
                  </a>
                </li>
                <li>
                  <a
                    href="#purposes"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateHome('purposes');
                    }}
                    className="hover:text-[#0D5C53] transition-colors"
                  >
                    人気の利用目的
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold tracking-wider text-[#57534E]">
                サービスについて
              </p>
              <ul className="space-y-2 text-[#1C1917]">
                <li>
                  <a
                    href="#features"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateHome('features');
                    }}
                    className="hover:text-[#0D5C53] transition-colors"
                  >
                    HakoSagashiの特徴
                  </a>
                </li>
                <li>
                  <a
                    href="#how-to-use"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateHome('how-to-use');
                    }}
                    className="hover:text-[#0D5C53] transition-colors"
                  >
                    利用方法
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setPolicyOpen(true)}
                    className="hover:text-[#0D5C53] transition-colors text-left cursor-pointer"
                  >
                    掲載基準・データ出典について
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs text-[#57534E]">
          <div className="space-y-1.5 leading-relaxed">
            <p>
              ※ 掲載している施設・部屋情報は各施設の公式サイト等の公開情報をもとに整理しています。最新の空き状況・料金改定・利用規約は各施設の公式サイトをご確認ください。
            </p>
            <p>
              ※ 地図および周辺駅機能には Google Maps Platform を利用しており、
              <a
                href="https://maps.google.com/help/terms_maps/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#1C1917]"
              >
                Google マップ追加利用規約
              </a>
              および
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#1C1917]"
              >
                Google プライバシーポリシー
              </a>
              が適用されます。
            </p>
          </div>
          <p className="whitespace-nowrap shrink-0 font-mono-num text-[11px]">
            © 2026 HakoSagashi
          </p>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPolicyOpen(false)}
        aria-labelledby="policy-dialog-title"
        className="m-auto max-w-lg w-[calc(100%-2rem)] rounded-lg border border-[#DED8CE] bg-white p-6 shadow-xl backdrop:bg-[#1C1917]/45"
      >
        {policyOpen && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="policy-dialog-title"
                className="font-display text-base font-bold text-[#1C1917]"
              >
                掲載基準・データ出典について
              </h2>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setPolicyOpen(false)}
                className="p-1.5 rounded-md text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2EFE9] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#57534E] leading-relaxed">
              <p>
                HakoSagashiは、練習場所の検索から予約前のルール確認までを部屋単位で完結させることを目的としたサービスです。
              </p>
              <div className="bg-[#FAF8F5] border border-[#E4DFD7] rounded-md p-3.5 text-xs space-y-1.5 text-[#1C1917]">
                <p className="font-semibold">掲載データの出典・更新について</p>
                <p className="text-[#57534E]">
                  現在掲載している大阪市内の公共施設および民間レンタルスタジオの情報は、各施設の公式サイト・利用案内・料金表などの一次情報をもとに整理しています。すべての部屋詳細ページに「最終確認日」と「情報の出典」を明記しています。
                </p>
              </div>
              <p className="text-xs text-[#57534E]">
                料金区分や抽選日程、付帯設備の利用条件は改定される場合があります。実際のご予約にあたっては、必ず各部屋ページのリンク先にある公式サイトで最新情報をご確認ください。
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPolicyOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0D5C53] hover:bg-[#09433D] rounded-md transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </dialog>
    </footer>
  );
}
