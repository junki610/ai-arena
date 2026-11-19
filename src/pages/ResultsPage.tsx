import { useMemo, useState } from 'react';
import {
  Award,
  GitBranch,
  History,
  Play,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { EngineBadge } from '../components/EngineBadge';
import { FighterAvatar } from '../components/FighterAvatar';
import { RecentFormBadges } from '../components/RecentFormBadges';
import { getSkillById } from '../data/skills';
import { getFighterWinRatePercent } from '../engine/odds';
import { PERSONALITY_PROFILES } from '../engine/profiles';
import { ArenaState, PredictorRankingEntry } from '../types/arena';

interface ResultsPageProps {
  state: ArenaState;
  onOpenBattle: (matchId: string) => void;
}

type ResultsSubTab = 'matches' | 'fighters' | 'predictors' | 'lineage';

/**
 * 画面5: 結果 / ランキング / ファイター系譜
 */
export function ResultsPage({ state, onOpenBattle }: ResultsPageProps) {
  const [subTab, setSubTab] = useState<ResultsSubTab>('matches');
  const [selectedLineageFighterId, setSelectedLineageFighterId] = useState<string>(
    state.fighters[0]?.id ?? ''
  );

  // ファイターを Elo 風レート順にソート
  const rankedFighters = useMemo(
    () =>
      [...state.fighters].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.wins - a.wins;
      }),
    [state.fighters]
  );

  // 予想者ランキング（ユーザー＋モック予想者をポイント順に結合）
  const predictorRanking = useMemo<PredictorRankingEntry[]>(() => {
    const me: PredictorRankingEntry = {
      id: 'current-user',
      displayName: state.user.displayName,
      points: state.user.points,
      totalBets: state.user.totalBets,
      totalWins: state.user.totalWins,
      isCurrentUser: true,
    };
    return [me, ...state.mockPredictors].sort((a, b) => b.points - a.points);
  }, [state.user, state.mockPredictors]);

  const lineageFighter =
    state.fighters.find((f) => f.id === selectedLineageFighterId) ??
    state.fighters[0];

  const tabs: Array<{ id: ResultsSubTab; label: string; icon: typeof Trophy }> = [
    { id: 'matches', label: '試合結果・勝因', icon: History },
    { id: 'fighters', label: 'ファイター戦績', icon: Swords },
    { id: 'predictors', label: '予想者ランキング', icon: Users },
    { id: 'lineage', label: 'ファイターの系譜', icon: GitBranch },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">
          結果・ランキング・系譜
        </h1>
        <p className="text-xs text-slate-400 sm:text-sm">
          試合の勝因サマリー、ファイターのElo風レート戦績、無料ポイント予想者ランキングを確認できます。
        </p>
      </div>

      {/* サブタブ */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                active
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. 試合結果・勝因 */}
      {subTab === 'matches' && (
        <section className="space-y-3">
          {state.results.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center text-sm text-slate-400">
              まだ終了した試合がありません。「対戦カード」または「試合再生」から試合を再生すると、ここに勝因サマリーが記録されます。
            </div>
          ) : (
            state.results.map((res) => (
              <article
                key={res.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                      <Trophy className="h-3.5 w-3.5" />
                      勝者: {res.winnerName}
                    </span>
                    <span className="text-xs text-slate-400">
                      vs {res.loserName}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                      {res.finishType === 'KO' ? 'KO決着' : '判定決着'}・全{res.totalTurns}ターン
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenBattle(res.matchId)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    <Play className="h-3.5 w-3.5" />
                    リプレイ
                  </button>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-relaxed text-slate-200 sm:text-sm">
                  <span className="mr-2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                    勝因要約（第{res.decisiveTurn}ターン注目）
                  </span>
                  {res.summary}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    レート変動: {res.winnerName}{' '}
                    <strong className="text-emerald-300">
                      +{res.ratingDeltaWinner}
                    </strong>{' '}
                    / {res.loserName}{' '}
                    <strong className="text-rose-300">
                      {res.ratingDeltaLoser}
                    </strong>
                  </span>
                  <span>
                    {new Date(res.completedAt).toLocaleString('ja-JP')}
                  </span>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* 2. ファイター戦績（勝敗・Elo風レート） */}
      {subTab === 'fighters' && (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">順位</th>
                  <th className="px-4 py-3 font-semibold">ファイター</th>
                  <th className="px-4 py-3 font-semibold">エンジン / 性格</th>
                  <th className="px-4 py-3 font-semibold">戦績（勝率）</th>
                  <th className="px-4 py-3 font-semibold">近5戦</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Elo風レート
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {rankedFighters.map((fighter, idx) => {
                  const winRate = getFighterWinRatePercent(fighter);
                  return (
                    <tr
                      key={fighter.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-extrabold tabular-nums text-slate-300">
                        #{idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <FighterAvatar fighter={fighter} size="sm" />
                          <div>
                            <div className="font-bold text-white">
                              {fighter.name}
                              {!fighter.isPreset && (
                                <span className="ml-1.5 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                                  自作
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              HP{fighter.stats.hp} 攻{fighter.stats.attack} 防
                              {fighter.stats.defense} 速{fighter.stats.speed} 技
                              {fighter.stats.technique}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <EngineBadge engine={fighter.engine} />
                          <div className="text-[11px] text-slate-400">
                            性格: {PERSONALITY_PROFILES[fighter.personality].label}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-200">
                        {fighter.wins}勝 {fighter.losses}敗
                        <span className="ml-1 text-slate-400">({winRate}%)</span>
                      </td>
                      <td className="px-4 py-3">
                        <RecentFormBadges form={fighter.recentForm} />
                      </td>
                      <td className="px-4 py-3 text-right font-black tabular-nums text-cyan-300">
                        {fighter.rating}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. 予想者ランキング（無料ポイント順） */}
      {subTab === 'predictors' && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">
                予想者ランキング（無料ポイント順）
              </h2>
              <p className="text-xs text-slate-400">
                無料ポイントは本ランキング表示にのみ使用されます（換金・購入不可）。
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {predictorRanking.map((entry, idx) => {
              const hitRate =
                entry.totalBets > 0
                  ? Math.round((entry.totalWins / entry.totalBets) * 100)
                  : 0;
              return (
                <div
                  key={entry.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    entry.isCurrentUser
                      ? 'border-amber-400/60 bg-amber-500/10'
                      : 'border-slate-800 bg-slate-950/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span>{entry.displayName}</span>
                        {entry.isCurrentUser && (
                          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        的中 {entry.totalWins} / {entry.totalBets} 戦（的中率 {hitRate}%）
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black tabular-nums text-amber-300">
                      {entry.points.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-amber-200/70">
                        pt
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. ファイターの系譜ページ（親ファイターと受け継いだスキルを表示する枠） */}
      {subTab === 'lineage' && lineageFighter && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-white">
                ファイターの系譜（スキル継承ビュー枠）
              </h2>
              <p className="text-xs text-slate-400">
                親ファイターと受け継いだスキルを可視化するための系譜フレームです。現在は第1世代（初期個体）として表示されます。
              </p>
            </div>
            <div className="sm:min-w-[240px]">
              <label htmlFor="lineage-fighter-select" className="sr-only">
                系譜を見るファイターを選択
              </label>
              <select
                id="lineage-fighter-select"
                value={lineageFighter.id}
                onChange={(e) => setSelectedLineageFighterId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none sm:text-sm"
              >
                {state.fighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}（Gen {f.lineage.generation}）
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 系譜ツリー枠 */}
          <div className="space-y-4">
            {/* 親ファイター枠（2体） */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['親ファイター A', '親ファイター B'].map((slotLabel, i) => {
                const parentName =
                  i === 0
                    ? lineageFighter.lineage.parentAName
                    : lineageFighter.lineage.parentBName;
                return (
                  <div
                    key={slotLabel}
                    className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4"
                  >
                    <div className="text-[11px] font-bold text-slate-400">
                      {slotLabel}
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-slate-300">
                      {parentName ?? '未登録（第1世代・始祖個体）'}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      将来アップデートで2体のファイターから次世代を育成する際、ここに親個体が表示されます。
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 接続線 */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold text-cyan-300">
                <Award className="h-3.5 w-3.5" />
                受け継いだスキル枠（継承スロット）
              </div>
            </div>

            {/* 受け継いだスキル表示枠 */}
            <div className="rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-4">
              {lineageFighter.lineage.inheritedSkillIds.length === 0 ? (
                <p className="text-center text-xs text-slate-400">
                  継承スキルなし（第1世代のため、すべて自身の習得スキルです）
                </p>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {lineageFighter.lineage.inheritedSkillIds.map((sid) => (
                    <span
                      key={sid}
                      className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-200"
                    >
                      {getSkillById(sid)?.name ?? sid}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 対象ファイター本体カード */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FighterAvatar fighter={lineageFighter} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {lineageFighter.name}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                        Gen {lineageFighter.lineage.generation}
                      </span>
                    </div>
                    <div className="mt-1">
                      <EngineBadge engine={lineageFighter.engine} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Rate <strong className="text-white">{lineageFighter.rating}</strong> /{' '}
                  {lineageFighter.wins}勝{lineageFighter.losses}敗
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-bold text-slate-300">
                  現在の保有スキル（次世代へ継承候補）
                </div>
                <div className="flex flex-wrap gap-2">
                  {lineageFighter.skillIds.map((sid) => {
                    const skill = getSkillById(sid);
                    return (
                      <span
                        key={sid}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200"
                      >
                        {skill?.name ?? sid}
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {lineageFighter.lineage.note}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
