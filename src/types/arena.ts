/**
 * AI ARENA 共通型定義
 * 将来 Supabase へ移行する際も、このドメインモデルを基準にテーブル設計を行う。
 */

/** AIエンジンの種別（事実表示のみ・公式ロゴ不使用） */
export type EngineType = 'gemini' | 'claude' | 'chatgpt';

/** ファイターの性格 */
export type PersonalityType = 'aggressive' | 'cautious' | 'tricky';

/** 近5戦の勝敗記録（W=勝ち ○ / L=負け ●） */
export type FormResult = 'W' | 'L';

/** 合計100ポイントを配分する基本ステータス */
export interface FighterStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  technique: number;
}

/** スキルのカテゴリ */
export type SkillCategory = 'attack' | 'defense' | 'buff' | 'special';

/** スキルマスタ定義 */
export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  /** ダメージ倍率（攻撃系のみ） */
  powerMultiplier?: number;
  /** 回復量（HP割合、回復系のみ） */
  healRatio?: number;
  /** 防御軽減倍率（防御系のみ） */
  defenseBoost?: number;
  /** 次ターン攻撃倍率（バフ系のみ） */
  nextAttackBoost?: number;
  /** 相手防御ダウン割合 */
  armorBreak?: number;
  /** クリティカル率加算 */
  critBonus?: number;
  /** 反動ダメージ割合 */
  recoilRatio?: number;
  /** クールダウン（ターン数） */
  cooldown: number;
}

/** ファイターの系譜情報（将来拡張用の枠） */
export interface FighterLineage {
  generation: number;
  parentAId: string | null;
  parentBId: string | null;
  parentAName?: string;
  parentBName?: string;
  inheritedSkillIds: string[];
  note: string;
}

/** ファイターのアバター形状 */
export type AvatarBodyType = 'round' | 'robo' | 'slime' | 'spiky';

/** ファイターのアバターパーツ */
export type AvatarPartsType = 'horn' | 'wing' | 'antenna' | 'ear' | 'halo' | 'none';

/** ファイターのアバターの目 */
export type AvatarEyesType = 'round' | 'sharp' | 'happy' | 'star';

/** ファイターの見た目設定 */
export interface FighterAppearance {
  body: AvatarBodyType;
  mainColor: string;
  subColor: string;
  parts: AvatarPartsType;
  eyes: AvatarEyesType;
}

/** ファイターエンティティ */
export interface Fighter {
  id: string;
  name: string;
  engine: EngineType;
  personality: PersonalityType;
  /** アバター見た目設定 */
  appearance: FighterAppearance;
  stats: FighterStats;
  /** 選択されたスキルID（必ず3つ） */
  skillIds: [string, string, string];
  /** 育成者の指示文（最大500文字） */
  instruction: string;
  /** 戦績 */
  wins: number;
  losses: number;
  /** Elo風レート（初期1500） */
  rating: number;
  /** 直近5戦の勝敗（新しいものが右側） */
  recentForm: FormResult[];
  /** 系譜情報 */
  lineage: FighterLineage;
  /** プリセットかユーザー作成か */
  isPreset: boolean;
  createdAt: string;
}

/** ターンの行動種別 */
export type BattleActionType = 'attack' | 'defend' | 'skill' | 'charge';

/** 1行動のログデータ */
export interface BattleActionEvent {
  turn: number;
  actorId: string;
  actorSide: 'left' | 'right';
  targetId: string;
  targetSide: 'left' | 'right';
  action: BattleActionType;
  skillId?: string;
  skillName?: string;
  damage: number;
  healed: number;
  isCrit: boolean;
  wasGuarded: boolean;
  /** 行動後に反映される両者の残HP */
  leftHpAfter: number;
  rightHpAfter: number;
  leftMaxHp: number;
  rightMaxHp: number;
  /** 実況テキスト */
  commentary: string;
  /** 行動選択に影響した指示文キーワード（あれば） */
  triggeredKeyword?: string;
}

/** 試合結果 */
export interface BattleResult {
  id: string;
  matchId: string;
  fighterAId: string;
  fighterBId: string;
  fighterAName: string;
  fighterBName: string;
  winnerId: string;
  loserId: string;
  winnerName: string;
  loserName: string;
  totalTurns: number;
  /** 決着理由（KO / 判定） */
  finishType: 'KO' | 'DECISION';
  /** 勝因の要約（決め手ターン・要因） */
  summary: string;
  /** ハイライトターン番号 */
  decisiveTurn: number;
  /** レート変動 */
  ratingDeltaWinner: number;
  ratingDeltaLoser: number;
  /** 全行動イベント */
  events: BattleActionEvent[];
  leftMaxHp: number;
  rightMaxHp: number;
  completedAt: string;
}

/** 対戦カード */
export interface MatchCard {
  id: string;
  roundLabel: string;
  fighterAId: string;
  fighterBId: string;
  /** モックの賭け分布（人気度表現用・無料ポイント単位） */
  mockPoolA: number;
  mockPoolB: number;
  /** 予想締切表示ラベル（例: "20:00 締切"） */
  deadlineLabel: string;
  status: 'scheduled' | 'completed';
  resultId?: string;
}

/** 予想（無料ポイント投票） */
export interface Bet {
  id: string;
  matchId: string;
  pickedFighterId: string;
  pickedFighterName: string;
  opponentName: string;
  amount: number;
  oddsAtBet: number;
  status: 'pending' | 'won' | 'lost';
  payout: number;
  createdAt: string;
  settledAt?: string;
}

/** ユーザーの無料ポイントウォレット（換金・購入不可） */
export interface UserWallet {
  displayName: string;
  points: number;
  /** YYYY-MM-DD 形式の最終ログインボーナス受取日 */
  lastLoginDate: string;
  totalBets: number;
  totalWins: number;
}

/** 予想者ランキング用のモック参加者 */
export interface PredictorRankingEntry {
  id: string;
  displayName: string;
  points: number;
  totalBets: number;
  totalWins: number;
  isCurrentUser?: boolean;
}

/** localStorage に永続化するアプリ全体状態 */
export interface ArenaState {
  version: number;
  fighters: Fighter[];
  matches: MatchCard[];
  results: BattleResult[];
  bets: Bet[];
  user: UserWallet;
  mockPredictors: PredictorRankingEntry[];
}

/** 画面タブの識別子 */
export type PageTab = 'home' | 'create' | 'battle' | 'predict' | 'results';
