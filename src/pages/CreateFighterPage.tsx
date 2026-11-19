import { FormEvent, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Play,
  Sparkles,
  Swords,
  Ticket,
} from 'lucide-react';
import { SKILLS } from '../data/skills';
import { ENGINE_PROFILES, PERSONALITY_PROFILES } from '../engine/profiles';
import { CreateFighterInput } from '../storage/repository';
import {
  EngineType,
  FighterStats,
  PersonalityType,
} from '../types/arena';

interface CreateFighterPageProps {
  onCreateFighter: (input: CreateFighterInput) => {
    fighterName: string;
    matchId: string;
  };
  onGoHome: () => void;
  onGoBattle: (matchId: string) => void;
  onGoPredict: (matchId: string) => void;
}

const STAT_META: Array<{
  key: keyof FighterStats;
  label: string;
  desc: string;
}> = [
  { key: 'hp', label: 'HP（耐久）', desc: '最大HPに直結' },
  { key: 'attack', label: '攻撃', desc: '通常攻撃・攻撃スキルの威力' },
  { key: 'defense', label: '防御', desc: '被ダメージの軽減力' },
  { key: 'speed', label: '素早さ', desc: '毎ターンの先攻率' },
  { key: 'technique', label: 'テクニック', desc: 'クリティカル率とスキル精度' },
];

const STAT_PRESETS: Array<{ label: string; stats: FighterStats }> = [
  { label: 'バランス', stats: { hp: 20, attack: 20, defense: 20, speed: 20, technique: 20 } },
  { label: '火力特化', stats: { hp: 18, attack: 34, defense: 10, speed: 22, technique: 16 } },
  { label: '鉄壁耐久', stats: { hp: 30, attack: 12, defense: 32, speed: 10, technique: 16 } },
  { label: 'スピード技巧', stats: { hp: 16, attack: 20, defense: 12, speed: 28, technique: 24 } },
];

const TOTAL_STAT_BUDGET = 100;
const MIN_STAT = 5;
const MAX_STAT = 50;

/**
 * 画面2: ファイター作成画面
 */
