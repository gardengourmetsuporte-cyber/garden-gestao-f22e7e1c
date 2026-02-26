import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { Leaderboard } from './Leaderboard';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank, getNextRank } from '@/lib/ranks';
import { formatPoints } from '@/lib/points';
import { Progress } from '@/components/ui/progress';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { MedalWinners } from '@/components/profile/MedalWinners';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useLeaderboard, LeaderboardScope } from '@/hooks/useLeaderboard';
import { usePoints } from '@/hooks/usePoints';
import { useCountUp } from '@/hooks/useCountUp';
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const QUICK_LINKS = [
  { label: 'Checklists', icon: 'CheckSquare', path: '/checklists', color: 'hsl(var(--neon-amber))' },
  { label: 'Estoque', icon: 'Package', path: '/inventory', color: 'hsl(var(--neon-green))' },
  { label: 'Pedidos', icon: 'ShoppingCart', path: '/orders', color: 'hsl(var(--neon-cyan))' },
  { label: 'Recompensas', icon: 'Gift', path: '/rewards', color: 'hsl(var(--neon-red))' },
  { label: 'Fechamento', icon: 'Receipt', path: '/cash-closing', color: 'hsl(var(--neon-purple))' },
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

  const rank = getRank(earned);
  const next = getNextRank(earned);
  const animatedMonthly = useCountUp(monthlyScore);
  const animatedBalance = useCountUp(balance);

  const visibleLinks = QUICK_LINKS.filter(link => {
    const moduleKey = getModuleKeyFromRoute(link.path);
    return moduleKey ? hasAccess(moduleKey) : true;
  });

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const firstName = profile?.full_name?.split(' ')[0] || 'Colaborador';

  const [syncing, setSyncing] = useState(false);
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await Promise.all([refetchLeaderboard(), refetchPoints()]);
    setSyncing(false);
    toast.success('Ranking atualizado!');
  }, [refetchPoints, refetchLeaderboard]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4 px-4 py-3 lg:px-6">
      {/* Hero Card with gradient */}
      <div className="animate-spring-in spring-stagger-1">
        <div className="gradient-primary rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs opacity-70 capitalize">{formattedDate}</p>
              <h2 className="text-lg font-extrabold font-display mt-1" style={{ letterSpacing: '-0.03em' }}>
                {getGreeting()}, {firstName}!
              </h2>
              {myPosition && (
                <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <AppIcon name="TrendingUp" size={12} />
                  <span className="text-[10px] font-bold">#{myPosition} no ranking</span>
                </div>
              )}
            </div>
            <RankedAvatar
              avatarUrl={profile?.avatar_url}
              earnedPoints={earned}
              size={56}
              userName={profile?.full_name || ''}
              userId={user?.id}
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AppIcon name="Flame" size={14} />
              </div>
              <p className="text-lg font-black leading-none">{animatedMonthly}</p>
              <p className="text-[9px] opacity-60 mt-0.5">pts/mês</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AppIcon name="Wallet" size={14} />
              </div>
              <p className="text-lg font-black leading-none">{animatedBalance}</p>
              <p className="text-[9px] opacity-60 mt-0.5">saldo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AppIcon name="Star" size={14} />
              </div>
              <p className="text-lg font-black leading-none">{formatPoints(earned)}</p>
              <p className="text-[9px] opacity-60 mt-0.5">total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Elo progress bar */}
      {next && (
        <div className="animate-spring-in spring-stagger-2 card-surface p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold" style={{ color: rank.color }}>{rank.title}</span>
            <div className="flex-1">
              <Progress
                value={100 - (next.pointsNeeded / (earned + next.pointsNeeded)) * 100}
                className="h-2"
              />
            </div>
            <span className="text-xs text-muted-foreground">{next.title}</span>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-1.5">
            Faltam <span className="font-semibold text-foreground">{formatPoints(next.pointsNeeded)}</span> pts para {next.title}
          </p>
        </div>
      )}

      {/* Quick Links */}
      {visibleLinks.length > 0 && (
        <div className="animate-spring-in spring-stagger-2">
          <div className={cn("grid gap-2", visibleLinks.length <= 4 ? `grid-cols-${visibleLinks.length}` : "grid-cols-5")}>
            {visibleLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <AppIcon name={link.icon} size={18} fill={1} style={{ color: link.color }} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
