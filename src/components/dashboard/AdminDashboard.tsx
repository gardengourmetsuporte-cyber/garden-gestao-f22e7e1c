import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ClipboardCheck, 
  Gift, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  Settings,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useOrders } from '@/hooks/useOrders';
import { useRewards } from '@/hooks/useRewards';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
 import { useCashClosing } from '@/hooks/useCashClosing';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  onClick: () => void;
  gradient: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, onClick, gradient, subtitle }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-gradient group cursor-pointer",
        gradient
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface QuickAccessCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick: () => void;
  iconBg: string;
  iconColor: string;
}

function QuickAccessCard({ title, subtitle, icon: Icon, onClick, iconBg, iconColor }: QuickAccessCardProps) {
  return (
    <div
      onClick={onClick}
      className="card-interactive p-4 flex flex-col items-center text-center group"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", iconBg)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <ArrowUpRight className="w-4 h-4 mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface AlertItemProps {
  message: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
  onClick: () => void;
}

function AlertItem({ message, count, severity, onClick }: AlertItemProps) {
  const severityStyles = {
    error: 'text-destructive bg-destructive/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-primary bg-primary/10',
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className={cn("w-4 h-4", severity === 'error' ? 'text-destructive' : severity === 'warning' ? 'text-warning' : 'text-primary')} />
        <span className="text-sm text-foreground">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", severityStyles[severity])}>{count}</span>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { items, getLowStockItems, getOutOfStockItems } = useInventoryDB();
  const { orders } = useOrders();
  const { allRedemptions } = useRewards();
  const { users } = useUsers();
  const { closings } = useCashClosing();

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();
  const criticalItems = lowStockItems.length + outOfStockItems.length;
  const pendingOrders = orders.filter(o => o.status === 'draft' || o.status === 'sent').length;
  const pendingRedemptions = allRedemptions.filter(r => r.status === 'pending').length;
  const pendingClosings = closings.filter(c => c.status === 'pending').length;

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const hasAlerts = outOfStockItems.length > 0 || lowStockItems.length > 0 || pendingRedemptions > 0 || pendingClosings > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card-gradient bg-gradient-to-br from-primary via-primary to-primary/80 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Painel Administrativo</h2>
            <p className="text-primary-foreground/80">
              Visão geral do sistema de gestão
            </p>
          </div>
          <p className="text-sm text-primary-foreground/70 capitalize">{currentDate}</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Usuários Ativos"
          value={users.length}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => navigate('/settings', { state: { activeTab: 'users' } })}
          subtitle="cadastrados"
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={pendingOrders}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-orange-500 to-amber-500"
          onClick={() => navigate('/inventory', { state: { activeTab: 'orders' } })}
          subtitle={pendingOrders > 0 ? 'aguardando' : 'nenhum'}
        />
        <MetricCard
          title="Resgates Pendentes"
          value={pendingRedemptions}
          icon={Gift}
          gradient="bg-gradient-to-br from-amber-400 to-yellow-500"
          onClick={() => navigate('/rewards')}
          subtitle={pendingRedemptions > 0 ? 'para aprovar' : 'nenhum'}
        />
        <MetricCard
          title="Estoque Crítico"
          value={criticalItems}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          onClick={() => navigate('/inventory', { state: { stockFilter: 'critical' } })}
          subtitle={criticalItems > 0 ? 'itens em alerta' : 'tudo ok'}
        />
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="alert-card alert-warning">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-foreground">Ações Pendentes</h3>
            </div>
            <div className="space-y-1">
              {outOfStockItems.length > 0 && (
                <AlertItem
                  message="Itens zerados no estoque"
                  count={outOfStockItems.length}
                  severity="error"
                  onClick={() => navigate('/inventory', { state: { stockFilter: 'zero' } })}
                />
              )}
              {lowStockItems.length > 0 && (
                <AlertItem
                  message="Itens com estoque baixo"
                  count={lowStockItems.length}
                  severity="warning"
                  onClick={() => navigate('/inventory', { state: { stockFilter: 'low' } })}
                />
              )}
              {pendingRedemptions > 0 && (
                <AlertItem
                  message="Resgates aguardando aprovação"
                  count={pendingRedemptions}
                  severity="info"
                  onClick={() => navigate('/rewards')}
                />
              )}
              {pendingClosings > 0 && (
                <AlertItem
                  message="Fechamentos aguardando validação"
                  count={pendingClosings}
                  severity="warning"
                  onClick={() => navigate('/cash-closing')}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div>
        <h3 className="section-label mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <QuickAccessCard
            title="Estoque"
            subtitle={`${items.length} itens cadastrados`}
            icon={Package}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            onClick={() => navigate('/inventory')}
          />
          <QuickAccessCard
            title="Checklists"
            subtitle="Tarefas diárias"
            icon={ClipboardCheck}
            iconBg="bg-success/10"
            iconColor="text-success"
            onClick={() => navigate('/checklists')}
          />
          <QuickAccessCard
            title="Fechamento"
            subtitle={pendingClosings > 0 ? `${pendingClosings} pendentes` : 'Validar caixas'}
            icon={Receipt}
            iconBg="bg-cyan-500/10"
            iconColor="text-cyan-600"
            onClick={() => navigate('/cash-closing')}
          />
          <QuickAccessCard
            title="Recompensas"
            subtitle={pendingRedemptions > 0 ? `${pendingRedemptions} pendentes` : 'Gerenciar prêmios'}
            icon={Gift}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
            onClick={() => navigate('/rewards')}
          />
          <QuickAccessCard
            title="Configurações"
            subtitle={`${users.length} usuários`}
            icon={Settings}
            iconBg="bg-secondary"
            iconColor="text-secondary-foreground"
            onClick={() => navigate('/settings')}
          />
        </div>
      </div>

      {/* Leaderboard */}
      <Leaderboard 
        entries={leaderboard} 
        currentUserId={user?.id}
        isLoading={leaderboardLoading}
        maxEntries={5}
      />
    </div>
  );
}
