import { ENGINE_PROFILES } from '../engine/profiles';
import { EngineType } from '../types/arena';

interface EngineBadgeProps {
  engine: EngineType;
  compact?: boolean;
}

/**
 * エンジンの事実表示バッジ（公式ロゴ・公式表現は使用しない）
 */
export function EngineBadge({ engine, compact = false }: EngineBadgeProps) {
  const profile = ENGINE_PROFILES[engine];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight ${profile.badgeClass}`}
    >
      {compact ? profile.shortLabel : profile.label}
    </span>
  );
}
