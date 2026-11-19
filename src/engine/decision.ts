import { getSkillById } from '../data/skills';
import {
  BattleActionType,
  Fighter,
  SkillDefinition,
} from '../types/arena';
import { ENGINE_PROFILES, PERSONALITY_PROFILES } from './profiles';

/** 行動判定に渡すターンの盤面コンテキスト */
export interface TurnDecisionContext {
  turn: number;
  maxTurns: number;
  actor: Fighter;
  actorHp: number;
  actorMaxHp: number;
  actorCharged: boolean;
  actorCooldowns: Record<string, number>;
  opponent: Fighter;
  opponentHp: number;
  opponentMaxHp: number;
  opponentCharged: boolean;
}

/** 行動判定の結果 */
export interface TurnDecisionResult {
  action: BattleActionType;
  skillId?: string;
  triggeredKeyword?: string;
}

/**
 * 将来的に実 API（Gemini 無料枠 / BYOK）へ差し替えるための抽象インターフェース
 * 詳細は docs/api-integration.md を参照。
 */
export interface BattleDecisionProvider {
  decideAction(
    context: TurnDecisionContext,
    rng: () => number
  ): TurnDecisionResult;
}

interface KeywordRule {
  keywords: string[];
  label: string;
  delta: {
    attack: number;
    defend: number;
    skill: number;
    charge: number;
  };
  preferSkillCategories?: Array<SkillDefinition['category']>;
}

/** 育成者の指示文から簡易的に作戦傾向を抽出するルール */
const INSTRUCTION_KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['先手', '速攻', '全力', '攻め', '火力', '押し切', '一気'],
    label: '積極攻撃指示',
    delta: { attack: 14, defend: -6, skill: 8, charge: 4 },
    preferSkillCategories: ['attack'],
  },
  {
    keywords: ['守', '防御', '耐', '慎重', '堅実', '長期', '回復', 'カウンター'],
    label: '堅守・耐久指示',
    delta: { attack: -6, defend: 16, skill: 8, charge: -4 },
    preferSkillCategories: ['defense'],
  },
  {
    keywords: ['溜', 'チャージ', '一撃', '必殺', '温存', '大技'],
    label: '溜め・一撃指示',
    delta: { attack: 2, defend: -2, skill: 6, charge: 16 },
    preferSkillCategories: ['buff', 'attack'],
  },
  {
    keywords: ['トリッキー', '攪乱', '妨害', '崩', 'ドレイン', '精密', '隙'],
    label: '技巧・攪乱指示',
    delta: { attack: -2, defend: 2, skill: 16, charge: 4 },
    preferSkillCategories: ['special'],
  },
];

/**
 * 指示文から該当するキーワードルールを解析する
 */
function parseInstructionHints(instruction: string): {
  delta: { attack: number; defend: number; skill: number; charge: number };
  matchedLabels: string[];
  preferredCategories: Set<SkillDefinition['category']>;
} {
  const delta = { attack: 0, defend: 0, skill: 0, charge: 0 };
  const matchedLabels: string[] = [];
  const preferredCategories = new Set<SkillDefinition['category']>();

  for (const rule of INSTRUCTION_KEYWORD_RULES) {
    const hit = rule.keywords.some((kw) => instruction.includes(kw));
    if (hit) {
      delta.attack += rule.delta.attack;
      delta.defend += rule.delta.defend;
      delta.skill += rule.delta.skill;
      delta.charge += rule.delta.charge;
      matchedLabels.push(rule.label);
      rule.preferSkillCategories?.forEach((c) => preferredCategories.add(c));
    }
  }

  return { delta, matchedLabels, preferredCategories };
}

/**
 * 現在の盤面・エンジン・性格・指示文から使用するスキルを1つ選ぶ
 */
