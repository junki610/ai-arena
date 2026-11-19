import { BattleActionType } from '../types/arena';

/** バトル演出エフェクトの7系統 */
export type BattleEffectType =
  | 'fire'
  | 'thunder'
  | 'ice'
  | 'poison'
  | 'slash'
  | 'shield'
  | 'shockwave';

/**
 * 行動種別およびスキルIDからエフェクト系統と表示位置（攻撃対象側 or 行動者側）を決定する
 */
export function resolveBattleEffect(
  action: BattleActionType,
  skillId?: string
): { effect: BattleEffectType; anchor: 'target' | 'actor' } {
  if (action === 'defend') {
    return { effect: 'shield', anchor: 'actor' };
  }
  if (action === 'charge') {
    return { effect: 'thunder', anchor: 'actor' };
  }
  if (action === 'attack') {
    return { effect: 'slash', anchor: 'target' };
  }

  switch (skillId) {
    case 'risk_dive':
      return { effect: 'fire', anchor: 'target' };
    case 'tempo_shift':
      return { effect: 'thunder', anchor: 'target' };
    case 'burst_charge':
      return { effect: 'thunder', anchor: 'actor' };
    case 'logic_break':
    case 'precision_scan':
      return { effect: 'ice', anchor: 'target' };
    case 'data_drain':
    case 'jamming_noise':
      return { effect: 'poison', anchor: 'target' };
    case 'overclock_slash':
      return { effect: 'slash', anchor: 'target' };
    case 'iron_wall':
    case 'repair_protocol':
    case 'counter_stance':
      return { effect: 'shield', anchor: 'actor' };
    case 'apex_beam':
      return { effect: 'shockwave', anchor: 'target' };
    default:
      return { effect: 'shockwave', anchor: 'target' };
  }
}

interface BattleEffectOverlayProps {
  effect: BattleEffectType;
}

/**
 * 系統別（炎・雷・氷・毒・斬撃・シールド・衝撃波）のSVGバトルエフェクト
 */
export function BattleEffectOverlay({ effect }: BattleEffectOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute -inset-4 z-20 flex items-center justify-center animate-fx-burst"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 炎：紅蓮と橙の爆炎 */}
        {effect === 'fire' && (
          <g>
            <path
              d="M60 10 C75 34, 102 44, 94 74 C88 98, 72 108, 60 108 C46 108, 28 96, 26 72 C24 48, 44 34, 60 10 Z"
              fill="#f97316"
              fillOpacity="0.72"
            />
            <path
              d="M60 28 C72 48, 86 58, 80 78 C75 94, 66 98, 60 98 C52 98, 42 90, 40 76 C38 60, 50 48, 60 28 Z"
              fill="#fde047"
              fillOpacity="0.88"
            />
            <circle cx="30" cy="34" r="4" fill="#fb923c" />
            <circle cx="94" cy="40" r="3.5" fill="#fde047" />
          </g>
        )}

        {/* 雷：鋭い電撃ジグザグ */}
        {effect === 'thunder' && (
          <g>
            <polygon
              points="72,6 38,56 58,56 44,114 86,58 64,58"
              fill="#facc15"
              stroke="#fef9c3"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M22 36 L34 44 M96 32 L84 44 M24 84 L38 76 M96 86 L82 76"
              stroke="#fef08a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 氷：結晶スパイク */}
        {effect === 'ice' && (
          <g>
            <polygon
              points="60,8 70,42 106,36 78,60 104,88 68,78 60,112 52,78 16,88 42,60 14,36 50,42"
              fill="#38bdf8"
              fillOpacity="0.68"
              stroke="#e0f2fe"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="60" r="14" fill="#ffffff" fillOpacity="0.7" />
          </g>
        )}

        {/* 毒：紫とライムの渦・バブル */}
        {effect === 'poison' && (
          <g>
            <circle
              cx="60"
              cy="60"
              r="38"
              fill="none"
              stroke="#a855f7"
              strokeWidth="6"
              strokeDasharray="16 10"
            />
            <circle cx="36" cy="42" r="10" fill="#c084fc" fillOpacity="0.75" />
            <circle cx="84" cy="46" r="8" fill="#84cc16" fillOpacity="0.8" />
            <circle cx="68" cy="84" r="11" fill="#a855f7" fillOpacity="0.72" />
            <circle cx="42" cy="80" r="6" fill="#a3e635" fillOpacity="0.85" />
          </g>
        )}

        {/* 斬撃：クロス閃光ライン */}
        {effect === 'slash' && (
          <g>
            <path
              d="M16 20 Q60 54 106 100 Q62 66 16 20 Z"
              fill="#ffffff"
              stroke="#38bdf8"
              strokeWidth="3"
            />
            <path
              d="M104 22 Q58 56 16 98 Q60 66 104 22 Z"
              fill="#f8fafc"
              stroke="#f43f5e"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* シールド：六角形バリア */}
        {effect === 'shield' && (
          <g>
            <polygon
              points="60,10 104,35 104,85 60,110 16,85 16,35"
              fill="#38bdf8"
              fillOpacity="0.22"
              stroke="#7dd3fc"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <polygon
              points="60,24 91,42 91,78 60,96 29,78 29,42"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
          </g>
        )}

        {/* 衝撃波：同心円＋放射エネルギー */}
        {effect === 'shockwave' && (
          <g>
            <circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="#818cf8"
              strokeWidth="5"
              strokeOpacity="0.85"
            />
            <circle
              cx="60"
              cy="60"
              r="30"
              fill="#6366f1"
              fillOpacity="0.28"
              stroke="#c7d2fe"
              strokeWidth="3.5"
            />
            <circle cx="60" cy="60" r="12" fill="#ffffff" fillOpacity="0.85" />
          </g>
        )}
      </svg>
    </div>
  );
}
