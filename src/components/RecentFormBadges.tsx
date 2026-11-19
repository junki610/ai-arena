import { FormResult } from '../types/arena';

interface RecentFormBadgesProps {
  form: FormResult[];
}

/**
 * 競馬新聞風の近5戦表示（○＝勝ち / ●＝負け）
 * 左が古く、右が直近の試合。
 */
export function RecentFormBadges({ form }: RecentFormBadgesProps) {
  const slots: Array<FormResult | null> = [];
  const trimmed = form.slice(-5);
  const emptyCount = Math.max(0, 5 - trimmed.length);
  for (let i = 0; i < emptyCount; i += 1) slots.push(null);
  trimmed.forEach((r) => slots.push(r));

  return (
    <div
      className="inline-flex items-center gap-1"
      aria-label={`近5戦: ${
        trimmed.length === 0
          ? 'データなし'
          : trimmed.map((r) => (r === 'W' ? '勝ち' : '負け')).join('・')
      }`}
    >
      {slots.map((result, idx) => {
        if (result === 'W') {
          return (
            <span
              key={idx}
              title="勝ち"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-300 ring-1 ring-rose-500/40"
            >
              ○
            </span>
          );
        }
        if (result === 'L') {
          return (
            <span
              key={idx}
              title="負け"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400 ring-1 ring-slate-700"
            >
              ●
            </span>
          );
        }
        return (
          <span
            key={idx}
            title="未対戦"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-slate-600 ring-1 ring-slate-800"
          >
            -
          </span>
        );
      })}
    </div>
  );
}