function pickBestReadySkill(
  context: TurnDecisionContext,
  readySkills: SkillDefinition[],
  preferredCategories: Set<SkillDefinition['category']>,
  rng: () => number
): SkillDefinition {
  const hpRatio = context.actorHp / context.actorMaxHp;
  const oppHpRatio = context.opponentHp / context.opponentMaxHp;

  const scored = readySkills.map((skill) => {
    let score = 20;

    // すでに溜め状態なら攻撃系スキルを強く優先
    if (context.actorCharged && skill.powerMultiplier) {
      score += 35;
    }

    // HPが低いときは回復・防御スキルを優先
    if (hpRatio < 0.45 && (skill.healRatio || skill.defenseBoost)) {
      score += 28;
    }

    // 相手HPが低いときはフィニッシュできる攻撃スキルを優先
    if (oppHpRatio < 0.35 && skill.powerMultiplier) {
      score += 24;
    }

    // エンジン傾向補正
    if (context.actor.engine === 'gemini' && skill.powerMultiplier) score += 12;
    if (context.actor.engine === 'claude' && (skill.defenseBoost || skill.healRatio)) score += 12;
    if (context.actor.engine === 'chatgpt') score += 5;

    // 指示文由来の優先カテゴリ
    if (preferredCategories.has(skill.category)) {
      score += 14;
    }

    // ランダム揺らぎ
    score += rng() * 12;
    return { skill, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].skill;
}

/**
 * ローカルシミュレーション版の行動判定プロバイダ
 * 外部APIは一切呼ばず、エンジン傾向・性格・指示文キーワード・盤面状態から決定する。
 */
export class SimulationDecisionProvider implements BattleDecisionProvider {
  decideAction(
    context: TurnDecisionContext,
    rng: () => number
  ): TurnDecisionResult {
    const engineProfile = ENGINE_PROFILES[context.actor.engine];
    const personalityProfile = PERSONALITY_PROFILES[context.actor.personality];
    const hints = parseInstructionHints(context.actor.instruction);

    const readySkills = context.actor.skillIds
      .map((id) => getSkillById(id))
      .filter((s): s is SkillDefinition => Boolean(s))
      .filter((s) => (context.actorCooldowns[s.id] ?? 0) === 0);

    const weights = {
      attack:
        engineProfile.actionWeights.attack +
        personalityProfile.weightModifiers.attack +
        hints.delta.attack,
      defend:
        engineProfile.actionWeights.defend +
        personalityProfile.weightModifiers.defend +
        hints.delta.defend,
      skill:
        engineProfile.actionWeights.skill +
        personalityProfile.weightModifiers.skill +
        hints.delta.skill,
      charge:
        engineProfile.actionWeights.charge +
        personalityProfile.weightModifiers.charge +
        hints.delta.charge,
    };

    const hpRatio = context.actorHp / context.actorMaxHp;

    // 盤面に応じた戦術調整
    if (context.actorCharged) {
      // 溜め完了直後は連続溜めせず攻撃または攻撃スキルに振り切る
      weights.charge = 0;
      weights.attack += 28;
      weights.skill += 24;
      weights.defend = Math.max(4, weights.defend - 12);
    }

    if (context.opponentCharged) {
      // 相手が溜めているときは慎重・Claude系ほど防御寄り
      weights.defend += context.actor.engine === 'claude' ? 24 : 12;
    }

    if (hpRatio < 0.35) {
      weights.defend += context.actor.personality === 'cautious' ? 20 : 8;
    }

    // 終盤（17ターン目以降）は決着をつけにいく
    if (context.turn >= context.maxTurns - 3) {
      weights.attack += 15;
      weights.skill += 10;
      weights.charge = Math.max(0, weights.charge - 10);
    }

    if (readySkills.length === 0) {
      weights.skill = 0;
    }

    // 下限を0に正規化
    const safeWeights = {
      attack: Math.max(5, weights.attack),
      defend: Math.max(2, weights.defend),
      skill: readySkills.length > 0 ? Math.max(4, weights.skill) : 0,
      charge: context.actorCharged ? 0 : Math.max(0, weights.charge),
    };

    const total =
      safeWeights.attack +
      safeWeights.defend +
      safeWeights.skill +
      safeWeights.charge;

    let roll = rng() * total;
    let chosen: BattleActionType = 'attack';

    if ((roll -= safeWeights.attack) <= 0) {
      chosen = 'attack';
    } else if ((roll -= safeWeights.defend) <= 0) {
      chosen = 'defend';
    } else if ((roll -= safeWeights.skill) <= 0) {
      chosen = 'skill';
    } else {
      chosen = 'charge';
    }

    const triggeredKeyword =
      hints.matchedLabels.length > 0 && rng() < 0.45
        ? hints.matchedLabels[Math.floor(rng() * hints.matchedLabels.length)]
        : undefined;

    if (chosen === 'skill' && readySkills.length > 0) {
      const selectedSkill = pickBestReadySkill(
        context,
        readySkills,
        hints.preferredCategories,
        rng
      );
      return {
        action: 'skill',
        skillId: selectedSkill.id,
        triggeredKeyword,
      };
    }

    return {
      action: chosen === 'skill' ? 'attack' : chosen,
      triggeredKeyword,
    };
  }
}

export const defaultDecisionProvider: BattleDecisionProvider =
  new SimulationDecisionProvider();
