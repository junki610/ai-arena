import {
  AvatarBodyType,
  AvatarEyesType,
  AvatarPartsType,
  EngineType,
  FighterAppearance,
  PersonalityType,
} from '../types/arena';

/** アバター用10色パレット */
export interface AvatarColorOption {
  id: string;
  label: string;
  hex: string;
}

export const AVATAR_COLORS: AvatarColorOption[] = [
  { id: 'crimson', label: 'クリムゾン', hex: '#ef4444' },
  { id: 'amber', label: 'アンバー', hex: '#f59e0b' },
  { id: 'gold', label: 'ゴールド', hex: '#eab308' },
  { id: 'emerald', label: 'エメラルド', hex: '#10b981' },
  { id: 'cyan', label: 'シアン', hex: '#06b6d4' },
  { id: 'azure', label: 'アジュール', hex: '#3b82f6' },
  { id: 'indigo', label: 'インディゴ', hex: '#6366f1' },
  { id: 'violet', label: 'バイオレット', hex: '#a855f7' },
  { id: 'rose', label: 'ローズピンク', hex: '#ec4899' },
  { id: 'slate', label: 'メタルグレー', hex: '#64748b' },
];

export const AVATAR_BODIES: Array<{ id: AvatarBodyType; label: string }> = [
  { id: 'round', label: 'まる型' },
  { id: 'robo', label: 'ロボ型' },
  { id: 'slime', label: 'スライム型' },
  { id: 'spiky', label: 'トゲ型' },
];

export const AVATAR_PARTS: Array<{ id: AvatarPartsType; label: string }> = [
  { id: 'horn', label: '角' },
  { id: 'wing', label: '翼' },
  { id: 'antenna', label: 'アンテナ' },
  { id: 'ear', label: '耳' },
  { id: 'halo', label: '天使の輪' },
  { id: 'none', label: 'なし' },
];

export const AVATAR_EYES: Array<{ id: AvatarEyesType; label: string }> = [
  { id: 'round', label: 'まる目' },
  { id: 'sharp', label: '鋭い目' },
  { id: 'happy', label: 'にっこり目' },
  { id: 'star', label: 'スター目' },
];

/** エンジンごとの推奨カラー（メイン・サブ） */
export function getEngineSuggestedColors(engine: EngineType): {
  mainColor: string;
  subColor: string;
} {
  switch (engine) {
    case 'gemini':
      return { mainColor: '#3b82f6', subColor: '#06b6d4' };
    case 'claude':
      return { mainColor: '#f59e0b', subColor: '#eab308' };
    case 'chatgpt':
      return { mainColor: '#10b981', subColor: '#06b6d4' };
  }
}

/** 性格ごとの推奨パーツ構成（body / parts / eyes） */
export function getPersonalitySuggestedShape(personality: PersonalityType): {
  body: AvatarBodyType;
  parts: AvatarPartsType;
  eyes: AvatarEyesType;
} {
  switch (personality) {
    case 'aggressive':
      return { body: 'spiky', parts: 'horn', eyes: 'sharp' };
    case 'cautious':
      return { body: 'robo', parts: 'antenna', eyes: 'round' };
    case 'tricky':
      return { body: 'slime', parts: 'wing', eyes: 'star' };
  }
}

/** エンジンと性格から初期候補の appearance を生成 */
export function getSuggestedAppearance(
  engine: EngineType,
  personality: PersonalityType
): FighterAppearance {
  return {
    ...getEngineSuggestedColors(engine),
    ...getPersonalitySuggestedShape(personality),
  };
}

const VALID_BODIES = new Set<string>(AVATAR_BODIES.map((b) => b.id));
const VALID_PARTS = new Set<string>(AVATAR_PARTS.map((p) => p.id));
const VALID_EYES = new Set<string>(AVATAR_EYES.map((e) => e.id));

/**
 * 既存 localStorage データに appearance が無い／不完全な場合にデフォルト補完する
 */
export function normalizeAppearance(
  raw: Partial<FighterAppearance> | undefined,
  engine: EngineType,
  personality: PersonalityType
): FighterAppearance {
  const fallback = getSuggestedAppearance(engine, personality);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  return {
    body: VALID_BODIES.has(String(raw.body))
      ? (raw.body as AvatarBodyType)
      : fallback.body,
    mainColor:
      typeof raw.mainColor === 'string' && raw.mainColor.startsWith('#')
        ? raw.mainColor
        : fallback.mainColor,
    subColor:
      typeof raw.subColor === 'string' && raw.subColor.startsWith('#')
        ? raw.subColor
        : fallback.subColor,
    parts: VALID_PARTS.has(String(raw.parts))
      ? (raw.parts as AvatarPartsType)
      : fallback.parts,
    eyes: VALID_EYES.has(String(raw.eyes))
      ? (raw.eyes as AvatarEyesType)
      : fallback.eyes,
  };
}
