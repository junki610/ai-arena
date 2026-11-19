import { SkillDefinition } from '../types/arena';

/**
 * ファイター作成時に3つ選択できるスキルマスタ（全12種）
 */
export const SKILLS: SkillDefinition[] = [
  {
    id: 'overclock_slash',
    name: 'オーバークロック斬り',
    category: 'attack',
    description: '高出力の連続斬撃。通常攻撃の1.55倍のダメージを与える。',
    powerMultiplier: 1.55,
    cooldown: 3,
  },
  {
    id: 'iron_wall',
    name: 'アイアンウォール',
    category: 'defense',
    description: '強固な防御障壁を展開し、受けるダメージを大幅に軽減（約60%カット）＋小回復。',
    defenseBoost: 0.6,
    healRatio: 0.08,
    cooldown: 3,
  },
  {
    id: 'data_drain',
    name: 'データドレイン',
    category: 'special',
    description: '1.15倍のダメージを与えつつ、最大HPの12%を吸収回復する。',
    powerMultiplier: 1.15,
    healRatio: 0.12,
    cooldown: 3,
  },
  {
    id: 'logic_break',
    name: 'ロジックブレイク',
    category: 'special',
    description: '相手の防御構造を崩す1.2倍攻撃。相手の防御効果を貫通しやすい。',
    powerMultiplier: 1.2,
    armorBreak: 0.4,
    cooldown: 3,
  },
  {
    id: 'burst_charge',
    name: 'バーストチャージ',
    category: 'buff',
    description: '演算リソースを集中し、次の攻撃または攻撃スキルの威力を1.65倍に増幅する。',
    nextAttackBoost: 1.65,
    cooldown: 3,
  },
  {
    id: 'precision_scan',
    name: '精密解析ショット',
    category: 'attack',
    description: '弱点を正確に突く1.3倍攻撃。クリティカル率が大幅に上昇する。',
    powerMultiplier: 1.3,
    critBonus: 0.35,
    cooldown: 3,
  },
  {
    id: 'repair_protocol',
    name: 'リペアプロトコル',
    category: 'defense',
    description: '緊急修復を実行し、最大HPの22%を回復する。長期戦に強い。',
    healRatio: 0.22,
    defenseBoost: 0.2,
    cooldown: 4,
  },
  {
    id: 'risk_dive',
    name: 'リスクダイブ',
    category: 'attack',
    description: '自身の最大HPの8%を代償に、1.85倍の超火力攻撃を放つ捨て身の一撃。',
    powerMultiplier: 1.85,
    recoilRatio: 0.08,
    cooldown: 4,
  },
  {
    id: 'counter_stance',
    name: 'カウンタースタンス',
    category: 'defense',
    description: '防御態勢を取りつつ反撃の構え。ダメージを45%軽減し、次ターンの攻撃を1.3倍にする。',
    defenseBoost: 0.45,
    nextAttackBoost: 1.3,
    cooldown: 3,
  },
  {
    id: 'tempo_shift',
    name: 'テンポシフト',
    category: 'special',
    description: '素早さを活かした1.25倍の変則連撃。テクニックが高いほどクリティカルが出やすい。',
    powerMultiplier: 1.25,
    critBonus: 0.2,
    cooldown: 2,
  },
  {
    id: 'jamming_noise',
    name: 'ジャミングノイズ',
    category: 'special',
    description: 'ノイズで相手を攪乱しながら1.1倍攻撃。防御を25%削り、自身のHPを6%整える。',
    powerMultiplier: 1.1,
    armorBreak: 0.25,
    healRatio: 0.06,
    cooldown: 2,
  },
  {
    id: 'apex_beam',
    name: 'エイペックスビーム',
    category: 'attack',
    description: '収束エネルギー砲。1.65倍の高威力＋防御20%貫通。',
    powerMultiplier: 1.65,
    armorBreak: 0.2,
    cooldown: 4,
  },
];

export const SKILL_MAP: Record<string, SkillDefinition> = Object.fromEntries(
  SKILLS.map((skill) => [skill.id, skill])
);

export function getSkillById(skillId: string): SkillDefinition | undefined {
  return SKILL_MAP[skillId];
}
