import { Link } from 'react-router-dom';
import { ClipboardCheck, Gift, Package, ArrowRight, Receipt } from 'lucide-react';
import { UserPointsCard } from './UserPointsCard';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRewards } from '@/hooks/useRewards';
import { cn } from '@/lib/utils';

export function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { redemptions } = useRewards();

  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="animate-slide-up stagger-1">
        <div className="card-gradient bg-gradient-to-r from-primary to-primary/80 p-5">
          <h2 className="text-xl font-bold">
            Olá, {profile?.full_name?.split(' ')[0] || 'Colaborador'}! 👋
          </h2>
          <p className="text-primary-foreground/70 text-xs mt-1">
            {userRank ? (
              <>Você está em <span className="font-bold text-primary-foreground">#{userRank}</span> no ranking!</>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { to: '/checklists', icon: ClipboardCheck, label: 'Checklists', sub: 'Ganhe pontos', bg: 'bg-success/10', color: 'text-success', idx: 3 },
          { to: '/cash-closing', icon: Receipt, label: 'Caixa', sub: 'Fechamento', bg: 'bg-primary/10', color: 'text-primary', idx: 4 },
          { to: '/rewards', icon: Gift, label: 'Recompensas', sub: 'Troque', bg: 'bg-amber-500/10', color: 'text-amber-500', idx: 5, badge: pendingRedemptions },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <div className={cn(
              "card-interactive p-4 flex flex-col items-center text-center h-full relative animate-slide-up",
              `stagger-${item.idx}`
            )}>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", item.bg)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <p className="font-semibold text-xs">{item.label}</p>
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
      <div className="animate-slide-up stagger-6">
        <Leaderboard 
          entries={leaderboard}
          currentUserId={user?.id}
          isLoading={leaderboardLoading}
        />
      </div>

      {/* Inventory Link */}
      <Link to="/inventory">
        <div className="card-interactive p-3.5 flex items-center justify-between animate-slide-up stagger-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Package className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">Estoque</p>
              <p className="text-[10px] text-muted-foreground">Ver itens e movimentações</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>
    </div>
  );
}
