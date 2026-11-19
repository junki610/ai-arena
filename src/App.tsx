import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { BattlePage } from './pages/BattlePage';
import { CreateFighterPage } from './pages/CreateFighterPage';
import { HomePage } from './pages/HomePage';
import { PredictionPage } from './pages/PredictionPage';
import { ResultsPage } from './pages/ResultsPage';
import {
  arenaRepository,
  CreateFighterInput,
} from './storage/repository';
import { ArenaState, BattleResult, Bet, PageTab } from './types/arena';

/**
 * AI ARENA（仮称）ルートアプリケーション
 * 状態遷移ベースで5画面を切り替え、データ永続化は repository.ts（localStorage）に委譲する。
 */
export function App() {
  const [state, setState] = useState<ArenaState>(() =>
    arenaRepository.loadState()
  );
  const [activeTab, setActiveTab] = useState<PageTab>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [dailyBonusBanner, setDailyBonusBanner] = useState<string | null>(null);

  // 起動時に毎日ログインボーナス（+200pt）を日付判定で付与
  useEffect(() => {
    const bonus = arenaRepository.claimDailyLoginBonus();
    setState(bonus.state);
    if (bonus.awarded) {
      setDailyBonusBanner(
        `本日のログインボーナス +${bonus.amount}pt（無料ポイント）を受け取りました！`
      );
    }
  }, []);

  const handleOpenBattle = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('battle');
  }, []);

  const handleOpenPredict = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('predict');
  }, []);

  const handleCreateFighter = useCallback((input: CreateFighterInput) => {
    const res = arenaRepository.createFighterAndScheduleMatch(input);
    setState(res.state);
    setSelectedMatchId(res.match.id);
    return {
      fighterName: res.fighter.name,
      matchId: res.match.id,
    };
  }, []);

  const handlePlaceBet = useCallback(
    (params: {
      matchId: string;
      pickedFighterId: string;
      amount: number;
      oddsAtBet: number;
    }): { ok: true } | { ok: false; error: string } => {
      const res = arenaRepository.placeBet(params);
      if ('error' in res) {
        return { ok: false, error: res.error };
      }
      setState(res.state);
      return { ok: true };
    },
    []
  );

  const handleCompleteBattle = useCallback((result: BattleResult): Bet[] => {
    const { state: nextState, settledBets } =
      arenaRepository.recordBattleResult(result);
    setState(nextState);
    return settledBets;
  }, []);

  const handleRegenerateMatches = useCallback(() => {
    const nextState = arenaRepository.regenerateMatches();
    setState(nextState);
    setSelectedMatchId(nextState.matches[0]?.id ?? null);
  }, []);

  const handleResetDemoData = useCallback(() => {
    const confirmed = window.confirm(
      '保存されている戦績・自作ファイター・予想ポイントを初期状態に戻しますか？'
    );
    if (!confirmed) return;
    const fresh = arenaRepository.resetState();
    setState(fresh);
    setSelectedMatchId(null);
    setActiveTab('home');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userPoints={state.user.points}
        dailyBonusBanner={dailyBonusBanner}
        onDismissBanner={() => setDailyBonusBanner(null)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-6 sm:py-7">
        {activeTab === 'home' && (
          <HomePage
            state={state}
            onOpenBattle={handleOpenBattle}
            onOpenPredict={handleOpenPredict}
            onOpenCreate={() => setActiveTab('create')}
            onRegenerateMatches={handleRegenerateMatches}
          />
        )}

        {activeTab === 'create' && (
          <CreateFighterPage
            onCreateFighter={handleCreateFighter}
            onGoHome={() => setActiveTab('home')}
            onGoBattle={handleOpenBattle}
            onGoPredict={handleOpenPredict}
          />
        )}

        {activeTab === 'battle' && (
          <BattlePage
            state={state}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onCompleteBattle={handleCompleteBattle}
            onGoResults={() => setActiveTab('results')}
          />
        )}

        {activeTab === 'predict' && (
          <PredictionPage
            state={state}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onPlaceBet={handlePlaceBet}
            onOpenBattle={handleOpenBattle}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage state={state} onOpenBattle={handleOpenBattle} />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/90 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>
            AI ARENA（仮称）MVP — 無料ポイント専用（購入・換金・譲渡不可）。各エンジン表記は行動傾向シミュレーションの分類です。
          </p>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="text-slate-500 underline underline-offset-4 hover:text-slate-300"
          >
            ローカルデータを初期化
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
