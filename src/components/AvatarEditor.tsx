import {
  AVATAR_BODIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_PARTS,
} from '../data/appearance';
import { FighterAppearance } from '../types/arena';
import { FighterAvatar } from './FighterAvatar';

interface AvatarEditorProps {
  value: FighterAppearance;
  onChange: (next: FighterAppearance) => void;
  isAutoSynced: boolean;
}

/**
 * ファイター作成画面用のアバターエディタ
 * body / mainColor / subColor / parts / eyes とリアルタイムSVGプレビューを提供する。
 */
export function AvatarEditor({
  value,
  onChange,
  isAutoSynced,
}: AvatarEditorProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
      {/* リアルタイムSVGプレビュー */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5">
        <FighterAvatar
          appearance={value}
          size="xl"
          transparentBg
          animationClass="animate-idle-float"
        />
        <span className="mt-3 text-xs font-bold text-slate-300">
          リアルタイムプレビュー
        </span>
        <span className="mt-1 text-[11px] text-slate-500">
          {isAutoSynced
            ? 'エンジン・性格と自動連動中'
            : 'カスタム編集済み（自動上書きOFF）'}
        </span>
      </div>

      {/* 各パーツ・カラー選択UI */}
      <div className="space-y-4">
        {/* ボディ形状 */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-300">
            ボディ形状
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AVATAR_BODIES.map((item) => {
              const selected = value.body === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...value, body: item.id })}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    selected
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* メインカラー（10色） */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-300">
            メインカラー（10色）
          </span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => {
              const selected = value.mainColor === color.hex;
              return (
                <button
                  key={`main-${color.id}`}
                  type="button"
                  title={color.label}
                  aria-label={`メインカラー: ${color.label}`}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...value, mainColor: color.hex })}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    selected
                      ? 'scale-110 border-white ring-2 ring-cyan-400'
                      : 'border-slate-800 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
          </div>
        </div>

        {/* サブカラー（10色） */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-300">
            サブカラー（10色）
          </span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => {
              const selected = value.subColor === color.hex;
              return (
                <button
                  key={`sub-${color.id}`}
                  type="button"
                  title={color.label}
                  aria-label={`サブカラー: ${color.label}`}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...value, subColor: color.hex })}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    selected
                      ? 'scale-110 border-white ring-2 ring-amber-400'
                      : 'border-slate-800 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
          </div>
        </div>

        {/* パーツ（6種） */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-300">
            パーツ
          </span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {AVATAR_PARTS.map((item) => {
              const selected = value.parts === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...value, parts: item.id })}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    selected
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 目（4種） */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-300">
            目のタイプ
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AVATAR_EYES.map((item) => {
              const selected = value.eyes === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...value, eyes: item.id })}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    selected
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
