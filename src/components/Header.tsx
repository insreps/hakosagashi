import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type AppRoute = 'top' | 'search' | 'detail';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigateHome: (sectionId?: string) => void;
  onNavigateSearch: () => void;
}

export function Header({
  currentRoute,
  onNavigateHome,
  onNavigateSearch,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick(() => onNavigateHome());
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 rounded"
        >
          HakoSagashi
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="メインナビゲーション"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#/search"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(onNavigateSearch);
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              currentRoute === 'search' ? 'text-teal-800 font-semibold' : ''
            }`}
          >
            施設一覧
          </a>
          <a
            href="#purposes"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('purposes'));
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            利用目的
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('features'));
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            特徴
          </a>
          <a
            href="#how-to-use"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('how-to-use'));
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            使い方
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick(onNavigateSearch)}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 cursor-pointer"
          >
            条件で探す
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="モバイルナビゲーション"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
        >
          <a
            href="#/search"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(onNavigateSearch);
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            施設一覧・検索
          </a>
          <a
            href="#purposes"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('purposes'));
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            人気の利用目的
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('features'));
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            HakoSagashiの特徴
          </a>
          <a
            href="#how-to-use"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('how-to-use'));
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            利用方法
          </a>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleNavClick(onNavigateSearch)}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors cursor-pointer"
            >
              条件で探す
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
