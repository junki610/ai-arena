import { ENGINE_PROFILES } from '../engine/profiles';
import { Fighter } from '../types/arena';

interface FighterAvatarProps {
  fighter: Fighter;
  size?: 'sm' | 'md' | 'lg';
  animationClass?: string;
}

/**
 * ファイターの2D表現アバター（オリジナル幾何学デザイン・公式ロゴ不使用）
 */
export function FighterAvatar({
  fighter,
  size = 'md',
  animationClass = '',
}: FighterAvatarProps) {
  const profile = ENGINE_PROFILES[fighter.engine];
  const initial = fighter.name.trim().slice(0, 2) || 'AI';

  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10 text-xs rounded-xl'
      : size === 'lg'
        ? 'h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl rounded-2xl'
        : 'h-12 w-12 text-sm rounded-xl';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br ${profile.accentClass} font-black tracking-wider text-white shadow-lg ring-2 ring-white/15 ${sizeClass} ${animationClass}`}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-1 rounded-lg border border-white/20" />
      <span className="relative drop-shadow-sm">{initial}</span>
    </div>
  );
}
