import { Link } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { UserPointsCard } from './UserPointsCard';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRewards } from '@/hooks/useRewards';
import { usePoints } from '@/hooks/usePoints';
import { getRank, getNextRank } from '@/lib/ranks';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { redemptions } = useRewards();
  const { earnedPoints } = usePoints();

  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;

  const currentRank = getRank(earnedPoints);
  const nextRank = getNextRank(earnedPoints);

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="animate-slide-up stagger-1">
        <div className="card-command p-5">
          <h2 className="text-xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] || 'Colaborador'}! 👋
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            {userRank ? (
              <>Você está em <span className="font-bold text-primary">#{userRank}</span> no ranking!</>
            ) : (
              'Complete tarefas para ganhar pontos'
            )}
          </p>
        </div>
      </div>

      {/* Points Card */}
      <div className="animate-slide-up stagger-2">
        <UserPointsCard />
      </div>

      {/* Next Rank Progress */}
      {nextRank && (
        <div className="animate-slide-up stagger-3">
          <div className="card-command p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: currentRank.color }}>
                  {currentRank.title}
                </span>
                <AppIcon name="ArrowRight" size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {nextRank.title}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Faltam {nextRank.pointsNeeded} pts
              </span>
            </div>
            <Progress
              value={nextRank.pointsNeeded > 0 ? Math.max(5, 100 - (nextRank.pointsNeeded / (nextRank.pointsNeeded + earnedPoints)) * 100) : 100}
              className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-[hsl(var(--neon-cyan))]"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { to: '/checklists', icon: 'ClipboardCheck', label: 'Checklists', sub: 'Ganhe pontos', bg: 'bg-success/10', color: 'text-success', borderClass: 'card-command-success', idx: 4 },
          { to: '/cash-closing', icon: 'Receipt', label: 'Caixa', sub: 'Fechamento', bg: 'bg-primary/10', color: 'text-primary', borderClass: 'card-command-info', idx: 5 },
          { to: '/rewards', icon: 'Gift', label: 'Recompensas', sub: 'Troque', bg: 'bg-warning/10', color: 'text-warning', borderClass: 'card-command-warning', idx: 6, badge: pendingRedemptions },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <div className={cn(
              item.borderClass,
              "p-4 flex flex-col items-center text-center h-full relative animate-slide-up cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all",
              `stagger-${item.idx}`
            )}>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", item.bg)}>
                <AppIcon name={item.icon} size={20} className={item.color} />
              </div>
              <p className="font-semibold text-xs text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="animate-slide-up stagger-7">
        <Leaderboard 
          entries={leaderboard}
          currentUserId={user?.id}
          isLoading={leaderboardLoading}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Inventory Link */}
      <Link to="/inventory">
        <div className="card-command-info p-3.5 flex items-center justify-between animate-slide-up stagger-8 cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <AppIcon name="Package" size={16} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Estoque</p>
              <p className="text-[10px] text-muted-foreground">Ver itens e movimentações</p>
            </div>
          </div>
          <AppIcon name="ArrowRight" size={16} className="text-muted-foreground" />
        </div>
      </Link>
    </div>
  );
}
