import {
  Coins,
  PlusCircle,
  Swords,
  Ticket,
  Trophy,
  Tv,
} from 'lucide-react';
import { PageTab } from '../types/arena';

interface HeaderProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  userPoints: number;
  dailyBonusBanner: string | null;
  onDismissBanner: () => void;
}

const NAV_ITEMS: Array<{
  id: PageTab;
  label: string;
  shortLabel: string;
  icon: typeof Swords;
}> = [
  { id: 'home', label: '対戦カード', shortLabel: '対戦', icon: Swords },
  { id: 'create', label: 'ファイター作成', shortLabel: '作成', icon: PlusCircle },
  { id: 'battle', label: '試合再生', shortLabel: '試合', icon: Tv },
  { id: 'predict', label: '無料予想', shortLabel: '予想', icon: Ticket },
  { id: 'results', label: '結果・ランキング', shortLabel: '戦績', icon: Trophy },
];

/**
 * 共通ヘッダーおよびナビゲーション（スマホ幅でも崩れないレスポンシブ設計）
 */
export function Header({
  activeTab,
  onSelectTab,
  userPoints,
  dailyBonusBanner,
  onDismissBanner,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 py-3">
          {/* アプリタイトル */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-950/50">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wide text-white sm:text-lg">
                  AI ARENA
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                  仮称 MVP
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-400 sm:block">
                AI 1対1 オートバトル &amp; 無料ポイント予想
              </p>
            </div>
          </button>

          {/* 無料ポイント残高表示（換金・購入不可を明記） */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
            <Coins className="h-4 w-4 text-amber-400" />
            <div className="leading-tight">
              <div className="hidden text-[10px] text-amber-200/80 min-[420px]:block">
                無料ポイント（ランキング専用）
              </div>
              <div className="text-sm font-extrabold tabular-nums text-amber-300">
                {userPoints.toLocaleString()} pt
              </div>
            </div>
          </div>
        </div>

        {/* 5画面ナビゲーションタブ */}
        <nav
          aria-label="メインナビゲーション"
          className="-mx-3 flex overflow-x-auto border-t border-slate-800/80 px-2 sm:mx-0 sm:px-0"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-[13px] font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 毎日ログインボーナス通知バナー */}
      {dailyBonusBanner && (
        <div className="border-t border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-center text-xs font-medium text-emerald-200 sm:text-sm">
          <span>{dailyBonusBanner}</span>
          <button
            type="button"
            onClick={onDismissBanner}
            className="ml-3 rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-100 hover:bg-emerald-500/30"
          >
            閉じる
          </button>
        </div>
      )}
    </header>
  );
}
