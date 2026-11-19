import { EngineType, PersonalityType } from '../types/arena';

/** エンジンごとの傾向パラメータ定義 */
export interface EngineProfile {
  id: EngineType;
  /** 事実表示ラベル（公式サービス誤解を避ける表現） */
  label: string;
  shortLabel: string;
  tendencySummary: string;
  /** 行動選択の基準重み */
  actionWeights: {
    attack: number;
    defend: number;
    skill: number;
    charge: number;
  };
  /** ダメージ・防御・クリティカルのわずかな傾向補正 */
  attackMultiplier: number;
  defenseMultiplier: number;
  critRateBonus: number;
  /** UIテーマカラー（公式ロゴは使わず抽象色のみ） */
  accentClass: string;
  badgeClass: string;
}

export const ENGINE_PROFILES: Record<EngineType, EngineProfile> = {
  gemini: {
    id: 'gemini',
    label: 'エンジン: Gemini 系',
    shortLabel: 'Gemini 系',
    tendencySummary: '大胆・高火力寄り（攻撃・スキル・溜めを積極選択、クリティカル率高め）',
    actionWeights: {
      attack: 34,
      defend: 12,
      skill: 34,
      charge: 20,
    },
    attackMultiplier: 1.07,
    defenseMultiplier: 0.95,
    critRateBonus: 0.05,
    accentClass: 'from-sky-500 to-indigo-600',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  },
  claude: {
    id: 'claude',
    label: 'エンジン: Claude 系',
    shortLabel: 'Claude 系',
    tendencySummary: '慎重・防御寄り（防御・回復・堅実なスキル運用で長期戦に強い）',
    actionWeights: {
      attack: 24,
      defend: 30,
      skill: 34,
      charge: 12,
    },
    attackMultiplier: 0.96,
    defenseMultiplier: 1.08,
    critRateBonus: 0.01,
    accentClass: 'from-amber-500 to-orange-600',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  chatgpt: {
    id: 'chatgpt',
    label: 'エンジン: ChatGPT 系',
    shortLabel: 'ChatGPT 系',
    tendencySummary: 'バランス型（状況に応じて攻守・スキルを過不足なく使い分ける）',
    actionWeights: {
      attack: 30,
      defend: 20,
      skill: 34,
      charge: 16,
    },
    attackMultiplier: 1.02,
    defenseMultiplier: 1.02,
    critRateBonus: 0.03,
    accentClass: 'from-emerald-500 to-teal-600',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
};

/** 性格ごとの傾向パラメータ定義 */
export interface PersonalityProfile {
  id: PersonalityType;
  label: string;
  description: string;
  weightModifiers: {
    attack: number;
    defend: number;
    skill: number;
    charge: number;
  };
}

export const PERSONALITY_PROFILES: Record<PersonalityType, PersonalityProfile> = {
  aggressive: {
    id: 'aggressive',
    label: '攻撃的',
    description: '序盤から攻め続け、大技や攻撃スキルを好む',
    weightModifiers: {
      attack: 14,
      defend: -10,
      skill: 6,
      charge: 6,
    },
  },
  cautious: {
    id: 'cautious',
    label: '慎重',
    description: '被弾を抑え、HPが減ると防御や回復を優先する',
    weightModifiers: {
      attack: -6,
      defend: 16,
      skill: 4,
      charge: -4,
    },
  },
  tricky: {
    id: 'tricky',
    label: 'トリッキー',
    description: 'スキルや溜めを織り交ぜ、変則的な展開を狙う',
    weightModifiers: {
      attack: -4,
      defend: 2,
      skill: 14,
      charge: 10,
    },
  },
};
