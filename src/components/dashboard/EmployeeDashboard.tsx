import { Link } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Gift, 
  Package,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { UserPointsCard } from './UserPointsCard';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRewards } from '@/hooks/useRewards';

export function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { redemptions } = useRewards();

  // Find current user's rank
  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card-gradient bg-gradient-to-r from-primary to-primary/80 p-6">
        <h2 className="text-2xl font-bold mb-1">
          Olá, {profile?.full_name?.split(' ')[0] || 'Colaborador'}! 👋
        </h2>
        <p className="text-primary-foreground/80">
          {userRank ? (
            <>Você está em <span className="font-bold">#{userRank}</span> no ranking!</>
          ) : (
            'Complete tarefas para ganhar pontos'
          )}
        </p>
      </div>

      {/* Points Card */}
      <UserPointsCard />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/checklists">
          <div className="card-interactive p-4 flex flex-col items-center text-center h-full">
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-2">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm">Checklists</p>
            <p className="text-xs text-muted-foreground">Ganhe pontos</p>
          </div>
        </Link>

        <Link to="/cash-closing">
          <div className="card-interactive p-4 flex flex-col items-center text-center h-full">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm">Caixa</p>
            <p className="text-xs text-muted-foreground">Fechamento</p>
          </div>
        </Link>

        <Link to="/rewards">
          <div className="card-interactive p-4 flex flex-col items-center text-center relative h-full">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
              <Gift className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm">Recompensas</p>
            <p className="text-xs text-muted-foreground">Troque</p>
            {pendingRedemptions > 0 && (
              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {pendingRedemptions}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Leaderboard */}
      <Leaderboard 
        entries={leaderboard}
        currentUserId={user?.id}
        isLoading={leaderboardLoading}
        maxEntries={10}
      />

      {/* Inventory Link */}
      <Link to="/inventory">
        <div className="card-interactive p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Estoque</p>
              <p className="text-xs text-muted-foreground">Ver itens e registrar movimentações</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Link>
    </div>
  );
}
