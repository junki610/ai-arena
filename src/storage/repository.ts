import {
  createInitialArenaState,
  generateMatchCards,
  getLocalDateString,
} from '../data/seed';
import {
  ArenaState,
  BattleResult,
  Bet,
  EngineType,
  Fighter,
  FighterStats,
  MatchCard,
  PersonalityType,
} from '../types/arena';

const STORAGE_KEY = 'ai_arena_mvp_state_v1';
const DAILY_BONUS_POINTS = 200;

/** 新規ファイター作成入力 */
export interface CreateFighterInput {
  name: string;
  engine: EngineType;
  personality: PersonalityType;
  stats: FighterStats;
  skillIds: [string, string, string];
  instruction: string;
}

/**
 * データアクセス層の共通インターフェース
 * 後で Supabase へ差し替える場合は、このインターフェースを満たす
 * SupabaseArenaRepository に切り替えるだけで UI 側の変更を最小限に抑えられる。
 */
export interface ArenaRepository {
  loadState(): ArenaState;
  saveState(state: ArenaState): void;
  resetState(): ArenaState;
  claimDailyLoginBonus(): {
    state: ArenaState;
    awarded: boolean;
    amount: number;
  };
  createFighterAndScheduleMatch(input: CreateFighterInput): {
    state: ArenaState;
    fighter: Fighter;
    match: MatchCard;
  };
  placeBet(params: {
    matchId: string;
    pickedFighterId: string;
    amount: number;
    oddsAtBet: number;
  }): { state: ArenaState; bet: Bet } | { error: string };
  recordBattleResult(result: BattleResult): {
    state: ArenaState;
    settledBets: Bet[];
  };
  regenerateMatches(): ArenaState;
}

/**
 * localStorage を利用した MVP 用リポジトリ実装
 */
class LocalStorageArenaRepository implements ArenaRepository {
  loadState(): ArenaState {
    if (typeof window === 'undefined') {
      return createInitialArenaState();
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = createInitialArenaState();
        this.saveState(initial);
        return initial;
      }

      const parsed = JSON.parse(raw) as Partial<ArenaState>;
      if (
        !parsed ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.fighters) ||
        !Array.isArray(parsed.matches) ||
        !parsed.user
      ) {
        const initial = createInitialArenaState();
        this.saveState(initial);
        return initial;
      }

