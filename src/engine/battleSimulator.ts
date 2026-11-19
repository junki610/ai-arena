import { getSkillById } from '../data/skills';
import {
  BattleActionEvent,
  BattleResult,
  Fighter,
} from '../types/arena';
import {
  BattleDecisionProvider,
  defaultDecisionProvider,
} from './decision';
import { ENGINE_PROFILES } from './profiles';

const MAX_TURNS = 20;

/** 簡易な線形合同法PRNG（シード付きで再現性を持たせる） */
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** ステータスから最大HPを算出 */
export function calculateMaxHp(fighter: Fighter): number {
  return 160 + fighter.stats.hp * 6;
}

/** Elo風レート変動の算出（K=32） */
export function calculateEloDelta(
  winnerRating: number,
  loserRating: number
): { winnerDelta: number; loserDelta: number } {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const delta = Math.max(8, Math.round(32 * (1 - expectedWinner)));
  return {
    winnerDelta: delta,
    loserDelta: -delta,
  };
}

interface CombatantRuntime {
  side: 'left' | 'right';
  fighter: Fighter;
  hp: number;
  maxHp: number;
  isDefending: boolean;
  defenseBoost: number;
  chargeMultiplier: number;
  cooldowns: Record<string, number>;
}

/**
 * ターン制オートバトル（最大20ターン）を実行し、全ログと勝因要約を返す。
 * ダメージ計算はすべてコード側で決定的に処理する。
 */
