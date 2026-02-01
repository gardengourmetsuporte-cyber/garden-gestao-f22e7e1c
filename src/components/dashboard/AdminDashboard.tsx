import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ClipboardCheck, 
  Gift, 
  Users, 
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  Star,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickStats, createAdminStats } from './QuickStats';
import { Leaderboard } from './Leaderboard';
import { SectorPointsSummary } from './SectorPointsSummary';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useOrders } from '@/hooks/useOrders';
import { useRewards } from '@/hooks/useRewards';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const { user } = useAuth();
  const { leaderboard, sectorPoints, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useLeaderboard();
  const { items, getLowStockItems, getOutOfStockItems } = useInventoryDB();
  const { orders } = useOrders();
  const { allRedemptions } = useRewards();
  const { users } = useUsers();

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();
  const pendingOrders = orders.filter(o => o.status === 'draft' || o.status === 'sent').length;
  const pendingRedemptions = allRedemptions.filter(r => r.status === 'pending').length;
  const totalPointsEarned = leaderboard.reduce((sum, e) => sum + e.earned_points, 0);

  const adminStats = createAdminStats({
    totalUsers: users.length,
    pendingOrders,
    pendingRedemptions,
    totalPoints: totalPointsEarned,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold mb-1">Painel Administrativo</h2>
        <p className="text-primary-foreground/80">
          Visão geral do sistema de gestão
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={adminStats} columns={4} />

      {/* Alerts Section */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0 || pendingRedemptions > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Ações Pendentes</p>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  {outOfStockItems.length > 0 && (
                    <p className="text-destructive">
                      • {outOfStockItems.length} item(ns) zerado(s) no estoque
                    </p>
                  )}
                  {lowStockItems.length > 0 && (
                    <p className="text-warning">
                      • {lowStockItems.length} item(ns) com estoque baixo
                    </p>
                  )}
                  {pendingRedemptions > 0 && (
                    <p className="text-primary">
                      • {pendingRedemptions} resgate(s) aguardando aprovação
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Leaderboard 
          entries={leaderboard} 
          currentUserId={user?.id}
          isLoading={leaderboardLoading}
          maxEntries={5}
        />

        {/* Sector Points */}
        <SectorPointsSummary 
          sectors={sectorPoints}
          isLoading={leaderboardLoading}
        />
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/">
          <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Package className="w-6 h-6" />
              </div>
              <p className="font-semibold">Estoque</p>
              <p className="text-xs text-muted-foreground">{items.length} itens</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/checklists">
          <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-3">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <p className="font-semibold">Checklists</p>
              <p className="text-xs text-muted-foreground">Tarefas diárias</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/rewards">
          <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <Gift className="w-6 h-6" />
              </div>
              <p className="font-semibold">Recompensas</p>
              <p className="text-xs text-muted-foreground">{pendingRedemptions} pendentes</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/settings">
          <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-semibold">Usuários</p>
              <p className="text-xs text-muted-foreground">{users.length} cadastrados</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
