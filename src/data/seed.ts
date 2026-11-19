import {
  ArenaState,
  Fighter,
  MatchCard,
  PredictorRankingEntry,
} from '../types/arena';

/** 今日の日付文字列（ローカルタイム YYYY-MM-DD）を返す */
export function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 初期プリセットファイター6体（各エンジン2体ずつ）
 * 実在モデルの公式キャラクターではなく、架空のオリジナルファイターとして定義。
 */
export const INITIAL_FIGHTERS: Fighter[] = [
  {
    id: 'fighter-gem-1',
    name: 'フレア・イグニス',
    engine: 'gemini',
    personality: 'aggressive',
    stats: { hp: 20, attack: 32, defense: 12, speed: 22, technique: 14 },
    skillIds: ['overclock_slash', 'burst_charge', 'risk_dive'],
    instruction:
      '序盤から先手で全力攻撃を仕掛けろ。チャンスがあれば溜めて一撃必殺のリスクダイブで押し切れ。',
    wins: 7,
    losses: 3,
    rating: 1568,
    recentForm: ['W', 'W', 'L', 'W', 'W'],
    lineage: {
      generation: 1,
      parentAId: null,
      parentBId: null,
      inheritedSkillIds: [],
      note: '第1世代（初期登録ファイター）。今後の系譜機能で次世代へスキル継承が可能になる予定。',
    },
    isPreset: true,
    createdAt: '2026-11-01T09:00:00Z',
  },
  {
    id: 'fighter-gem-2',
    name: 'ノヴァ・スパーク',
    engine: 'gemini',
    personality: 'tricky',
    stats: { hp: 18, attack: 26, defense: 14, speed: 24, technique: 18 },
    skillIds: ['apex_beam', 'tempo_shift', 'logic_break'],
    instruction:
      'スピードとトリッキーな攻めで相手の防御を崩せ。隙を見たらエイペックスビームで一気に畳み掛けろ。',
    wins: 6,
    losses: 4,
    rating: 1532,
    recentForm: ['L', 'W', 'W', 'L', 'W'],
    lineage: {
      generation: 1,
      parentAId: null,
      parentBId: null,
      inheritedSkillIds: [],
      note: '第1世代（初期登録ファイター）。高出力・変則戦術の始祖モデル。',
    },
    isPreset: true,
    createdAt: '2026-11-01T09:05:00Z',
  },
  {
    id: 'fighter-cla-1',
    name: 'イージス・モノリス',
    engine: 'claude',
    personality: 'cautious',
    stats: { hp: 28, attack: 14, defense: 30, speed: 12, technique: 16 },
    skillIds: ['iron_wall', 'repair_protocol', 'counter_stance'],
    instruction:
      'まずは堅実に守りを固めろ。相手の猛攻を耐え抜き、カウンターと回復で長期戦を制する方針で戦え。',
    wins: 8,
    losses: 2,
    rating: 1584,
    recentForm: ['W', 'W', 'W', 'L', 'W'],
    lineage: {
      generation: 1,
      parentAId: null,
      parentBId: null,
      inheritedSkillIds: [],
      note: '第1世代（初期登録ファイター）。耐久・反撃系統の基礎個体。',
    },
    isPreset: true,
    createdAt: '2026-11-01T09:10:00Z',
  },
  {
    id: 'fighter-cla-2',
    name: 'ヴェール・ソナタ',
    engine: 'claude',
    personality: 'tricky',
    stats: { hp: 22, attack: 16, defense: 22, speed: 16, technique: 24 },
    skillIds: ['data_drain', 'jamming_noise', 'precision_scan'],
    instruction:
      '慎重に距離を取りつつ攪乱とドレインでじわじわ削れ。相手のミスを誘い、精密解析で確実に仕留めろ。',
    wins: 5,
    losses: 5,
    rating: 1504,
    recentForm: ['L', 'L', 'W', 'W', 'L'],
    lineage: {
      generation: 1,
      parentAId: null,
      parentBId: null,
      inheritedSkillIds: [],
      note: '第1世代（初期登録ファイター）。吸収・妨害戦術の基礎個体。',
    },
    isPreset: true,
    createdAt: '2026-11-01T09:15:00Z',
  },
  {
    id: 'fighter-gpt-1',
    name: 'クロノ・バランサー',
    engine: 'chatgpt',
    personality: 'cautious',
    stats: { hp: 22, attack: 20, defense: 20, speed: 18, technique: 20 },
    skillIds: ['precision_scan', 'counter_stance', 'data_drain'],
    instruction:
      '全体のバランスを保ち、状況を見て攻守を切り替えろ。HPが減ったら回復や防御を優先し、勝機で攻撃しろ。',
    wins: 6,
    losses: 3,
    rating: 1546,
    recentForm: ['W', 'L', 'W', 'W', 'W'],
    lineage: {
      generation: 1,
      parentAId: null,
      parentBId: null,
      inheritedSkillIds: [],
      note: '第1世代（初期登録ファイター）。万能型バランス系統の基礎個体。',
    },
    isPreset: true,
    createdAt: '2026-11-01T09:20:00Z',
  },
  {
    id: 'fighter-gpt-2',
    name: 'アーク・ストライダー',
    engine: 'chatgpt',
    personality: 'aggressive',
    stats: { hp: 20, attack: 24, defense: 16, speed: 22, technique: 18 },
    skillIds: ['overclock_slash', 'logic_break', 'tempo_shift'],
    instruction:
      '高い機動力を活かして攻め続けろ。防御型相手にはロジックブレイクを合わせてテンポよく押し切れ。',
    wins: 4,
    losses: 6,
    rating: 1478,
    recentForm: ['L', 'W', 'L', 'L', 'W'],
    lineage: {
      generation: 1,
      parentAId: null,
      parentBId: null,
      inheritedSkillIds: [],
      note: '第1世代（初期登録ファイター）。機動攻撃系統の基礎個体。',
    },
    isPreset: true,
    createdAt: '2026-11-01T09:25:00Z',
  },
];

