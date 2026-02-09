import { useNavigate } from 'react-router-dom';
import { 
  Package, ClipboardCheck, Gift, AlertTriangle, ArrowUpRight, ShoppingCart,
  Settings, AlertCircle, Receipt, Wallet, ChefHat, CalendarDays
} from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useOrders } from '@/hooks/useOrders';
import { useRewards } from '@/hooks/useRewards';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useCashClosing } from '@/hooks/useCashClosing';
import { useFinance } from '@/hooks/useFinance';
import { useRecipes } from '@/hooks/useRecipes';
import { useCountUp, useCountUpCurrency } from '@/hooks/useCountUp';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  onClick: () => void;
  gradient: string;
  subtitle?: string;
  index: number;
}

function MetricCard({ title, value, icon: Icon, onClick, gradient, subtitle, index }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-gradient group cursor-pointer animate-slide-up p-4",
        gradient,
        `stagger-${index + 1}`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 opacity-50 group-active:opacity-100 transition-opacity" />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-white/80 text-xs font-medium mt-0.5">{title}</p>
        {subtitle && <p className="text-white/50 text-[10px] mt-0.5">{subtitle}</p>}
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
        "card-interactive p-4 flex flex-col items-center text-center animate-slide-up",
        `stagger-${index + 1}`
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
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

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors active:scale-[0.98] group"
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
  const { items, getLowStockItems, getOutOfStockItems } = useInventoryDB();
  const { orders } = useOrders();
  const { allRedemptions } = useRewards();
  const { users } = useUsers();
  const { closings } = useCashClosing();
  const { monthStats } = useFinance(new Date());
  const { recipes } = useRecipes();

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();
  const criticalItems = lowStockItems.length + outOfStockItems.length;
  const pendingOrders = orders.filter(o => o.status === 'draft' || o.status === 'sent').length;
  const pendingRedemptions = allRedemptions.filter(r => r.status === 'pending').length;
  const pendingClosings = closings.filter(c => c.status === 'pending').length;
  const pendingExpenses = monthStats.pendingExpenses;

  const animatedBalance = useCountUpCurrency(monthStats.balance);
  const animatedCritical = useCountUp(criticalItems);
  const animatedOrders = useCountUp(pendingOrders);
  const animatedRecipes = useCountUp(recipes.length);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const hasAlerts = outOfStockItems.length > 0 || lowStockItems.length > 0 || pendingRedemptions > 0 || pendingClosings > 0 || pendingExpenses > 0;

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="animate-slide-up stagger-1">
        <div className="card-gradient bg-gradient-to-br from-primary/90 via-primary to-blue-700 p-5">
          <h2 className="text-xl font-bold">
            Olá, {profile?.full_name?.split(' ')[0] || 'Admin'}! 👋
          </h2>
          <p className="text-white/60 text-xs mt-1 capitalize">{currentDate}</p>
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
          gradient={monthStats.balance >= 0 ? "bg-gradient-to-br from-emerald-600 to-emerald-800" : "bg-gradient-to-br from-red-600 to-red-800"}
          onClick={() => navigate('/finance')}
          subtitle={monthStats.balance >= 0 ? 'positivo' : 'negativo'}
          index={0}
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={String(animatedOrders)}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-amber-600 to-amber-800"
          onClick={() => navigate('/inventory', { state: { activeTab: 'orders' } })}
          subtitle={pendingOrders > 0 ? 'aguardando' : 'nenhum'}
          index={1}
        />
        <MetricCard
          title="Fichas Técnicas"
          value={String(animatedRecipes)}
          icon={ChefHat}
          gradient="bg-gradient-to-br from-violet-600 to-violet-800"
          onClick={() => navigate('/recipes')}
          subtitle="cadastradas"
          index={2}
        />
        <MetricCard
          title="Estoque Crítico"
          value={String(animatedCritical)}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-rose-600 to-rose-800"
          onClick={() => navigate('/inventory', { state: { stockFilter: 'critical' } })}
          subtitle={criticalItems > 0 ? 'itens em alerta' : 'tudo ok'}
          index={3}
        />
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="alert-card alert-warning animate-slide-up stagger-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="font-semibold text-sm text-foreground">Ações Pendentes</h3>
            </div>
            <div className="space-y-0.5">
              {outOfStockItems.length > 0 && (
                <AlertItem message="Itens zerados no estoque" count={outOfStockItems.length} severity="error" onClick={() => navigate('/inventory', { state: { stockFilter: 'zero' } })} />
              )}
              {lowStockItems.length > 0 && (
                <AlertItem message="Itens com estoque baixo" count={lowStockItems.length} severity="warning" onClick={() => navigate('/inventory', { state: { stockFilter: 'low' } })} />
              )}
              {pendingRedemptions > 0 && (
                <AlertItem message="Resgates aguardando" count={pendingRedemptions} severity="info" onClick={() => navigate('/rewards')} />
              )}
              {pendingClosings > 0 && (
                <AlertItem message="Fechamentos pendentes" count={pendingClosings} severity="warning" onClick={() => navigate('/cash-closing')} />
              )}
              {pendingExpenses > 0 && (
                <AlertItem message="Despesas a pagar" count={Math.round(pendingExpenses)} severity="info" onClick={() => navigate('/finance')} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div>
        <h3 className="section-label mb-2">Acesso Rápido</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickAccessCard title="Financeiro" subtitle="Receitas e despesas" icon={Wallet} iconBg="bg-emerald-500/10" iconColor="text-emerald-600" onClick={() => navigate('/finance')} index={0} />
          <QuickAccessCard title="Fichas" subtitle={`${recipes.length} receitas`} icon={ChefHat} iconBg="bg-purple-500/10" iconColor="text-purple-600" onClick={() => navigate('/recipes')} index={1} />
          <QuickAccessCard title="Agenda" subtitle="Tarefas" icon={CalendarDays} iconBg="bg-blue-500/10" iconColor="text-blue-600" onClick={() => navigate('/agenda')} index={2} />
          <QuickAccessCard title="Estoque" subtitle={`${items.length} itens`} icon={Package} iconBg="bg-primary/10" iconColor="text-primary" onClick={() => navigate('/inventory')} index={3} />
          <QuickAccessCard title="Checklists" subtitle="Tarefas diárias" icon={ClipboardCheck} iconBg="bg-success/10" iconColor="text-success" onClick={() => navigate('/checklists')} index={4} />
          <QuickAccessCard title="Fechamento" subtitle={pendingClosings > 0 ? `${pendingClosings} pendentes` : 'Caixas'} icon={Receipt} iconBg="bg-cyan-500/10" iconColor="text-cyan-600" onClick={() => navigate('/cash-closing')} index={5} />
          <QuickAccessCard title="Recompensas" subtitle={pendingRedemptions > 0 ? `${pendingRedemptions} pendentes` : 'Prêmios'} icon={Gift} iconBg="bg-amber-500/10" iconColor="text-amber-500" onClick={() => navigate('/rewards')} index={6} />
          <QuickAccessCard title="Config." subtitle={`${users.length} usuários`} icon={Settings} iconBg="bg-secondary" iconColor="text-secondary-foreground" onClick={() => navigate('/settings')} index={7} />
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
