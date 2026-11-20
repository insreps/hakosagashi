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
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/92 backdrop-blur-md border-b border-[#E4DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick(() => onNavigateHome());
          }}
          className="font-display text-lg font-bold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 rounded transition-colors hover:text-[#0D5C53]"
        >
          HakoSagashi
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="メインナビゲーション"
          className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#57534E]"
        >
          <a
            href="#/search"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(onNavigateSearch);
            }}
            className={`relative py-1 hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 ${
              currentRoute === 'search'
                ? 'text-[#0D5C53] font-semibold after:content-[""] after:absolute after:inset-x-0 after:-bottom-[1.15rem] after:h-[2px] after:bg-[#0D5C53]'
                : ''
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
            className="py-1 hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            利用目的
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('features'));
            }}
            className="py-1 hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            特徴
          </a>
          <a
            href="#how-to-use"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('how-to-use'));
            }}
            className="py-1 hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            使い方
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick(onNavigateSearch)}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-[13px] font-semibold text-white bg-[#0D5C53] rounded-md hover:bg-[#09433D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            条件で探す
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
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
          className="md:hidden border-t border-[#E4DFD7] bg-[#FAF8F5] px-4 py-3 space-y-1"
        >
          <a
            href="#/search"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(onNavigateSearch);
            }}
            className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#1C1917] hover:bg-[#F2EFE9]"
          >
            施設一覧・検索
          </a>
          <a
            href="#purposes"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('purposes'));
            }}
            className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#57534E] hover:bg-[#F2EFE9]"
          >
            人気の利用目的
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('features'));
            }}
            className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#57534E] hover:bg-[#F2EFE9]"
          >
            HakoSagashiの特徴
          </a>
          <a
            href="#how-to-use"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(() => onNavigateHome('how-to-use'));
            }}
            className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#57534E] hover:bg-[#F2EFE9]"
          >
            利用方法
          </a>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleNavClick(onNavigateSearch)}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0D5C53] rounded-md hover:bg-[#09433D] transition-colors cursor-pointer"
            >
              条件で探す
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