/** 予想者ランキングの初期モック参加者 */
export const INITIAL_MOCK_PREDICTORS: PredictorRankingEntry[] = [
  { id: 'pred-1', displayName: 'データアナリストK', points: 2480, totalBets: 18, totalWins: 13 },
  { id: 'pred-2', displayName: '万馬券AIウォッチャー', points: 1920, totalBets: 15, totalWins: 9 },
  { id: 'pred-3', displayName: '堅実派のタクミ', points: 1540, totalBets: 12, totalWins: 8 },
  { id: 'pred-4', displayName: '逆張りマスター', points: 1180, totalBets: 20, totalWins: 7 },
  { id: 'pred-5', displayName: '観戦ビギナーR', points: 860, totalBets: 6, totalWins: 3 },
];

const DEADLINE_SLOTS = [
  '12:00 締切',
  '13:30 締切',
  '15:00 締切',
  '16:30 締切',
  '18:00 締切',
  '19:30 締切',
  '21:00 締切',
  '22:30 締切',
];

/**
 * 登録ファイターから最大8試合の対戦カードを自動生成する
 */
export function generateMatchCards(fighters: Fighter[], maxMatches = 8): MatchCard[] {
  if (fighters.length < 2) return [];

  const pairs: Array<[Fighter, Fighter]> = [];
  for (let i = 0; i < fighters.length; i += 1) {
    for (let j = i + 1; j < fighters.length; j += 1) {
      pairs.push([fighters[i], fighters[j]]);
    }
  }

  // 異エンジン対決を優先しつつシャッフル感のある順序に整列
  pairs.sort((a, b) => {
    const diffA = a[0].engine !== a[1].engine ? 0 : 1;
    const diffB = b[0].engine !== b[1].engine ? 0 : 1;
    if (diffA !== diffB) return diffA - diffB;
    const ratingGapA = Math.abs(a[0].rating - a[1].rating);
    const ratingGapB = Math.abs(b[0].rating - b[1].rating);
    return ratingGapA - ratingGapB;
  });

  const selected = pairs.slice(0, Math.min(maxMatches, 8));
  const nowSuffix = Date.now().toString(36).slice(-4);

  return selected.map(([a, b], index) => {
    // Elo差に応じてモックの人気票（賭け分布）に自然な偏りをつける
    const ratingDiff = a.rating - b.rating;
    const basePool = 1400 + (index % 4) * 350;
    const ratioA = Math.min(0.76, Math.max(0.24, 0.5 + ratingDiff / 500));
    const mockPoolA = Math.round((basePool * ratioA) / 10) * 10;
    const mockPoolB = Math.round((basePool * (1 - ratioA)) / 10) * 10;

    return {
      id: `match-${index + 1}-${nowSuffix}`,
      roundLabel: `第${index + 1}試合`,
      fighterAId: a.id,
      fighterBId: b.id,
      mockPoolA,
      mockPoolB,
      deadlineLabel: DEADLINE_SLOTS[index % DEADLINE_SLOTS.length],
      status: 'scheduled',
    };
  });
}

/** 初期状態の生成 */
export function createInitialArenaState(): ArenaState {
  const fighters = INITIAL_FIGHTERS.map((f) => ({
    ...f,
    stats: { ...f.stats },
    skillIds: [...f.skillIds] as [string, string, string],
    recentForm: [...f.recentForm],
    lineage: { ...f.lineage, inheritedSkillIds: [...f.lineage.inheritedSkillIds] },
  }));

  return {
    version: 1,
    fighters,
    matches: generateMatchCards(fighters, 8),
    results: [],
    bets: [],
    user: {
      displayName: 'あなた（観戦者）',
      points: 1000,
      lastLoginDate: getLocalDateString(),
      totalBets: 0,
      totalWins: 0,
    },
    mockPredictors: INITIAL_MOCK_PREDICTORS.map((p) => ({ ...p })),
  };
}
