import { FormEvent, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Info,
  Play,
  Ticket,
} from 'lucide-react';
import { EngineBadge } from '../components/EngineBadge';
import { FighterAvatar } from '../components/FighterAvatar';
import { RecentFormBadges } from '../components/RecentFormBadges';
import { calculateMatchOdds } from '../engine/odds';
import { ArenaState, Fighter } from '../types/arena';

interface PredictionPageProps {
  state: ArenaState;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onPlaceBet: (params: {
    matchId: string;
    pickedFighterId: string;
    amount: number;
    oddsAtBet: number;
  }) => { ok: true } | { ok: false; error: string };
  onOpenBattle: (matchId: string) => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500];

/**
 * 画面4: 無料ポイント予想画面
 * 課金・購入・換金・譲渡のUIは一切設けず、アプリ内無料ポイント（ランキング専用）のみ扱う。
 */
export function PredictionPage({
  state,
  selectedMatchId,
  onSelectMatch,
  onPlaceBet,
  onOpenBattle,
}: PredictionPageProps) {
  const fighterMap = useMemo(
    () => new Map<string, Fighter>(state.fighters.map((f) => [f.id, f])),
    [state.fighters]
  );

  const scheduledMatches = useMemo(
    () => state.matches.filter((m) => m.status === 'scheduled'),
    [state.matches]
  );

  const activeMatch = useMemo(() => {
    if (selectedMatchId) {
      const found = scheduledMatches.find((m) => m.id === selectedMatchId);
      if (found) return found;
    }
    return scheduledMatches[0] ?? null;
  }, [selectedMatchId, scheduledMatches]);

  const fighterA = activeMatch ? fighterMap.get(activeMatch.fighterAId) : undefined;
  const fighterB = activeMatch ? fighterMap.get(activeMatch.fighterBId) : undefined;

  const [pickedFighterId, setPickedFighterId] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const effectivePickedId =
    pickedFighterId === fighterA?.id || pickedFighterId === fighterB?.id
      ? pickedFighterId
      : (fighterA?.id ?? '');

  const odds =
    activeMatch && fighterA && fighterB
      ? calculateMatchOdds(activeMatch, fighterA, fighterB, state.bets)
      : null;

  const selectedOdds =
    odds && fighterA
      ? effectivePickedId === fighterA.id
        ? odds.oddsA
        : odds.oddsB
      : 1.0;

  const estimatedPayout = Math.round(amount * selectedOdds);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !effectivePickedId) return;

    const res = onPlaceBet({
      matchId: activeMatch.id,
      pickedFighterId: effectivePickedId,
      amount,
      oddsAtBet: selectedOdds,
    });

    if (res.ok) {
      setMessage({
        type: 'ok',
        text: `${amount.toLocaleString()}pt を予想投票しました！試合を再生すると結果に応じて精算されます。`,
      });
    } else {
      setMessage({ type: 'err', text: res.error });
    }
  };

  return (
    <div className="space-y-6">
      {/* 無料ポイント方針バナー */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="space-y-0.5 text-xs text-amber-100 sm:text-sm">
              <p className="font-bold">
                無料ポイント予想（初期 1,000pt / 毎日ログインで +200pt）
              </p>
              <p className="text-amber-200/80">
                予想に使うポイントはアプリ内限定の無料ポイントのみです。購入・換金・譲渡はできず、ランキング表示にのみ利用されます。
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-slate-950/70 px-3.5 py-2 text-right">
            <div className="text-[10px] text-slate-400">現在の保有ポイント</div>
            <div className="text-lg font-extrabold tabular-nums text-amber-300">
              {state.user.points.toLocaleString()} pt
            </div>
          </div>
        </div>
      </section>

      {/* 予想フォーム */}
      {!activeMatch || !fighterA || !fighterB || !odds ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          予想受付中の試合がすべて終了しました。対戦カード一覧から「カード再編成」を行うと新しい試合が組まれます。
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-lg font-extrabold text-white sm:text-xl">
                勝敗を予想する
              </h1>
              <p className="text-xs text-slate-400">
                オッズは両者の勝率予測と人気（賭け分布）から算出されます。
              </p>
            </div>
            <div className="sm:min-w-[260px]">
              <label htmlFor="predict-match-select" className="sr-only">
                予想する対戦カードを選択
              </label>
              <select
                id="predict-match-select"
                value={activeMatch.id}
                onChange={(e) => {
                  onSelectMatch(e.target.value);
                  setMessage(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none sm:text-sm"
              >
                {scheduledMatches.map((m) => {
                  const a = fighterMap.get(m.fighterAId);
                  const b = fighterMap.get(m.fighterBId);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.roundLabel}: {a?.name ?? '?'} vs {b?.name ?? '?'}（{m.deadlineLabel}）
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 勝者選択カード */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  fighter: fighterA,
                  oddsVal: odds.oddsA,
                  winRate: odds.winRateA,
                  popularity: odds.popularityA,
                  corner: '赤枠',
                },
                {
                  fighter: fighterB,
                  oddsVal: odds.oddsB,
                  winRate: odds.winRateB,
                  popularity: odds.popularityB,
                  corner: '青枠',
                },
              ].map(({ fighter, oddsVal, winRate, popularity, corner }) => {
                const isSelected = effectivePickedId === fighter.id;
                return (
                  <button
                    key={fighter.id}
                    type="button"
                    onClick={() => setPickedFighterId(fighter.id)}
                    aria-pressed={isSelected}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/50'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <FighterAvatar fighter={fighter} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                              {corner}
                            </span>
                            <span className="text-sm font-extrabold text-white">
                              {fighter.name}
                            </span>
                          </div>
                          <div className="mt-1">
                            <EngineBadge engine={fighter.engine} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">オッズ</div>
                        <div className="text-xl font-black tabular-nums text-amber-300">
                          {oddsVal.toFixed(1)}倍
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5 text-xs text-slate-400">
                      <RecentFormBadges form={fighter.recentForm} />
                      <span>
                        勝率予測 {winRate}% / 人気 {popularity}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 賭けポイント入力 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="bet-amount"
                  className="text-xs font-bold text-slate-200 sm:text-sm"
                >
                  賭ける無料ポイント（10pt 以上）
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={state.user.points < preset}
                      onClick={() => setAmount(preset)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-amber-400 disabled:opacity-40"
                    >
                      {preset}pt
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={state.user.points < 10}
                    onClick={() => setAmount(state.user.points)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:border-amber-400 disabled:opacity-40"
                  >
                    全額
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Coins className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-amber-400" />
                  <input
                    id="bet-amount"
                    type="number"
                    min={10}
                    max={Math.max(10, state.user.points)}
                    step={10}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pr-12 pl-9 text-sm font-bold tabular-nums text-white focus:border-amber-400 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                    pt
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
                  <div className="text-[10px] text-slate-400">
                    的中時の想定獲得ポイント
                  </div>
                  <div className="text-base font-extrabold tabular-nums text-emerald-300">
                    {estimatedPayout.toLocaleString()} pt
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div
                role="status"
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-xs font-semibold sm:text-sm ${
                  message.type === 'ok'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
                    : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  {message.type === 'ok' && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  )}
                  {message.text}
                </span>
                {message.type === 'ok' && (
                  <button
                    type="button"
                    onClick={() => onOpenBattle(activeMatch.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-400"
                  >
                    <Play className="h-3.5 w-3.5" />
                    この試合を再生する
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenBattle(activeMatch.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 sm:text-sm"
              >
                <Play className="h-4 w-4" />
                試合再生へ進む
              </button>
              <button
                type="submit"
                disabled={state.user.points < 10}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:opacity-40 sm:text-sm"
              >
                <Ticket className="h-4 w-4" />
                無料ポイントで予想を確定
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 予想履歴一覧 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-3">
        <h2 className="text-base font-bold text-white">あなたの予想履歴</h2>
        {state.bets.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            まだ予想履歴がありません。上のフォームから勝敗を予想してみましょう。
          </p>
        ) : (
          <div className="space-y-2">
            {state.bets.map((bet) => (
              <div
                key={bet.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white">
                    予想: {bet.pickedFighterName}{' '}
                    <span className="font-normal text-slate-400">
                      (vs {bet.opponentName})
                    </span>
                  </div>
                  <div className="text-slate-400">
                    賭け {bet.amount.toLocaleString()}pt × {bet.oddsAtBet.toFixed(1)}倍
                  </div>
                </div>
                <div className="text-right">
                  {bet.status === 'pending' ? (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-bold text-amber-300">
                      試合待ち
                    </span>
                  ) : bet.status === 'won' ? (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300">
                      的中 +{bet.payout.toLocaleString()}pt
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 font-semibold text-slate-400">
                      不的中
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
