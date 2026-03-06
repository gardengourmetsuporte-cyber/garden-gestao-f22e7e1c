import { useState, useEffect, useCallback } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { MedalWinners } from '@/components/profile/MedalWinners';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { usePoints } from '@/hooks/usePoints';
import { useLeaderboard, LeaderboardScope } from '@/hooks/useLeaderboard';
import { useGlobalMedals } from '@/hooks/useGlobalMedals';
import { cn } from '@/lib/utils';

type TabKey = 'ranking' | 'elos' | 'medalhas';

export default function Ranking() {
  const { user, profile } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const { earned, balance, monthlyScore, refetch: refetchPoints } = usePoints();
  const [rankingScope, setRankingScope] = useState<LeaderboardScope>('unit');
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth, refetch: refetchLeaderboard } = useLeaderboard(rankingScope);
  const { data: globalMedals } = useGlobalMedals(activeUnitId);
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');
  useScrollToTopOnChange(activeTab);
  const [mountRefreshed, setMountRefreshed] = useState(false);

  useEffect(() => {
    const forceRefresh = async () => {
      await Promise.all([refetchPoints(), refetchLeaderboard()]);
      setMountRefreshed(true);
    };
    forceRefresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  const [syncing, setSyncing] = useState(false);
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await refetchLeaderboard();
    await refetchPoints();
    setSyncing(false);
    toast.success('Ranking atualizado!');
  }, [refetchPoints, refetchLeaderboard]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <div className="px-4 py-3 lg:px-8 lg:max-w-6xl lg:mx-auto space-y-4">
          <MyRankCard
            fullName={profile?.full_name || 'Usuário'}
            avatarUrl={profile?.avatar_url}
            earnedPoints={earned}
            monthlyScore={monthlyScore}
            accumulatedBalance={balance}
            leaderboardPosition={myPosition}
          />

          <AnimatedTabs
            tabs={[
              { key: 'ranking', label: 'Ranking', icon: <AppIcon name="Trophy" size={14} /> },
              { key: 'elos', label: 'Elos', icon: <AppIcon name="Shield" size={14} /> },
              { key: 'medalhas', label: 'Medalhas', icon: <AppIcon name="Medal" size={14} /> },
            ]}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key as TabKey)}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'ranking' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRankingScope('unit')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      rankingScope === 'unit'
                        ? "text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                    style={rankingScope === 'unit' ? { background: 'linear-gradient(135deg, hsl(156 40% 12%), hsl(156 60% 22%), hsl(156 40% 14%))' } : undefined}
                  >
                    <AppIcon name="Home" size={12} />
                    {activeUnit?.name || 'Minha Unidade'}
                  </button>
                  <button
                    onClick={() => setRankingScope('global')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      rankingScope === 'global'
                        ? "text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                    style={rankingScope === 'global' ? { background: 'linear-gradient(135deg, hsl(156 40% 12%), hsl(156 60% 22%), hsl(156 40% 14%))' } : undefined}
                  >
                    <AppIcon name="Globe" size={12} />
                    Global
                  </button>
                </div>

                <Leaderboard
                  entries={leaderboard}
                  currentUserId={user?.id}
                  isLoading={isLoading}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onRefresh={handleSync}
                  isSyncing={syncing}
                  showUnitBadge={rankingScope === 'global'}
                />
              </div>
            )}
            {activeTab === 'elos' && <EloList earnedPoints={earned} />}
            {activeTab === 'medalhas' && globalMedals && (
              <>
                <MedalList medals={globalMedals} />
                <MedalWinners />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