      return {
        version: 1,
        fighters: parsed.fighters,
        matches: parsed.matches,
        results: Array.isArray(parsed.results) ? parsed.results : [],
        bets: Array.isArray(parsed.bets) ? parsed.bets : [],
        user: parsed.user,
        mockPredictors: Array.isArray(parsed.mockPredictors)
          ? parsed.mockPredictors
          : createInitialArenaState().mockPredictors,
      };
    } catch {
      const initial = createInitialArenaState();
      this.saveState(initial);
      return initial;
    }
  }

  saveState(state: ArenaState): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ストレージ容量超過などは黙殺せず安全にフォールバック
    }
  }

  resetState(): ArenaState {
    const fresh = createInitialArenaState();
    this.saveState(fresh);
    return fresh;
  }

  /**
   * 毎日ログインボーナス（+200pt）を localStorage の日付で判定して付与する
   */
  claimDailyLoginBonus(): {
    state: ArenaState;
    awarded: boolean;
    amount: number;
  } {
    const state = this.loadState();
    const today = getLocalDateString();

    if (state.user.lastLoginDate !== today) {
      const nextState: ArenaState = {
        ...state,
        user: {
          ...state.user,
          points: state.user.points + DAILY_BONUS_POINTS,
          lastLoginDate: today,
        },
      };
      this.saveState(nextState);
      return { state: nextState, awarded: true, amount: DAILY_BONUS_POINTS };
    }

    return { state, awarded: false, amount: 0 };
  }

  /**
   * 新規ファイターを登録し、今日の対戦カード（最大8試合）へ即座に反映する
   */
  createFighterAndScheduleMatch(input: CreateFighterInput): {
    state: ArenaState;
    fighter: Fighter;
    match: MatchCard;
  } {
    const state = this.loadState();
    const id = `fighter-user-${Date.now().toString(36)}`;

    const newFighter: Fighter = {
      id,
      name: input.name.trim(),
      engine: input.engine,
      personality: input.personality,
      stats: { ...input.stats },
      skillIds: [...input.skillIds] as [string, string, string],
      instruction: input.instruction.trim().slice(0, 500),
      wins: 0,
      losses: 0,
      rating: 1500,
      recentForm: [],
      lineage: {
        generation: 1,
        parentAId: null,
        parentBId: null,
        inheritedSkillIds: [],
        note: 'ユーザー作成の第1世代ファイター。将来の系譜機能で親として登録可能になる予定。',
      },
      isPreset: false,
      createdAt: new Date().toISOString(),
    };

    // 対戦相手を既存ファイターから1体選定（異エンジンを優先）
    const diffEngineCandidates = state.fighters.filter(
      (f) => f.engine !== newFighter.engine
    );
    const pool =
      diffEngineCandidates.length > 0 ? diffEngineCandidates : state.fighters;
    const opponent = pool[Math.floor(Math.random() * pool.length)];

    const newMatch: MatchCard = {
      id: `match-user-${Date.now().toString(36)}`,
      roundLabel: '注目カード',
      fighterAId: newFighter.id,
      fighterBId: opponent.id,
      mockPoolA: 720,
      mockPoolB: 980,
      deadlineLabel: 'まもなく締切',
      status: 'scheduled',
    };

    // 最大8試合を維持しつつ、新しい対戦カードを先頭に挿入
    const nextMatches = [newMatch, ...state.matches].slice(0, 8).map((m, idx) => ({
      ...m,
      roundLabel: idx === 0 ? '注目第1試合' : `第${idx + 1}試合`,
    }));

    const nextState: ArenaState = {
      ...state,
      fighters: [newFighter, ...state.fighters],
      matches: nextMatches,
    };

    this.saveState(nextState);
    return { state: nextState, fighter: newFighter, match: newMatch };
  }

  /**
   * 試合前の予想投票（無料ポイントのみ）を記録する
   */
  placeBet(params: {
    matchId: string;
    pickedFighterId: string;
    amount: number;
    oddsAtBet: number;
  }): { state: ArenaState; bet: Bet } | { error: string } {
    const state = this.loadState();
    const match = state.matches.find((m) => m.id === params.matchId);
    if (!match) {
      return { error: '対象の対戦カードが見つかりません。' };
    }
    if (match.status === 'completed') {
      return { error: 'この試合はすでに終了しているため予想できません。' };
    }

    const amount = Math.floor(params.amount);
    if (!Number.isFinite(amount) || amount < 10) {
      return { error: '賭けポイントは 10pt 以上で指定してください。' };
    }
    if (amount > state.user.points) {
      return { error: '保有している無料ポイントが不足しています。' };
    }

    const fighterA = state.fighters.find((f) => f.id === match.fighterAId);
    const fighterB = state.fighters.find((f) => f.id === match.fighterBId);
    if (!fighterA || !fighterB) {
      return { error: '出場ファイター情報が見つかりません。' };
    }

    const pickedFighter =
      params.pickedFighterId === fighterA.id ? fighterA : fighterB;
    const opponent =
      params.pickedFighterId === fighterA.id ? fighterB : fighterA;

    const bet: Bet = {
      id: `bet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      matchId: match.id,
      pickedFighterId: pickedFighter.id,
      pickedFighterName: pickedFighter.name,
      opponentName: opponent.name,
      amount,
      oddsAtBet: params.oddsAtBet,
      status: 'pending',
      payout: 0,
      createdAt: new Date().toISOString(),
    };

    const nextState: ArenaState = {
      ...state,
      bets: [bet, ...state.bets],
      user: {
        ...state.user,
        points: state.user.points - amount,
        totalBets: state.user.totalBets + 1,
      },
    };

    this.saveState(nextState);
    return { state: nextState, bet };
  }

  /**
   * 試合結果を永続化し、ファイター戦績（勝敗・近5戦・Eloレート）と予想ポイントを精算する
   */
  recordBattleResult(result: BattleResult): {
    state: ArenaState;
    settledBets: Bet[];
  } {
    const state = this.loadState();

    // 同一試合の二重反映を防止
    const targetMatch = state.matches.find((m) => m.id === result.matchId);
    if (targetMatch?.status === 'completed') {
      return { state, settledBets: [] };
    }

    // 1. ファイター戦績を更新
    const nextFighters = state.fighters.map((fighter) => {
      if (fighter.id === result.winnerId) {
        return {
          ...fighter,
          wins: fighter.wins + 1,
          rating: fighter.rating + result.ratingDeltaWinner,
          recentForm: [...fighter.recentForm, 'W' as const].slice(-5),
        };
      }
      if (fighter.id === result.loserId) {
        return {
          ...fighter,
          losses: fighter.losses + 1,
          rating: Math.max(1000, fighter.rating + result.ratingDeltaLoser),
          recentForm: [...fighter.recentForm, 'L' as const].slice(-5),
        };
      }
      return fighter;
    });

    // 2. 対戦カードの状態を完了に更新
    const nextMatches = state.matches.map((match) =>
      match.id === result.matchId
        ? { ...match, status: 'completed' as const, resultId: result.id }
        : match
    );

    // 3. 該当試合の未精算予想を精算
    const settledBets: Bet[] = [];
    let totalPayout = 0;
    let wonCount = 0;
    const nowIso = new Date().toISOString();

    const nextBets = state.bets.map((bet) => {
      if (bet.matchId !== result.matchId || bet.status !== 'pending') {
        return bet;
      }
      const isWin = bet.pickedFighterId === result.winnerId;
      const payout = isWin ? Math.round(bet.amount * bet.oddsAtBet) : 0;
      if (isWin) {
        totalPayout += payout;
        wonCount += 1;
      }
      const updated: Bet = {
        ...bet,
        status: isWin ? 'won' : 'lost',
        payout,
        settledAt: nowIso,
      };
      settledBets.push(updated);
      return updated;
    });

    const nextState: ArenaState = {
      ...state,
      fighters: nextFighters,
      matches: nextMatches,
      results: [result, ...state.results].slice(0, 30),
      bets: nextBets,
      user: {
        ...state.user,
        points: state.user.points + totalPayout,
        totalWins: state.user.totalWins + wonCount,
      },
    };

    this.saveState(nextState);
    return { state: nextState, settledBets };
  }

  /**
   * 現在の登録ファイターから対戦カード（最大8試合）を再編成する
   */
  regenerateMatches(): ArenaState {
    const state = this.loadState();
    // ユーザー作成ファイターを先頭にしてカードに入りやすくする
    const sorted = [...state.fighters].sort((a, b) => {
      if (a.isPreset !== b.isPreset) return a.isPreset ? 1 : -1;
      return b.rating - a.rating;
    });
    const nextState: ArenaState = {
      ...state,
      matches: generateMatchCards(sorted, 8),
    };
    this.saveState(nextState);
    return nextState;
  }
}

export const arenaRepository: ArenaRepository =
  new LocalStorageArenaRepository();