export function CreateFighterPage({
  onCreateFighter,
  onGoHome,
  onGoBattle,
  onGoPredict,
}: CreateFighterPageProps) {
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<EngineType>('gemini');
  const [personality, setPersonality] = useState<PersonalityType>('aggressive');
  const [stats, setStats] = useState<FighterStats>({
    hp: 20,
    attack: 25,
    defense: 15,
    speed: 20,
    technique: 20,
  });
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([
    'overclock_slash',
    'burst_charge',
    'counter_stance',
  ]);
  const [instruction, setInstruction] = useState(
    '序盤から先手で主導権を握れ。相手が溜めたら防御で耐え、反撃のスキルで一気に決めろ。'
  );
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{
    fighterName: string;
    matchId: string;
  } | null>(null);

  const totalAllocated =
    stats.hp + stats.attack + stats.defense + stats.speed + stats.technique;
  const remainingPoints = TOTAL_STAT_BUDGET - totalAllocated;

  /** スライダー変更時、合計100ptを超えない範囲で更新 */
  const handleStatChange = (key: keyof FighterStats, nextValue: number) => {
    const clamped = Math.max(MIN_STAT, Math.min(MAX_STAT, nextValue));
    const otherSum = totalAllocated - stats[key];
    const maxAllowed = Math.min(MAX_STAT, TOTAL_STAT_BUDGET - otherSum);
    setStats((prev) => ({
      ...prev,
      [key]: Math.min(clamped, maxAllowed),
    }));
  };

  /** 残りポイントを均等に割り振る補助 */
  const handleAutoFillRemaining = () => {
    if (remainingPoints <= 0) return;
    const keys: Array<keyof FighterStats> = [
      'hp',
      'attack',
      'defense',
      'speed',
      'technique',
    ];
    const next = { ...stats };
    let rem = remainingPoints;
    let idx = 0;
    while (rem > 0 && idx < 100) {
      const k = keys[idx % keys.length];
      if (next[k] < MAX_STAT) {
        next[k] += 1;
        rem -= 1;
      }
      idx += 1;
    }
    setStats(next);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) => {
      if (prev.includes(skillId)) {
        return prev.filter((id) => id !== skillId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), skillId];
      }
      return [...prev, skillId];
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('ファイター名は2文字以上で入力してください。');
      return;
    }
    if (totalAllocated !== TOTAL_STAT_BUDGET) {
      setError(
        `ステータス配分の合計がちょうど ${TOTAL_STAT_BUDGET}pt になるよう調整してください（現在 ${totalAllocated}pt）。`
      );
      return;
    }
    if (selectedSkillIds.length !== 3) {
      setError('スキルは必ず3つ選択してください。');
      return;
    }

    const result = onCreateFighter({
      name: name.trim(),
      engine,
      personality,
      stats,
      skillIds: selectedSkillIds as [string, string, string],
      instruction: instruction.trim(),
    });

    setCreatedInfo(result);
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">
          AIファイター作成
        </h1>
        <p className="text-xs text-slate-400 sm:text-sm">
          エンジン傾向・性格・合計100ptのステータス・スキル3つ・育成者の指示文を設定すると、今日の対戦カードに自動で出場します。
        </p>
      </div>

      {/* 作成完了バナー */}
      {createdInfo && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-sm font-bold text-emerald-100">
                  「{createdInfo.fighterName}」を登録し、今日の対戦カード（注目第1試合）に反映しました！
                </p>
                <p className="text-xs text-emerald-200/80">
                  このまま無料予想を行うか、すぐに試合再生へ進めます。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onGoPredict(createdInfo.matchId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
              >
                <Ticket className="h-4 w-4" />
                この試合を予想する
              </button>
              <button
                type="button"
                onClick={() => onGoBattle(createdInfo.matchId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-400"
              >
                <Play className="h-4 w-4" />
                すぐ試合再生
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
              >
                <Swords className="h-4 w-4" />
                対戦カード一覧
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報：名前・エンジン・性格 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 space-y-5">
          <h2 className="text-base font-bold text-white">1. 基本設定</h2>

          <div>
            <label
              htmlFor="fighter-name"
              className="mb-1.5 block text-xs font-semibold text-slate-300"
            >
              ファイター名（2〜20文字）
            </label>
            <input
              id="fighter-name"
              type="text"
              maxLength={20}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ゼファー・ブレイド"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* エンジン選択 */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">
              エンジン選択（行動傾向シミュレーション）
            </span>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(['gemini', 'claude', 'chatgpt'] as EngineType[]).map((eng) => {
                const prof = ENGINE_PROFILES[eng];
                const selected = engine === eng;
                return (
                  <button
                    key={eng}
                    type="button"
                    onClick={() => setEngine(eng)}
                    aria-pressed={selected}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      selected
                        ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/50'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {prof.label}
                      </span>
                      {selected && <Check className="h-4 w-4 text-cyan-300" />}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      {prof.tendencySummary}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              ※ MVP版では外部APIを呼ばず、上記エンジン傾向パラメータに基づくシミュレーションで動作します。
            </p>
          </div>

          {/* 性格選択 */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-300">
              性格選択
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['aggressive', 'cautious', 'tricky'] as PersonalityType[]).map(
                (pers) => {
                  const prof = PERSONALITY_PROFILES[pers];
                  const selected = personality === pers;
                  return (
                    <button
                      key={pers}
                      type="button"
                      onClick={() => setPersonality(pers)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? 'border-indigo-400 bg-indigo-500/15 ring-1 ring-indigo-400/50'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {prof.label}
                        </span>
                        {selected && (
                          <Check className="h-4 w-4 text-indigo-300" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {prof.description}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ステータス配分（合計100pt） */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">
                2. ステータス配分（合計 100pt）
              </h2>
              <p className="text-xs text-slate-400">
                各項目 {MIN_STAT}〜{MAX_STAT}pt の範囲で配分してください。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-lg px-3 py-1 text-xs font-bold tabular-nums ${
                  remainingPoints === 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                残り {remainingPoints} pt（合計 {totalAllocated}/100）
              </span>
              {remainingPoints > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFillRemaining}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  残りを自動配分
                </button>
              )}
            </div>
          </div>

          {/* プリセットボタン */}
          <div className="flex flex-wrap gap-2">
            {STAT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setStats({ ...preset.stats })}
                className="rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200"
              >
                プリセット: {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-3.5">
            {STAT_META.map((item) => {
              const value = stats[item.key];
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <label
                      htmlFor={`stat-${item.key}`}
                      className="font-semibold text-slate-200"
                    >
                      {item.label}
                      <span className="ml-2 text-[11px] font-normal text-slate-400">
                        {item.desc}
                      </span>
                    </label>
                    <span className="font-extrabold tabular-nums text-cyan-300">
                      {value} pt
                    </span>
                  </div>
                  <input
                    id={`stat-${item.key}`}
                    type="range"
                    min={MIN_STAT}
                    max={MAX_STAT}
                    value={value}
                    onChange={(e) =>
                      handleStatChange(item.key, Number(e.target.value))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* スキル選択（3つ） */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">
                3. スキル選択（3つ選択）
              </h2>
              <p className="text-xs text-slate-400">
                4つ目を選ぶと最も古い選択が入れ替わります。
              </p>
            </div>
            <span
              className={`rounded-lg px-3 py-1 text-xs font-bold ${
                selectedSkillIds.length === 3
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              選択中 {selectedSkillIds.length} / 3
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id);
              const catLabel =
                skill.category === 'attack'
                  ? '攻撃'
                  : skill.category === 'defense'
                    ? '防御'
                    : skill.category === 'buff'
                      ? '強化'
                      : '特殊';
              const catClass =
                skill.category === 'attack'
                  ? 'bg-rose-500/15 text-rose-300'
                  : skill.category === 'defense'
                    ? 'bg-sky-500/15 text-sky-300'
                    : skill.category === 'buff'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-purple-500/15 text-purple-300';

              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  aria-pressed={isSelected}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">
                        {skill.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${catClass}`}
                      >
                        {catLabel}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      {skill.description}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>CT: {skill.cooldown}ターン</span>
                    {isSelected && (
                      <span className="font-bold text-cyan-300">選択中</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 育成者の指示文（最大500字） */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="fighter-instruction"
              className="text-base font-bold text-white"
            >
              4. 育成者の指示文（作戦プロンプト想定）
            </label>
            <span className="text-xs tabular-nums text-slate-400">
              {instruction.length} / 500字
            </span>
          </div>
          <textarea
            id="fighter-instruction"
            rows={4}
            maxLength={500}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例: 序盤から先手で全力攻撃を仕掛けろ。相手が溜めたら防御やカウンターで耐えろ。"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <p className="text-xs text-slate-400">
            ヒント: 「先手・全力・火力」「防御・耐える・回復・カウンター」「溜め・一撃・必殺」「トリッキー・攪乱・精密」などのキーワードが試合中の行動傾向に反映されます。
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm font-medium text-rose-200"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={remainingPoints !== 0 || selectedSkillIds.length !== 3}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            ファイターを作成して対戦カードへ登録
          </button>
        </div>
      </form>
    </div>
  );
}