export function simulateBattle(
  matchId: string,
  fighterA: Fighter,
  fighterB: Fighter,
  options?: {
    seed?: number;
    decisionProvider?: BattleDecisionProvider;
  }
): BattleResult {
  const provider = options?.decisionProvider ?? defaultDecisionProvider;
  const seed = options?.seed ?? Date.now();
  const rng = createSeededRng(seed);

  const left: CombatantRuntime = {
    side: 'left',
    fighter: fighterA,
    hp: calculateMaxHp(fighterA),
    maxHp: calculateMaxHp(fighterA),
    isDefending: false,
    defenseBoost: 0,
    chargeMultiplier: 1,
    cooldowns: {},
  };

  const right: CombatantRuntime = {
    side: 'right',
    fighter: fighterB,
    hp: calculateMaxHp(fighterB),
    maxHp: calculateMaxHp(fighterB),
    isDefending: false,
    defenseBoost: 0,
    chargeMultiplier: 1,
    cooldowns: {},
  };

  const events: BattleActionEvent[] = [];
  let decisiveTurn = 1;
  let biggestSwingDamage = -1;
  let biggestSwingActorName = '';
  let biggestSwingActionName = '';
  let finishedTurn = MAX_TURNS;
  let finishType: 'KO' | 'DECISION' = 'DECISION';

  for (let turn = 1; turn <= MAX_TURNS; turn += 1) {
    // ターン開始時に防御状態をリセット・クールダウンを1減算
    for (const unit of [left, right]) {
      unit.isDefending = false;
      unit.defenseBoost = 0;
      for (const skillId of Object.keys(unit.cooldowns)) {
        if (unit.cooldowns[skillId] > 0) {
          unit.cooldowns[skillId] -= 1;
        }
      }
    }

    // 素早さ + 小さな乱数で行動順を決定
    const leftInit = left.fighter.stats.speed + rng() * 6;
    const rightInit = right.fighter.stats.speed + rng() * 6;
    const order: Array<[CombatantRuntime, CombatantRuntime]> =
      leftInit >= rightInit
        ? [
            [left, right],
            [right, left],
          ]
        : [
            [right, left],
            [left, right],
          ];

    for (const [actor, target] of order) {
      if (actor.hp <= 0 || target.hp <= 0) break;

      const decision = provider.decideAction(
        {
          turn,
          maxTurns: MAX_TURNS,
          actor: actor.fighter,
          actorHp: actor.hp,
          actorMaxHp: actor.maxHp,
          actorCharged: actor.chargeMultiplier > 1,
          actorCooldowns: { ...actor.cooldowns },
          opponent: target.fighter,
          opponentHp: target.hp,
          opponentMaxHp: target.maxHp,
          opponentCharged: target.chargeMultiplier > 1,
        },
        rng
      );

      const actorEngine = ENGINE_PROFILES[actor.fighter.engine];
      const targetEngine = ENGINE_PROFILES[target.fighter.engine];

      let damage = 0;
      let healed = 0;
      let isCrit = false;
      let wasGuarded = false;
      let skillName: string | undefined;
      let commentary = '';

      const hintPrefix = decision.triggeredKeyword
        ? `【${decision.triggeredKeyword}】`
        : '';

      if (decision.action === 'defend') {
        actor.isDefending = true;
        actor.defenseBoost = 0.45;
        healed = Math.round(actor.maxHp * 0.04);
        actor.hp = Math.min(actor.maxHp, actor.hp + healed);
        commentary = `${hintPrefix}${actor.fighter.name}は防御態勢を固め、被ダメージ軽減と小回復(+${healed}HP)を図った！`;
      } else if (decision.action === 'charge') {
        actor.chargeMultiplier = 1.55;
        commentary = `${hintPrefix}${actor.fighter.name}は演算出力を集中して力を溜めた！（次撃1.55倍）`;
      } else if (decision.action === 'skill' && decision.skillId) {
        const skill = getSkillById(decision.skillId);
        if (skill) {
          skillName = skill.name;
          actor.cooldowns[skill.id] = skill.cooldown;

          // 防御バフ系
          if (skill.defenseBoost) {
            actor.isDefending = true;
            actor.defenseBoost = Math.max(actor.defenseBoost, skill.defenseBoost);
          }

          // 回復系
          if (skill.healRatio) {
            healed = Math.round(actor.maxHp * skill.healRatio);
            actor.hp = Math.min(actor.maxHp, actor.hp + healed);
          }

          // 次ターン強化バフ
          if (skill.nextAttackBoost) {
            actor.chargeMultiplier = Math.max(
              actor.chargeMultiplier,
              skill.nextAttackBoost
            );
          }

          // 攻撃効果がある場合
          if (skill.powerMultiplier) {
            const critRate =
              0.08 +
              actor.fighter.stats.technique * 0.005 +
              actorEngine.critRateBonus +
              (skill.critBonus ?? 0);
            isCrit = rng() < critRate;

            const rawAttack =
              (22 + actor.fighter.stats.attack * 1.45 + actor.fighter.stats.technique * 0.3) *
              actorEngine.attackMultiplier *
              skill.powerMultiplier *
              actor.chargeMultiplier;

            const effectiveDefense =
              target.fighter.stats.defense *
              targetEngine.defenseMultiplier *
              (1 - (skill.armorBreak ?? 0));

            const mitigation = 100 / (100 + effectiveDefense * 2.2);
            const guardFactor = target.isDefending
              ? 1 - target.defenseBoost
              : 1;
            wasGuarded = target.isDefending;

            const variance = 0.92 + rng() * 0.16;
            const critMult = isCrit ? 1.45 : 1;

            damage = Math.max(
              8,
              Math.round(rawAttack * mitigation * guardFactor * critMult * variance)
            );
            target.hp = Math.max(0, target.hp - damage);
            actor.chargeMultiplier = 1;

            // 反動ダメージ
            let recoilText = '';
            if (skill.recoilRatio) {
              const recoil = Math.round(actor.maxHp * skill.recoilRatio);
              actor.hp = Math.max(1, actor.hp - recoil);
              recoilText = `（反動-${recoil}HP）`;
            }

            const critText = isCrit ? ' 痛恨のクリティカル！' : '';
            const guardText = wasGuarded ? '（ガードで軽減）' : '';
            const healText = healed > 0 ? ` さらにHPを${healed}回復！` : '';
            commentary = `${hintPrefix}${actor.fighter.name}のスキル「${skill.name}」！ ${target.fighter.name}に${damage}ダメージ${guardText}${critText}${healText}${recoilText}`;
          } else {
            const parts: string[] = [];
            if (skill.defenseBoost) parts.push('防御を大幅に強化');
            if (healed > 0) parts.push(`HPを${healed}回復`);
            if (skill.nextAttackBoost) parts.push(`次撃を${skill.nextAttackBoost}倍に増幅`);
            commentary = `${hintPrefix}${actor.fighter.name}はスキル「${skill.name}」を発動！ ${parts.join('・')}！`;
          }
        }
      } else {
        // 通常攻撃
        const critRate =
          0.08 +
          actor.fighter.stats.technique * 0.0045 +
          actorEngine.critRateBonus;
        isCrit = rng() < critRate;

        const rawAttack =
          (20 + actor.fighter.stats.attack * 1.35) *
          actorEngine.attackMultiplier *
          actor.chargeMultiplier;

        const effectiveDefense =
          target.fighter.stats.defense * targetEngine.defenseMultiplier;
        const mitigation = 100 / (100 + effectiveDefense * 2.15);
        const guardFactor = target.isDefending ? 1 - target.defenseBoost : 1;
        wasGuarded = target.isDefending;

        const variance = 0.92 + rng() * 0.16;
        const critMult = isCrit ? 1.4 : 1;

        damage = Math.max(
          6,
          Math.round(rawAttack * mitigation * guardFactor * critMult * variance)
        );
        target.hp = Math.max(0, target.hp - damage);
        actor.chargeMultiplier = 1;

        const critText = isCrit ? ' クリティカルヒット！' : '';
        const guardText = wasGuarded ? '（ガードで軽減）' : '';
        commentary = `${hintPrefix}${actor.fighter.name}の攻撃！ ${target.fighter.name}に${damage}ダメージ！${guardText}${critText}`;
      }

      if (damage > biggestSwingDamage) {
        biggestSwingDamage = damage;
        decisiveTurn = turn;
        biggestSwingActorName = actor.fighter.name;
        biggestSwingActionName = skillName ? `スキル「${skillName}」` : '通常攻撃';
      }

      events.push({
        turn,
        actorId: actor.fighter.id,
        actorSide: actor.side,
        targetId: target.fighter.id,
        targetSide: target.side,
        action: decision.action,
        skillId: decision.skillId,
        skillName,
        damage,
        healed,
        isCrit,
        wasGuarded,
        leftHpAfter: left.hp,
        rightHpAfter: right.hp,
        leftMaxHp: left.maxHp,
        rightMaxHp: right.maxHp,
        commentary,
        triggeredKeyword: decision.triggeredKeyword,
      });

      if (target.hp <= 0) {
        finishedTurn = turn;
        finishType = 'KO';
        break;
      }
    }

    if (left.hp <= 0 || right.hp <= 0) {
      break;
    }
  }

  // 勝敗判定
  let winnerUnit: CombatantRuntime;
  let loserUnit: CombatantRuntime;

  if (left.hp > 0 && right.hp <= 0) {
    winnerUnit = left;
    loserUnit = right;
  } else if (right.hp > 0 && left.hp <= 0) {
    winnerUnit = right;
    loserUnit = left;
  } else {
    // 20ターン経過時は残HP割合で判定
    const leftRatio = left.hp / left.maxHp;
    const rightRatio = right.hp / right.maxHp;
    if (leftRatio >= rightRatio) {
      winnerUnit = left;
      loserUnit = right;
    } else {
      winnerUnit = right;
      loserUnit = left;
    }
  }

  const { winnerDelta, loserDelta } = calculateEloDelta(
    winnerUnit.fighter.rating,
    loserUnit.fighter.rating
  );

  // 勝因要約の生成
  const winnerEngineLabel = ENGINE_PROFILES[winnerUnit.fighter.engine].shortLabel;
  const finishDesc =
    finishType === 'KO'
      ? `第${finishedTurn}ターンにKO決着。`
      : `20ターンの激戦の末、残HP率（${Math.round(
          (winnerUnit.hp / winnerUnit.maxHp) * 100
        )}% 対 ${Math.round((loserUnit.hp / loserUnit.maxHp) * 100)}%）で判定勝利。`;

  const highlightDesc =
    biggestSwingActorName === winnerUnit.fighter.name
      ? `決め手は第${decisiveTurn}ターンの${biggestSwingActionName}（最大${biggestSwingDamage}ダメージ）で主導権を握った点。`
      : `第${decisiveTurn}ターンに${loserUnit.fighter.name}の猛攻（${biggestSwingDamage}ダメージ）を受けたものの、${winnerEngineLabel}の持ち味を活かして押し返した。`;

  const summary = `${finishDesc}${highlightDesc}`;

  return {
    id: `res-${matchId}-${Date.now().toString(36)}`,
    matchId,
    fighterAId: fighterA.id,
    fighterBId: fighterB.id,
    fighterAName: fighterA.name,
    fighterBName: fighterB.name,
    winnerId: winnerUnit.fighter.id,
    loserId: loserUnit.fighter.id,
    winnerName: winnerUnit.fighter.name,
    loserName: loserUnit.fighter.name,
    totalTurns: finishedTurn,
    finishType,
    summary,
    decisiveTurn,
    ratingDeltaWinner: winnerDelta,
    ratingDeltaLoser: loserDelta,
    events,
    leftMaxHp: left.maxHp,
    rightMaxHp: right.maxHp,
    completedAt: new Date().toISOString(),
  };
}
