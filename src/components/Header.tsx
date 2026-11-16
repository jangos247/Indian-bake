import { User } from 'firebase/auth';
import { ShoppingBag } from 'lucide-react';
import { BAKERY_LOGO_URL } from '../data/bakeryData';
import { AppTab } from './BottomNav';

interface HeaderProps {
  bakeryName: string;
  bagCount: number;
  activeTab: AppTab;
  user: User | null;
  isOwner: boolean;
  onSelectTab: (tab: AppTab) => void;
  onOpenBag: () => void;
  onOpenOwnerStudio: () => void;
}

const DESKTOP_NAV: { id: AppTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'search', label: 'Search' },
  { id: 'orders', label: 'Orders' },
  { id: 'profile', label: 'Account' },
];

export function Header({
  bakeryName,
  bagCount,
  activeTab,
  user,
  isOwner,
  onSelectTab,
  onOpenBag,
  onOpenOwnerStudio,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E4DFD5]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A3412]"
        >
          <img
            src={BAKERY_LOGO_URL}
            alt="Indian Bakery and Cafe logo"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shrink-0 border border-[#D6D0C4]"
          />
          <span className="font-display text-base md:text-lg font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0">
            {bakeryName}
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57534E]"
        >
          {DESKTOP_NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#9A3412] font-semibold underline underline-offset-8 decoration-2'
                    : 'hover:text-[#1C1917]'
                }`}
              >
                {item.id === 'profile' && user
                  ? user.displayName?.split(' ')[0] || 'Account'
                  : item.label}
              </button>
            );
          })}
          {isOwner && (
            <button
              type="button"
              onClick={onOpenOwnerStudio}
              className="text-xs font-semibold text-[#1B4332] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Owner Studio
            </button>
          )}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Open shopping cart with ${bagCount} items`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
            <span>Cart</span>
            <span className="font-mono-tabular text-xs opacity-95">({bagCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
