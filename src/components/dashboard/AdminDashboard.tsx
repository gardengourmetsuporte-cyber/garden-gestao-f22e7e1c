import { useNavigate } from 'react-router-dom';
import { 
  Package, ClipboardCheck, Gift, AlertTriangle, ArrowUpRight, ShoppingCart,
  Settings, AlertCircle, Receipt, Wallet, ChefHat, CalendarDays
} from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useCountUp, useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  onClick: () => void;
  variant: string;
  subtitle?: string;
  index: number;
  isLoading?: boolean;
}

function MetricCard({ title, value, icon: Icon, onClick, variant, subtitle, index, isLoading }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "stat-command group cursor-pointer animate-slide-up p-4",
        variant,
        `stagger-${index + 1}`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border/30">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-active:opacity-100 transition-opacity" />
      </div>
      <div className="mt-3">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">{title}</p>
            {subtitle && <p className="text-muted-foreground/60 text-[10px] mt-0.5">{subtitle}</p>}
          </>
        )}
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
  index: number;
}

function QuickAccessCard({ title, subtitle, icon: Icon, onClick, iconBg, iconColor, index }: QuickAccessCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-command-info p-4 flex flex-col items-center text-center animate-slide-up cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all",
        `stagger-${index + 1}`
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", iconBg)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <p className="font-semibold text-sm text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
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

  const borderColor = {
    error: 'border-l-destructive/50',
    warning: 'border-l-warning/50',
    info: 'border-l-primary/50',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors active:scale-[0.98] group border-l-2",
        borderColor[severity]
      )}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className={cn("w-4 h-4", severity === 'error' ? 'text-destructive' : severity === 'warning' ? 'text-warning' : 'text-primary')} />
        <span className="text-xs text-foreground">{message}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", severityStyles[severity])}>{count}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { stats, isLoading: statsLoading } = useDashboardStats();

  const animatedBalance = useCountUpCurrency(stats.monthBalance);
  const animatedCritical = useCountUp(stats.criticalItems);
  const animatedOrders = useCountUp(stats.pendingOrders);
  const animatedRecipes = useCountUp(stats.recipesCount);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const hasAlerts = stats.pendingRedemptions > 0 || stats.pendingClosings > 0 || stats.pendingExpenses > 0;

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="animate-slide-up stagger-1">
        <div className="card-command p-5">
          <h2 className="text-xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] || 'Admin'}! 👋
          </h2>
          <p className="text-muted-foreground text-xs mt-1 capitalize">{currentDate}</p>
        </div>
      </div>

      {/* Notifications */}
      <NotificationCard />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Saldo do Mês"
          value={formatCurrency(animatedBalance)}
          icon={Wallet}
          variant={stats.monthBalance >= 0 ? "stat-command-green" : "stat-command-red"}
          onClick={() => navigate('/finance')}
          subtitle={stats.monthBalance >= 0 ? 'positivo' : 'negativo'}
          index={0}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={String(animatedOrders)}
          icon={ShoppingCart}
          variant="stat-command-amber"
          onClick={() => navigate('/inventory', { state: { activeTab: 'orders' } })}
          subtitle={stats.pendingOrders > 0 ? 'aguardando' : 'nenhum'}
          index={1}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Fichas Técnicas"
          value={String(animatedRecipes)}
          icon={ChefHat}
          variant="stat-command-purple"
          onClick={() => navigate('/recipes')}
          subtitle="cadastradas"
          index={2}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Estoque Crítico"
          value={String(animatedCritical)}
          icon={AlertTriangle}
          variant="stat-command-red"
          onClick={() => navigate('/inventory', { state: { stockFilter: 'critical' } })}
          subtitle={stats.criticalItems > 0 ? 'itens em alerta' : 'tudo ok'}
          index={3}
          isLoading={statsLoading}
        />
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="card-command-warning p-4 animate-slide-up stagger-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-sm text-foreground">Ações Pendentes</h3>
          </div>
          <div className="space-y-1">
            {stats.pendingRedemptions > 0 && (
              <AlertItem message="Resgates aguardando" count={stats.pendingRedemptions} severity="info" onClick={() => navigate('/rewards')} />
            )}
            {stats.pendingClosings > 0 && (
              <AlertItem message="Fechamentos pendentes" count={stats.pendingClosings} severity="warning" onClick={() => navigate('/cash-closing')} />
            )}
            {stats.pendingExpenses > 0 && (
              <AlertItem message="Despesas a pagar" count={Math.round(stats.pendingExpenses)} severity="info" onClick={() => navigate('/finance')} />
            )}
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div>
        <h3 className="section-label mb-2">Acesso Rápido</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickAccessCard title="Financeiro" subtitle="Receitas e despesas" icon={Wallet} iconBg="bg-success/10" iconColor="text-success" onClick={() => navigate('/finance')} index={0} />
          <QuickAccessCard title="Fichas" subtitle={`${stats.recipesCount} receitas`} icon={ChefHat} iconBg="bg-purple-500/10" iconColor="text-purple-500" onClick={() => navigate('/recipes')} index={1} />
          <QuickAccessCard title="Agenda" subtitle="Tarefas" icon={CalendarDays} iconBg="bg-primary/10" iconColor="text-primary" onClick={() => navigate('/agenda')} index={2} />
          <QuickAccessCard title="Estoque" subtitle={`${stats.itemsCount} itens`} icon={Package} iconBg="bg-primary/10" iconColor="text-primary" onClick={() => navigate('/inventory')} index={3} />
          <QuickAccessCard title="Checklists" subtitle="Tarefas diárias" icon={ClipboardCheck} iconBg="bg-success/10" iconColor="text-success" onClick={() => navigate('/checklists')} index={4} />
          <QuickAccessCard title="Fechamento" subtitle={stats.pendingClosings > 0 ? `${stats.pendingClosings} pendentes` : 'Caixas'} icon={Receipt} iconBg="bg-primary/10" iconColor="text-primary" onClick={() => navigate('/cash-closing')} index={5} />
          <QuickAccessCard title="Recompensas" subtitle={stats.pendingRedemptions > 0 ? `${stats.pendingRedemptions} pendentes` : 'Prêmios'} icon={Gift} iconBg="bg-warning/10" iconColor="text-warning" onClick={() => navigate('/rewards')} index={6} />
          <QuickAccessCard title="Config." subtitle={`${stats.usersCount} usuários`} icon={Settings} iconBg="bg-secondary" iconColor="text-secondary-foreground" onClick={() => navigate('/settings')} index={7} />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="animate-slide-up stagger-6">
        <Leaderboard 
          entries={leaderboard} 
          currentUserId={user?.id}
          isLoading={leaderboardLoading}
        />
      </div>
    </div>
  );
}
