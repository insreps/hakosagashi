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
      className={`bg-white border-t border-slate-200 mt-20 ${
        hasCompareBar ? 'pb-14' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-8 border-b border-slate-100">
          <div className="max-w-md space-y-2.5">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="font-display text-lg font-bold tracking-tight text-slate-900 inline-block"
            >
              HakoSagashi（ハコさがし）
            </a>
            <p className="text-sm text-slate-600 leading-relaxed">
              練習場所を探す手間と、予約前の不安をなくす。公共施設と民間レンタルスペースを部屋単位の設備・利用条件で比較できる検索サービスです。
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              トップページ
            </a>
            <a
              href="#/search"
              onClick={(e) => {
                e.preventDefault();
                onNavigateSearch();
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              施設・部屋を検索
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('features');
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              HakoSagashiの特徴
            </a>
            <a
              href="#how-to-use"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome('how-to-use');
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              利用方法
            </a>
            <button
              type="button"
              onClick={() => setPolicyOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              掲載基準・データ出典について
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1">
            <p>
              ※ 掲載している施設・部屋情報は各施設の公式サイト等の公開情報をもとに整理しています。最新の空き状況・料金改定・利用規約は各施設の公式サイトをご確認ください。
            </p>
            <p>
              ※ 地図および周辺駅機能には Google Maps Platform を利用しており、
              <a
                href="https://maps.google.com/help/terms_maps/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-700"
              >
                Google マップ追加利用規約
              </a>
              および
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-700"
              >
                Google プライバシーポリシー
              </a>
              が適用されます。
            </p>
          </div>
          <p className="whitespace-nowrap shrink-0">© 2026 HakoSagashi</p>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPolicyOpen(false)}
        aria-labelledby="policy-dialog-title"
        className="m-auto max-w-lg w-[calc(100%-2rem)] rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-900/40"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="policy-dialog-title"
              className="font-display text-base font-bold text-slate-900"
            >
              掲載基準・データ出典について
            </h2>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setPolicyOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              HakoSagashiは、練習場所の検索から予約前のルール確認までを部屋単位で完結させることを目的としたサービスです。
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5 text-slate-700">
              <p className="font-semibold text-slate-900">掲載データの出典・更新について</p>
              <p>
                現在掲載している大阪市内の公共施設および民間レンタルスタジオの情報は、各施設の公式サイト・利用案内・料金表などの一次情報をもとに整理しています。すべての部屋詳細ページに「最終確認日」と「情報の出典」を明記しています。
              </p>
            </div>
            <p className="text-xs text-slate-500">
              料金区分や抽選日程、付帯設備の利用条件は改定される場合があります。実際のご予約にあたっては、必ず各部屋ページのリンク先にある公式サイトで最新情報をご確認ください。
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setPolicyOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      </dialog>
    </footer>
  );
}
