import { Link } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Gift, 
  Package,
  Star,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  // Find current user's rank
  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
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
      <div className="grid grid-cols-2 gap-4">
        <Link to="/checklists">
          <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-3">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <p className="font-semibold text-lg">Checklists</p>
              <p className="text-sm text-muted-foreground">Ganhe pontos</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/rewards">
          <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col items-center text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <Gift className="w-7 h-7" />
              </div>
              <p className="font-semibold text-lg">Recompensas</p>
              <p className="text-sm text-muted-foreground">Troque pontos</p>
              {pendingRedemptions > 0 && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {pendingRedemptions}
                </span>
              )}
            </CardContent>
          </Card>
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
      <Link to="/">
        <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
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
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
