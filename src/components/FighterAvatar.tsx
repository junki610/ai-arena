import { useId } from 'react';
import { normalizeAppearance } from '../data/appearance';
import { Fighter, FighterAppearance } from '../types/arena';

interface FighterAvatarProps {
  /** ファイター本体（渡した場合は fighter.appearance を使用） */
  fighter?: Fighter;
  /** プレビュー等で直接 appearance を渡す場合 */
  appearance?: FighterAppearance;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 試合画面で向かい合わせる際の向き */
  facing?: 'right' | 'left';
  /** 外枠コンテナに付与するアニメーションクラス */
  animationClass?: string;
  /** 背景プレートを透過にするか（試合ステージ向け） */
  transparentBg?: boolean;
}

/**
 * ファイターのSVGアバター描画コンポーネント
 * body / mainColor / subColor / parts / eyes を組み合わせて描画する。
 */
export function FighterAvatar({
  fighter,
  appearance,
  size = 'md',
  facing = 'right',
  animationClass = '',
  transparentBg = false,
}: FighterAvatarProps) {
  const uid = useId().replace(/:/g, '');

  const resolved: FighterAppearance = appearance
    ? appearance
    : fighter
      ? normalizeAppearance(
          fighter.appearance,
          fighter.engine,
          fighter.personality
        )
      : {
          body: 'round',
          mainColor: '#3b82f6',
          subColor: '#06b6d4',
          parts: 'none',
          eyes: 'round',
        };

  const sizeClass =
    size === 'sm'
      ? 'h-10 w-10 rounded-xl'
      : size === 'xl'
        ? 'h-32 w-32 sm:h-36 sm:w-36 rounded-3xl'
        : size === 'lg'
          ? 'h-24 w-24 sm:h-28 sm:w-28 rounded-2xl'
          : 'h-12 w-12 rounded-xl';

  const bgClass = transparentBg
    ? 'bg-transparent'
    : 'bg-slate-900/90 ring-1 ring-white/15 shadow-md';

  const flipClass = facing === 'left' ? '-scale-x-100' : '';

  const gradId = `av-grad-${uid}`;
  const glowId = `av-glow-${uid}`;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-visible select-none ${sizeClass} ${bgClass} ${animationClass}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 120"
        className={`h-full w-full overflow-visible ${flipClass}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={resolved.mainColor} />
            <stop offset="100%" stopColor={resolved.subColor} />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={resolved.mainColor} stopOpacity="0.32" />
            <stop offset="100%" stopColor={resolved.mainColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 背面の淡いオーラ */}
        <circle cx="60" cy="64" r="48" fill={`url(#${glowId})`} />

        {/* 背面パーツ：翼 */}
        {resolved.parts === 'wing' && (
          <g>
            <path
              d="M32 62 C8 40, 4 64, 16 78 C22 84, 30 80, 35 74 Z"
              fill={resolved.subColor}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M28 54 C14 48, 13 61, 22 69"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.45"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M88 62 C112 40, 116 64, 104 78 C98 84, 90 80, 85 74 Z"
              fill={resolved.subColor}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M92 54 C106 48, 107 61, 98 69"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.45"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 上部パーツ：耳（ボディの後ろに少し重なる位置） */}
        {resolved.parts === 'ear' && (
          <g>
            <polygon
              points="30,44 22,16 48,32"
              fill={resolved.mainColor}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon points="31,40 27,23 43,33" fill={resolved.subColor} />
            <polygon
              points="90,44 98,16 72,32"
              fill={resolved.mainColor}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon points="89,40 93,23 77,33" fill={resolved.subColor} />
          </g>
        )}

        {/* 上部パーツ：角 */}
        {resolved.parts === 'horn' && (
          <g>
            <path
              d="M40 36 C32 22, 26 14, 34 10 C38 18, 44 24, 50 32 Z"
              fill={resolved.subColor}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M80 36 C88 22, 94 14, 86 10 C82 18, 76 24, 70 32 Z"
              fill={resolved.subColor}
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* 上部パーツ：アンテナ */}
        {resolved.parts === 'antenna' && (
          <g>
            <line
              x1="60"
              y1="32"
              x2="60"
              y2="14"
              stroke="#cbd5e1"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle
              cx="60"
              cy="12"
              r="6"
              fill={resolved.subColor}
              stroke="#0f172a"
              strokeWidth="2"
            />
            <circle cx="58" cy="10" r="2" fill="#ffffff" fillOpacity="0.8" />
          </g>
        )}

        {/* ボディ本体 */}
        {resolved.body === 'round' && (
          <g>
            <circle
              cx="60"
              cy="64"
              r="34"
              fill={`url(#${gradId})`}
              stroke="#0f172a"
              strokeWidth="3"
            />
            {/* お腹のアクセント */}
            <ellipse
              cx="60"
              cy="79"
              rx="18"
              ry="11"
              fill="#ffffff"
              fillOpacity="0.18"
            />
            {/* 上部の光沢 */}
            <ellipse
              cx="47"
              cy="44"
              rx="10"
              ry="5"
              transform="rotate(-24 47 44)"
              fill="#ffffff"
              fillOpacity="0.32"
            />
          </g>
        )}

        {resolved.body === 'robo' && (
          <g>
            <rect
              x="26"
              y="32"
              width="68"
              height="64"
              rx="14"
              fill={`url(#${gradId})`}
              stroke="#0f172a"
              strokeWidth="3"
            />
            {/* バイザー枠 */}
            <rect
              x="34"
              y="46"
              width="52"
              height="24"
              rx="8"
              fill="#0f172a"
              fillOpacity="0.35"
            />
            {/* 胸部コア */}
            <rect
              x="46"
              y="77"
              width="28"
              height="10"
              rx="5"
              fill={resolved.subColor}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* サイドボルト */}
            <circle cx="24" cy="64" r="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <circle cx="96" cy="64" r="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
          </g>
        )}

        {resolved.body === 'slime' && (
          <g>
            <path
              d="M60 28 C76 28, 92 48, 96 70 C99 88, 84 96, 60 96 C36 96, 21 88, 24 70 C28 48, 44 28, 60 28 Z"
              fill={`url(#${gradId})`}
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* ぷるっとしたハイライト */}
            <ellipse
              cx="46"
              cy="46"
              rx="7"
              ry="12"
              transform="rotate(20 46 46)"
              fill="#ffffff"
              fillOpacity="0.38"
            />
            <circle cx="38" cy="60" r="3" fill="#ffffff" fillOpacity="0.38" />
          </g>
        )}

        {resolved.body === 'spiky' && (
          <g>
            <polygon
              points="60,24 70,38 88,30 84,49 101,58 86,70 95,88 76,84 68,100 60,88 52,100 44,84 25,88 34,70 19,58 36,49 32,30 50,38"
              fill={`url(#${gradId})`}
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle
              cx="60"
              cy="63"
              r="22"
              fill="#ffffff"
              fillOpacity="0.12"
            />
          </g>
        )}

        {/* 上部パーツ：天使の輪（ボディ手前に浮かぶ） */}
        {resolved.parts === 'halo' && (
          <g>
            <ellipse
              cx="60"
              cy="17"
              rx="22"
              ry="6"
              fill="none"
              stroke={resolved.subColor}
              strokeWidth="4.5"
            />
            <ellipse
              cx="60"
              cy="17"
              rx="22"
              ry="6"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1.8"
              strokeOpacity="0.85"
            />
          </g>
        )}

        {/* 目（4タイプ） */}
        {resolved.eyes === 'round' && (
          <g>
            <circle cx="47" cy="59" r="6.5" fill="#0f172a" />
            <circle cx="49" cy="56.5" r="2.3" fill="#ffffff" />
            <circle cx="45" cy="61.5" r="1.1" fill="#ffffff" />
            <circle cx="73" cy="59" r="6.5" fill="#0f172a" />
            <circle cx="75" cy="56.5" r="2.3" fill="#ffffff" />
            <circle cx="71" cy="61.5" r="1.1" fill="#ffffff" />
          </g>
        )}

        {resolved.eyes === 'sharp' && (
          <g>
            <polygon
              points="38,54 55,58 51,64 40,62"
              fill="#0f172a"
            />
            <polygon points="44,57 52,59 49,62 43,61" fill="#fef08a" />
            <polygon
              points="82,54 65,58 69,64 80,62"
              fill="#0f172a"
            />
            <polygon points="76,57 68,59 71,62 77,61" fill="#fef08a" />
          </g>
        )}

        {resolved.eyes === 'happy' && (
          <g
            fill="none"
            stroke="#0f172a"
            strokeWidth="3.8"
            strokeLinecap="round"
          >
            <path d="M40 61 Q47 52 54 61" />
            <path d="M66 61 Q73 52 80 61" />
          </g>
        )}

        {resolved.eyes === 'star' && (
          <g>
            <polygon
              points="47,50 49.5,56.5 56,59 49.5,61.5 47,68 44.5,61.5 38,59 44.5,56.5"
              fill="#fef08a"
              stroke="#0f172a"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <polygon
              points="73,50 75.5,56.5 82,59 75.5,61.5 73,68 70.5,61.5 64,59 70.5,56.5"
              fill="#fef08a"
              stroke="#0f172a"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
