import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { EngineBadge } from '../components/EngineBadge';
import { FighterAvatar } from '../components/FighterAvatar';
import { calculateMaxHp, simulateBattle } from '../engine/battleSimulator';
import { PERSONALITY_PROFILES } from '../engine/profiles';
import {
  ArenaState,
  BattleActionEvent,
  BattleResult,
  Bet,
  Fighter,
} from '../types/arena';

interface BattlePageProps {
  state: ArenaState;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onCompleteBattle: (result: BattleResult) => Bet[];
  onGoResults: () => void;
}

const SPEED_OPTIONS: Array<{ label: string; value: number; intervalMs: number }> = [
  { label: '1x', value: 1, intervalMs: 1100 },
  { label: '2x', value: 2, intervalMs: 550 },
  { label: '4x', value: 4, intervalMs: 240 },
];

/**
 * 画面3: 試合再生（最大20ターンのターン制オートバトル＋2D簡易アニメーション＋実況ログ）
 */
export function BattlePage({
  state,
  selectedMatchId,
  onSelectMatch,
  onCompleteBattle,
  onGoResults,
}: BattlePageProps) {
  const fighterMap = useMemo(
    () => new Map<string, Fighter>(state.fighters.map((f) => [f.id, f])),
    [state.fighters]
  );

  const activeMatch = useMemo(() => {
    if (selectedMatchId) {
      const found = state.matches.find((m) => m.id === selectedMatchId);
      if (found) return found;
    }
    return (
      state.matches.find((m) => m.status === 'scheduled') ??
      state.matches[0] ??
      null
    );
  }, [selectedMatchId, state.matches]);

  const fighterA = activeMatch ? fighterMap.get(activeMatch.fighterAId) : undefined;
  const fighterB = activeMatch ? fighterMap.get(activeMatch.fighterBId) : undefined;

  // 保存済み試合結果があれば初期ロードする
  const savedResult = useMemo(() => {
    if (!activeMatch?.resultId) return null;
    return state.results.find((r) => r.id === activeMatch.resultId) ?? null;
  }, [activeMatch, state.results]);

  const [battleResult, setBattleResult] = useState<BattleResult | null>(savedResult);
  const [cursor, setCursor] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const committedResultIdRef = useRef<string | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // 選択カードが変わったら再生状態をリセット
  useEffect(() => {
    setBattleResult(savedResult);
    setCursor(savedResult ? savedResult.events.length - 1 : -1);
    setIsPlaying(false);
    setSettledBets([]);
    committedResultIdRef.current = savedResult ? savedResult.id : null;
  }, [activeMatch?.id, savedResult]);

  // 再生タイマー制御
  useEffect(() => {
    if (!isPlaying || !battleResult) return;

    const speedConf =
      SPEED_OPTIONS.find((s) => s.value === speed) ?? SPEED_OPTIONS[0];

    const timer = window.setInterval(() => {
      setCursor((prev) => {
        const next = prev + 1;
        if (next >= battleResult.events.length) {
          setIsPlaying(false);
          return battleResult.events.length - 1;
        }
        return next;
      });
    }, speedConf.intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, battleResult, speed]);

  // 最終イベントに到達したら戦績・予想を自動反映
  useEffect(() => {
    if (!battleResult || !activeMatch) return;
    const isFinishedView = cursor >= battleResult.events.length - 1;
    if (
      isFinishedView &&
      activeMatch.status === 'scheduled' &&
      committedResultIdRef.current !== battleResult.id
    ) {
      committedResultIdRef.current = battleResult.id;
      const settled = onCompleteBattle(battleResult);
      setSettledBets(settled);
    }
  }, [cursor, battleResult, activeMatch, onCompleteBattle]);

  // ログの自動スクロール
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [cursor]);

  if (!activeMatch || !fighterA || !fighterB) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
        再生できる対戦カードがありません。対戦カード一覧から再編成してください。
      </div>
    );
  }

  const leftMaxHp = battleResult?.leftMaxHp ?? calculateMaxHp(fighterA);
  const rightMaxHp = battleResult?.rightMaxHp ?? calculateMaxHp(fighterB);

  const visibleEvents: BattleActionEvent[] =
    battleResult && cursor >= 0 ? battleResult.events.slice(0, cursor + 1) : [];
  const currentEvent =
    visibleEvents.length > 0 ? visibleEvents[visibleEvents.length - 1] : null;

  const leftHp = currentEvent ? currentEvent.leftHpAfter : leftMaxHp;
  const rightHp = currentEvent ? currentEvent.rightHpAfter : rightMaxHp;
  const leftHpPct = Math.max(0, Math.round((leftHp / leftMaxHp) * 100));
  const rightHpPct = Math.max(0, Math.round((rightHp / rightMaxHp) * 100));

  const isComplete =
    battleResult !== null && cursor >= battleResult.events.length - 1;

  /** 試合開始または再生・一時停止トグル */
  const handlePlayToggle = () => {
    if (!battleResult) {
      const simulated = simulateBattle(activeMatch.id, fighterA, fighterB);
      setBattleResult(simulated);
      setCursor(0);
      setIsPlaying(true);
      return;
    }
    if (cursor >= battleResult.events.length - 1) {
      setCursor(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    if (!battleResult) return;
    setCursor(0);
    setIsPlaying(true);
  };

  const handleSkipToEnd = () => {
    if (!battleResult) {
      const simulated = simulateBattle(activeMatch.id, fighterA, fighterB);
      setBattleResult(simulated);
      setCursor(simulated.events.length - 1);
      setIsPlaying(false);
      return;
    }
    setCursor(battleResult.events.length - 1);
    setIsPlaying(false);
  };

  // アニメーションクラス判定
  let leftAnim = '';
  let rightAnim = '';
  if (currentEvent) {
    if (currentEvent.actorSide === 'left') {
      if (currentEvent.action === 'attack' || currentEvent.damage > 0) {
        leftAnim = 'animate-lunge-right';
        if (currentEvent.damage > 0) rightAnim = 'animate-hit-shake';
      } else if (currentEvent.action === 'defend') {
        leftAnim = 'animate-guard-pulse';
      } else if (currentEvent.action === 'charge') {
        leftAnim = 'animate-charge-glow';
      }
    } else {
      if (currentEvent.action === 'attack' || currentEvent.damage > 0) {
        rightAnim = 'animate-lunge-left';
        if (currentEvent.damage > 0) leftAnim = 'animate-hit-shake';
      } else if (currentEvent.action === 'defend') {
        rightAnim = 'animate-guard-pulse';
      } else if (currentEvent.action === 'charge') {
        rightAnim = 'animate-charge-glow';
      }
    }
  }

  const userBetsForMatch = state.bets.filter(
    (b) => b.matchId === activeMatch.id
  );

  return (
    <div className="space-y-5">
      {/* 対戦カードセレクタ */}
      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-extrabold text-white sm:text-xl">
            試合再生アリーナ
          </h1>
          <p className="text-xs text-slate-400">
            最大20ターンのオートバトルを再生します。終了時に戦績と無料予想ポイントが自動反映されます。
          </p>
        </div>
        <div className="sm:min-w-[260px]">
          <label htmlFor="battle-match-select" className="sr-only">
            再生する対戦カードを選択
          </label>
          <select
            id="battle-match-select"
            value={activeMatch.id}
            onChange={(e) => onSelectMatch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none sm:text-sm"
          >
            {state.matches.map((m) => {
              const a = fighterMap.get(m.fighterAId);
              const b = fighterMap.get(m.fighterBId);
              const tag = m.status === 'completed' ? '[済]' : '[未]';
              return (
                <option key={m.id} value={m.id}>
                  {tag} {m.roundLabel}: {a?.name ?? '?'} vs {b?.name ?? '?'}
                </option>
              );
            })}
          </select>
        </div>
      </section>

      {/* 2D簡易バトルステージ */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 sm:p-6">
        {/* ターン表示バッジ */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-200">
            {currentEvent
              ? `TURN ${currentEvent.turn} / 20`
              : battleResult
                ? `全 ${battleResult.totalTurns} ターン`
                : 'READY（試合前）'}
          </span>
          {userBetsForMatch.length > 0 && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
              あなたの予想: {userBetsForMatch.map((b) => `${b.pickedFighterName}(${b.amount}pt)`).join(' / ')}
            </span>
          )}
        </div>

        {/* ファイター対峙エリア */}
        <div className="grid grid-cols-2 items-center gap-3 sm:gap-8">
          {/* 左側：赤枠ファイター */}
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <FighterAvatar
                  key={`left-${cursor}`}
                  fighter={fighterA}
                  size="lg"
                  animationClass={leftAnim}
                />
                {currentEvent?.targetSide === 'left' && currentEvent.damage > 0 && (
                  <span className="absolute -top-3 -right-3 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-black text-white shadow">
                    -{currentEvent.damage}
                  </span>
                )}
                {currentEvent?.actorSide === 'left' && currentEvent.healed > 0 && (
                  <span className="absolute -top-3 -left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-black text-slate-950 shadow">
                    +{currentEvent.healed}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-white sm:text-base">
                  {fighterA.name}
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  <EngineBadge engine={fighterA.engine} compact />
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {PERSONALITY_PROFILES[fighterA.personality].label}
                  </span>
                </div>
              </div>
            </div>

            {/* HPバー */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold tabular-nums">
                <span className="text-rose-300">HP</span>
                <span className="text-slate-200">
                  {leftHp} / {leftMaxHp} ({leftHpPct}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${leftHpPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 右側：青枠ファイター */}
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <FighterAvatar
                  key={`right-${cursor}`}
                  fighter={fighterB}
                  size="lg"
                  animationClass={rightAnim}
                />
                {currentEvent?.targetSide === 'right' && currentEvent.damage > 0 && (
                  <span className="absolute -top-3 -left-3 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-black text-white shadow">
                    -{currentEvent.damage}
                  </span>
                )}
                {currentEvent?.actorSide === 'right' && currentEvent.healed > 0 && (
                  <span className="absolute -top-3 -right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-black text-slate-950 shadow">
                    +{currentEvent.healed}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-white sm:text-base">
                  {fighterB.name}
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  <EngineBadge engine={fighterB.engine} compact />
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {PERSONALITY_PROFILES[fighterB.personality].label}
                  </span>
                </div>
              </div>
            </div>

            {/* HPバー */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold tabular-nums">
                <span className="text-sky-300">HP</span>
                <span className="text-slate-200">
                  {rightHp} / {rightMaxHp} ({rightHpPct}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${rightHpPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 現在の行動実況ハイライト */}
        <div
          aria-live="polite"
          className="mt-5 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-center text-xs font-semibold text-slate-100 sm:text-sm"
        >
          {currentEvent
            ? currentEvent.commentary
            : '「試合を再生」を押すとターン制オートバトルが始まります。'}
        </div>

        {/* 再生コントロールバー */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePlayToggle}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-400 sm:text-sm"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  一時停止
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {battleResult
                    ? isComplete
                      ? 'もう一度再生'
                      : '再開'
                    : '試合を再生'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              disabled={!battleResult}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              最初から
            </button>

            <button
              type="button"
              onClick={handleSkipToEnd}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <FastForward className="h-3.5 w-3.5" />
              結果までスキップ
            </button>
          </div>

          {/* 再生速度切替 */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <span className="px-2 text-[11px] text-slate-400">速度</span>
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSpeed(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  speed === opt.value
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 試合決着サマリー */}
      {isComplete && battleResult && (
        <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-300" />
              <h2 className="text-base font-extrabold text-white sm:text-lg">
                勝者: {battleResult.winnerName}（{battleResult.finishType === 'KO' ? 'KO' : '判定'} / {battleResult.totalTurns}ターン）
              </h2>
            </div>
            <button
              type="button"
              onClick={onGoResults}
              className="rounded-xl bg-emerald-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
            >
              戦績・ランキングを見る
            </button>
          </div>
          <p className="text-xs leading-relaxed text-emerald-100 sm:text-sm">
            {battleResult.summary}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200">
            <span>
              レート変動: {battleResult.winnerName}{' '}
              <strong className="text-emerald-300">
                +{battleResult.ratingDeltaWinner}
              </strong>
            </span>
            <span>
              {battleResult.loserName}{' '}
              <strong className="text-rose-300">
                {battleResult.ratingDeltaLoser}
              </strong>
            </span>
          </div>

          {settledBets.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-slate-950/70 p-3 space-y-1">
              <div className="text-xs font-bold text-amber-300">
                無料ポイント予想の精算結果
              </div>
              {settledBets.map((bet) => (
                <div key={bet.id} className="text-xs text-slate-200">
                  {bet.pickedFighterName} に {bet.amount}pt（{bet.oddsAtBet.toFixed(1)}倍） →{' '}
                  {bet.status === 'won' ? (
                    <strong className="text-emerald-300">
                      的中！ +{bet.payout.toLocaleString()} pt 獲得
                    </strong>
                  ) : (
                    <strong className="text-slate-400">惜しくも不的中</strong>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 実況テキストログ一覧 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">実況テキストログ</h2>
          <span className="text-xs text-slate-400">
            {visibleEvents.length} / {battleResult?.events.length ?? 0} 行動
          </span>
        </div>

        <div className="custom-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
          {visibleEvents.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              試合を開始すると、ここにターンごとの実況ログが表示されます。
            </p>
          ) : (
            visibleEvents.map((ev, idx) => (
              <div
                key={`${ev.turn}-${idx}`}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-xs ${
                  ev.actorSide === 'left'
                    ? 'border-rose-500/20 bg-rose-500/5'
                    : 'border-sky-500/20 bg-sky-500/5'
                }`}
              >
                <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                  T{ev.turn}
                </span>
                <span className="mt-0.5 shrink-0 text-slate-400">
                  {ev.action === 'defend' ? (
                    <Shield className="h-3.5 w-3.5 text-sky-400" />
                  ) : ev.action === 'charge' ? (
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                  ) : ev.action === 'skill' ? (
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                  )}
                </span>
                <p className="leading-relaxed text-slate-200">{ev.commentary}</p>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </section>
    </div>
  );
}
