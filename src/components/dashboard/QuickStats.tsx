import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatItem {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'default' | 'warning' | 'destructive' | 'success' | 'primary';
  subtitle?: string;
}

interface QuickStatsProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

const variantStyles: Record<string, { gradient: string }> = {
  default: { gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
  warning: { gradient: 'linear-gradient(135deg, #F59E0B, #F97316)' },
  destructive: { gradient: 'linear-gradient(135deg, #EF4444, #F472B6)' },
  success: { gradient: 'linear-gradient(135deg, #22C55E, #10B981)' },
  primary: { gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)' },
};

function AnimatedStatValue({ value }: { value: number | string }) {
  const numericValue = typeof value === 'number' ? value : null;
  const animated = useCountUp(numericValue ?? 0);
  return <>{numericValue !== null ? animated : value}</>;
}

export function QuickStats({ stats, columns = 2 }: QuickStatsProps) {
  return (
    <div className={cn(
      "grid gap-2.5",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-2 lg:grid-cols-4"
    )}>
      {stats.map((stat, index) => {
        const variant = stat.variant || 'default';
        const style = variantStyles[variant];

        return (
          <div key={index} className="bg-card rounded-2xl p-3.5 border border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: style.gradient }}>
                <AppIcon name={stat.icon} size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold tabular-nums leading-none tracking-tight">
                  <AnimatedStatValue value={stat.value} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{stat.title}</p>
                {stat.subtitle && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Pre-built stat configurations for common use cases
export const createInventoryStats = (data: {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  recentMovements: number;
}): StatItem[] => [
  { title: 'Total de Itens', value: data.totalItems, icon: 'Package' },
  { title: 'Estoque Baixo', value: data.lowStock, icon: 'AlertTriangle', variant: data.lowStock > 0 ? 'warning' : 'default' },
  { title: 'Zerados', value: data.outOfStock, icon: 'Package', variant: data.outOfStock > 0 ? 'destructive' : 'default' },
  { title: 'Movimentações', value: data.recentMovements, icon: 'Clock', variant: 'success', subtitle: 'últimos 7 dias' },
];

export const createChecklistStats = (data: {
  completed: number;
  total: number;
  percentage: number;
}): StatItem[] => [
  { title: 'Concluídos', value: data.completed, icon: 'CheckCircle2', variant: 'success' },
  { title: 'Total', value: data.total, icon: 'Clock' },
  { title: 'Progresso', value: `${data.percentage}%`, icon: 'Star', variant: 'primary' },
];

export const createAdminStats = (data: {
  totalUsers: number;
  pendingOrders: number;
  pendingRedemptions: number;
  totalPoints: number;
}): StatItem[] => [
  { title: 'Usuários', value: data.totalUsers, icon: 'Users' },
  { title: 'Pedidos Pendentes', value: data.pendingOrders, icon: 'ShoppingCart', variant: data.pendingOrders > 0 ? 'warning' : 'default' },
  { title: 'Resgates Pendentes', value: data.pendingRedemptions, icon: 'Gift', variant: data.pendingRedemptions > 0 ? 'warning' : 'default' },
  { title: 'Pontos Totais', value: data.totalPoints, icon: 'Star', variant: 'primary' },
];
