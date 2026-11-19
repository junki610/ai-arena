import { Bet, Fighter, MatchCard } from '../types/arena';

export interface MatchOddsInfo {
  winRateA: number;
  winRateB: number;
  oddsA: number;
  oddsB: number;
  totalPool: number;
  poolA: number;
  poolB: number;
  popularityA: number;
  popularityB: number;
}

/** ファイター個人の通算勝率（0〜100%）を算出 */
export function getFighterWinRatePercent(fighter: Fighter): number {
  const total = fighter.wins + fighter.losses;
  if (total === 0) return 50;
  return Math.round((fighter.wins / total) * 100);
}

/**
 * 両ファイターの勝率予測と、人気（モック賭け分布 + ユーザー投票）からオッズを算出する。
 * 無料ポイント専用・ランキング用途のみ。
 */
export function calculateMatchOdds(
  match: MatchCard,
  fighterA: Fighter,
  fighterB: Fighter,
  bets: Bet[]
): MatchOddsInfo {
  // Eloレート差に基づく理論勝率
  const expectedA =
    1 / (1 + Math.pow(10, (fighterB.rating - fighterA.rating) / 400));

  // 実戦勝率も軽く加味
  const histA = getFighterWinRatePercent(fighterA) / 100;
  const histB = getFighterWinRatePercent(fighterB) / 100;
  const histRatioA = histA / Math.max(0.01, histA + histB);

  const blendedProbA = Math.min(
    0.85,
    Math.max(0.15, expectedA * 0.72 + histRatioA * 0.28)
  );

  // モック賭け分布 + ユーザーの投票を集計
  const userPoolA = bets
    .filter((b) => b.matchId === match.id && b.pickedFighterId === fighterA.id)
    .reduce((sum, b) => sum + b.amount, 0);
  const userPoolB = bets
    .filter((b) => b.matchId === match.id && b.pickedFighterId === fighterB.id)
    .reduce((sum, b) => sum + b.amount, 0);

  const poolA = match.mockPoolA + userPoolA;
  const poolB = match.mockPoolB + userPoolB;
  const totalPool = Math.max(100, poolA + poolB);

  const popularityRatioA = poolA / totalPool;
  const popularityRatioB = poolB / totalPool;

  // 勝率予測(50%)と人気分布(50%)をブレンドしてオッズ化（最低1.1倍・最大9.9倍）
  const effectiveProbA = blendedProbA * 0.5 + popularityRatioA * 0.5;
  const effectiveProbB = (1 - blendedProbA) * 0.5 + popularityRatioB * 0.5;

  const rawOddsA = 0.92 / Math.max(0.09, effectiveProbA);
  const rawOddsB = 0.92 / Math.max(0.09, effectiveProbB);

  const oddsA = Number(Math.min(9.9, Math.max(1.1, rawOddsA)).toFixed(1));
  const oddsB = Number(Math.min(9.9, Math.max(1.1, rawOddsB)).toFixed(1));

  return {
    winRateA: Math.round(blendedProbA * 100),
    winRateB: 100 - Math.round(blendedProbA * 100),
    oddsA,
    oddsB,
    totalPool,
    poolA,
    poolB,
    popularityA: Math.round(popularityRatioA * 100),
    popularityB: Math.round(popularityRatioB * 100),
  };
}
