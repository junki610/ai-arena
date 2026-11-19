import {
  CheckCircle2,
  Clock,
  Play,
  PlusCircle,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import { EngineBadge } from '../components/EngineBadge';
import { FighterAvatar } from '../components/FighterAvatar';
import { RecentFormBadges } from '../components/RecentFormBadges';
import { calculateMatchOdds, getFighterWinRatePercent } from '../engine/odds';
import { PERSONALITY_PROFILES } from '../engine/profiles';
import { ArenaState, Fighter, MatchCard } from '../types/arena';

interface HomePageProps {
  state: ArenaState;
  onOpenBattle: (matchId: string) => void;
  onOpenPredict: (matchId: string) => void;
  onOpenCreate: () => void;
  onRegenerateMatches: () => void;
}

/**
 * 画面1: ホーム / 今日の対戦カード一覧（最大8試合）
 */
export function HomePage({
  state,
  onOpenBattle,
  onOpenPredict,
  onOpenCreate,
  onRegenerateMatches,
}: HomePageProps) {
  const fighterMap = new Map<string, Fighter>(
    state.fighters.map((f) => [f.id, f])
  );

  const scheduledCount = state.matches.filter(
    (m) => m.status === 'scheduled'
  ).length;

  return (
    <div className="space-y-6">
      {/* ヒーロー概要バー */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <span>本日の開催カード（最大8試合）</span>
              <span className="text-slate-400">|</span>
              <span>開催前 {scheduledCount} 試合</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              今日の対戦カード・出走表
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              近5戦（○勝 / ●敗）やエンジン傾向・オッズを見比べて無料ポイントで勝敗を予想し、オートバトルを観戦できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              ファイターを作成
            </button>
            <button
              type="button"
              onClick={onRegenerateMatches}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 sm:text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              カード再編成
            </button>
          </div>
        </div>
      </section>

      {/* 対戦カード一覧 */}
      <section
        aria-label="今日の対戦カード一覧"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {state.matches.map((match) => {
          const fighterA = fighterMap.get(match.fighterAId);
          const fighterB = fighterMap.get(match.fighterBId);
          if (!fighterA || !fighterB) return null;

          const odds = calculateMatchOdds(match, fighterA, fighterB, state.bets);
          const userMatchBets = state.bets.filter((b) => b.matchId === match.id);
          const result = match.resultId
            ? state.results.find((r) => r.id === match.resultId)
            : undefined;

          return (
            <MatchCardItem
              key={match.id}
              match={match}
              fighterA={fighterA}
              fighterB={fighterB}
              oddsA={odds.oddsA}
              oddsB={odds.oddsB}
              winRateA={odds.winRateA}
              winRateB={odds.winRateB}
              userBetCount={userMatchBets.length}
              winnerId={result?.winnerId}
              onOpenBattle={() => onOpenBattle(match.id)}
              onOpenPredict={() => onOpenPredict(match.id)}
            />
          );
        })}
      </section>
    </div>
  );
}

interface MatchCardItemProps {
  match: MatchCard;
  fighterA: Fighter;
  fighterB: Fighter;
  oddsA: number;
  oddsB: number;
  winRateA: number;
  winRateB: number;
  userBetCount: number;
  winnerId?: string;
  onOpenBattle: () => void;
  onOpenPredict: () => void;
}

function MatchCardItem({
  match,
  fighterA,
  fighterB,
  oddsA,
  oddsB,
  winRateA,
  winRateB,
  userBetCount,
  winnerId,
  onOpenBattle,
  onOpenPredict,
}: MatchCardItemProps) {
  const isCompleted = match.status === 'completed';

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm transition hover:border-slate-700">
      {/* カードヘッダー */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200">
              {match.roundLabel}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                試合終了
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                予想締切: {match.deadlineLabel}
              </span>
            )}
          </div>
          {userBetCount > 0 && (
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
              予想済（{userBetCount}件）
            </span>
          )}
        </div>

        {/* 競馬新聞風の出走枠（2体比較） */}
        <div className="space-y-2.5">
          <FighterRow
            corner="赤枠"
            cornerClass="bg-rose-500/20 text-rose-300 border-rose-500/40"
            fighter={fighterA}
            predictedWinRate={winRateA}
            odds={oddsA}
            isWinner={winnerId === fighterA.id}
          />
          <FighterRow
            corner="青枠"
            cornerClass="bg-sky-500/20 text-sky-300 border-sky-500/40"
            fighter={fighterB}
            predictedWinRate={winRateB}
            odds={oddsB}
            isWinner={winnerId === fighterB.id}
          />
        </div>
      </div>

      {/* アクションボタン */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
        {!isCompleted && (
          <button
            type="button"
            onClick={onOpenPredict}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25 sm:text-sm"
          >
            <Ticket className="h-4 w-4" />
            無料ポイント予想
          </button>
        )}
        <button
          type="button"
          onClick={onOpenBattle}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-400 sm:text-sm"
        >
          <Play className="h-4 w-4" />
          {isCompleted ? '試合リプレイを見る' : '試合を再生する'}
        </button>
      </div>
    </article>
  );
}

interface FighterRowProps {
  corner: string;
  cornerClass: string;
  fighter: Fighter;
  predictedWinRate: number;
  odds: number;
  isWinner: boolean;
}

function FighterRow({
  corner,
  cornerClass,
  fighter,
  predictedWinRate,
  odds,
  isWinner,
}: FighterRowProps) {
  const careerWinRate = getFighterWinRatePercent(fighter);

  return (
    <div
      className={`rounded-xl border p-3 ${
        isWinner
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-slate-800 bg-slate-950/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <FighterAvatar fighter={fighter} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${cornerClass}`}
              >
                {corner}
              </span>
              <span className="truncate text-[15px] font-bold text-white">
                {fighter.name}
              </span>
              {!fighter.isPreset && (
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                  自作
                </span>
              )}
              {isWinner && (
                <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                  WIN
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <EngineBadge engine={fighter.engine} />
              <span className="text-xs text-slate-300">
                性格: {PERSONALITY_PROFILES[fighter.personality].label}
              </span>
              <span className="text-xs text-slate-400">
                Rate {fighter.rating}
              </span>
            </div>
          </div>
        </div>

        {/* オッズと勝率 */}
        <div className="shrink-0 text-right">
          <div className="text-xs text-slate-400">オッズ</div>
          <div className="text-xl font-extrabold tabular-nums text-amber-300">
            {odds.toFixed(1)}
            <span className="ml-0.5 text-xs font-normal text-amber-200/80">
              倍
            </span>
          </div>
          <div className="text-xs text-slate-300">
            予想勝率 {predictedWinRate}%
          </div>
        </div>
      </div>

      {/* 競馬新聞風の近5戦＋通算勝率 */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">近5戦:</span>
          <RecentFormBadges form={fighter.recentForm} />
        </div>
        <div className="text-xs text-slate-300">
          通算 {fighter.wins}勝{fighter.losses}敗（勝率 {careerWinRate}%）
        </div>
      </div>
    </div>
  );
}
