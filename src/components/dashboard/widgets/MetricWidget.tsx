import { useNavigate } from 'react-router-dom';
import { Wallet, ShoppingCart, AlertTriangle, ChefHat, ArrowUpRight } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCountUp, useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { WidgetType } from '@/types/dashboard';

const metricConfig: Record<string, {
  title: string;
  icon: React.ElementType;
  variant: string;
  getSubtitle: (v: number) => string;
  getRoute: () => string | { pathname: string; state?: any };
}> = {
  metric_balance: {
    title: 'Saldo do Mês',
    icon: Wallet,
    variant: '',
    getSubtitle: (v) => v >= 0 ? 'positivo' : 'negativo',
    getRoute: () => '/finance',
  },
  metric_orders: {
    title: 'Pedidos Pendentes',
    icon: ShoppingCart,
    variant: 'stat-command-amber',
    getSubtitle: (v) => v > 0 ? 'aguardando' : 'nenhum',
    getRoute: () => '/inventory',
  },
  metric_critical: {
    title: 'Estoque Crítico',
    icon: AlertTriangle,
    variant: 'stat-command-red',
    getSubtitle: (v) => v > 0 ? 'itens em alerta' : 'tudo ok',
    getRoute: () => '/inventory',
  },
  metric_recipes: {
    title: 'Fichas Técnicas',
    icon: ChefHat,
    variant: 'stat-command-purple',
    getSubtitle: () => 'cadastradas',
    getRoute: () => '/recipes',
  },
};

interface MetricWidgetProps {
  type: WidgetType;
}

export function MetricWidget({ type }: MetricWidgetProps) {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();

  const config = metricConfig[type];
  if (!config) return null;

  const rawValue = type === 'metric_balance' ? stats.monthBalance
    : type === 'metric_orders' ? stats.pendingOrders
    : type === 'metric_critical' ? stats.criticalItems
    : stats.recipesCount;

  const isCurrency = type === 'metric_balance';
  const animatedCurrency = useCountUpCurrency(isCurrency ? rawValue : 0);
  const animatedCount = useCountUp(!isCurrency ? rawValue : 0);

  const displayValue = isCurrency
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animatedCurrency)
    : String(animatedCount);

  const variant = type === 'metric_balance'
    ? (stats.monthBalance >= 0 ? 'stat-command-green' : 'stat-command-red')
    : config.variant;

  const Icon = config.icon;

  const handleClick = () => {
    const route = config.getRoute();
    if (typeof route === 'string') navigate(route);
    else navigate(route.pathname, { state: route.state });
  };

  return (
    <div onClick={handleClick} className={cn('stat-command group cursor-pointer h-full flex flex-col justify-between', variant)}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border/30">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-active:opacity-100 transition-opacity" />
      </div>
      <div className="mt-auto">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          <>
            <p className="font-bold tracking-tight text-foreground text-2xl">{displayValue}</p>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">{config.title}</p>
            <p className="text-muted-foreground/60 text-[10px] mt-0.5">{config.getSubtitle(rawValue)}</p>
          </>
        )}
      </div>
    </div>
  );
}
