import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { Leaderboard } from './Leaderboard';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { MedalWinners } from '@/components/profile/MedalWinners';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useLeaderboard, LeaderboardScope } from '@/hooks/useLeaderboard';
import { usePoints } from '@/hooks/usePoints';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useUserModules } from '@/hooks/useAccessLevels';
import { calculateMedals } from '@/lib/medals';
import { cn } from '@/lib/utils';
import { getModuleKeyFromRoute } from '@/lib/modules';

type TabKey = 'ranking' | 'elos' | 'medalhas';

function useGlobalMedals(unitId: string | null) {
  return useQuery({
    queryKey: ['global-medals', unitId],
    queryFn: async () => {
      const [{ data: empOfMonth }, { data: inventors }, { data: employees }] = await Promise.all([
        supabase.from('bonus_points').select('id').eq('badge_id', 'employee_of_month').eq('unit_id', unitId!).limit(1),
        supabase.from('bonus_points').select('id').eq('badge_id', 'inventor').eq('unit_id', unitId!).limit(1),
        supabase.from('employees').select('admission_date').eq('unit_id', unitId!).not('admission_date', 'is', null).limit(1000),
      ]);
      const admissionDates = (employees || []).map(e => e.admission_date).filter(Boolean) as string[];
      const earliest = admissionDates.length > 0 ? admissionDates.sort()[0] : null;
      return calculateMedals({
        hasEmployeeOfMonth: (empOfMonth || []).length > 0,
        admissionDate: earliest,
        hasInventedRecipe: (inventors || []).length > 0,
      });
    },
    enabled: !!unitId,
  });
}

const QUICK_LINKS = [
  { label: 'Checklists', icon: 'CheckSquare', path: '/checklists' },
  { label: 'Estoque', icon: 'Package', path: '/inventory' },
  { label: 'Pedidos', icon: 'ShoppingCart', path: '/orders' },
  { label: 'Recompensas', icon: 'Gift', path: '/rewards' },
  { label: 'Fechamento', icon: 'Receipt', path: '/cash-closing' },
];

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const { hasAccess } = useUserModules();
  const { earned, balance, monthlyScore, refetch: refetchPoints } = usePoints();
  const [rankingScope, setRankingScope] = useState<LeaderboardScope>('unit');
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth, refetch: refetchLeaderboard } = useLeaderboard(rankingScope);
  const { data: globalMedals } = useGlobalMedals(activeUnitId);
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');

  // Filter quick links by access level
  const visibleLinks = QUICK_LINKS.filter(link => {
    const moduleKey = getModuleKeyFromRoute(link.path);
    return moduleKey ? hasAccess(moduleKey) : true;
  });

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  const [syncing, setSyncing] = useState(false);
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await Promise.all([refetchLeaderboard(), refetchPoints()]);
    setSyncing(false);
    toast.success('Ranking atualizado!');
  }, [refetchPoints, refetchLeaderboard]);

  return (
    <div className="space-y-6 px-4 py-3 lg:px-6">
      {/* Welcome Header */}
      <div className="animate-spring-in spring-stagger-1">
        <div className="card-surface p-5" style={{ border: 'none' }}>
          <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
            Olá, {profile?.full_name?.split(' ')[0] || 'Colaborador'}!
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            {myPosition ? (
              <>Você está em <span className="font-bold text-primary">#{myPosition}</span> no ranking mensal</>
            ) : (
              'Complete tarefas para ganhar pontos'
            )}
          </p>
        </div>
      </div>

      {visibleLinks.length > 0 && (
        <div className="animate-spring-in spring-stagger-2">
          <div className={cn("grid gap-2", visibleLinks.length <= 4 ? `grid-cols-${visibleLinks.length}` : "grid-cols-5")}>
            {visibleLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name={link.icon} size={20} className="text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* My Rank Card */}
      <div className="animate-spring-in spring-stagger-3">
        <MyRankCard
          fullName={profile?.full_name || 'Usuário'}
          avatarUrl={profile?.avatar_url}
          earnedPoints={earned}
          monthlyScore={monthlyScore}
          accumulatedBalance={balance}
          leaderboardPosition={myPosition}
        />
      </div>

      {/* Tabs: Ranking / Elos / Medalhas */}
      <div className="animate-spring-in spring-stagger-3">
        <AnimatedTabs
          tabs={[
            { key: 'ranking', label: 'Ranking', icon: <AppIcon name="Trophy" size={14} /> },
            { key: 'elos', label: 'Elos', icon: <AppIcon name="Shield" size={14} /> },
            { key: 'medalhas', label: 'Medalhas', icon: <AppIcon name="Medal" size={14} /> },
          ]}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as TabKey)}
        />
      </div>

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'ranking' && (
          <div className="space-y-3">
            {/* Scope toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setRankingScope('unit')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  rankingScope === 'unit'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                <AppIcon name="Home" size={12} />
                {activeUnit?.name || 'Minha Unidade'}
              </button>
              <button
                onClick={() => setRankingScope('global')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  rankingScope === 'global'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
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
  );
}
