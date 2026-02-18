import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  ShoppingCart,
  Gift,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatItem {
  title: string;
  value: number | string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'destructive' | 'success' | 'primary';
  subtitle?: string;
}

interface QuickStatsProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

const variantStyles = {
  default: 'bg-secondary text-secondary-foreground',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  success: 'bg-success/10 text-success',
  primary: 'bg-primary/10 text-primary',
};

function AnimatedStatValue({ value }: { value: number | string }) {
  const numericValue = typeof value === 'number' ? value : null;
  const animated = useCountUp(numericValue ?? 0);
  return <>{numericValue !== null ? animated : value}</>;
}

export function QuickStats({ stats, columns = 2 }: QuickStatsProps) {
  return (
    <div className={cn(
      "grid gap-3",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-2 lg:grid-cols-4"
    )}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const variant = stat.variant || 'default';

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold"><AnimatedStatValue value={stat.value} /></p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
                  )}
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  variantStyles[variant]
                )}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
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
  { title: 'Total de Itens', value: data.totalItems, icon: Package },
  { title: 'Estoque Baixo', value: data.lowStock, icon: AlertTriangle, variant: data.lowStock > 0 ? 'warning' : 'default' },
  { title: 'Zerados', value: data.outOfStock, icon: Package, variant: data.outOfStock > 0 ? 'destructive' : 'default' },
  { title: 'Movimentações', value: data.recentMovements, icon: Clock, variant: 'success', subtitle: 'últimos 7 dias' },
];

export const createChecklistStats = (data: {
  completed: number;
  total: number;
  percentage: number;
}): StatItem[] => [
  { title: 'Concluídos', value: data.completed, icon: CheckCircle2, variant: 'success' },
  { title: 'Total', value: data.total, icon: Clock },
  { title: 'Progresso', value: `${data.percentage}%`, icon: Star, variant: 'primary' },
];

export const createAdminStats = (data: {
  totalUsers: number;
  pendingOrders: number;
  pendingRedemptions: number;
  totalPoints: number;
}): StatItem[] => [
  { title: 'Usuários', value: data.totalUsers, icon: Users },
  { title: 'Pedidos Pendentes', value: data.pendingOrders, icon: ShoppingCart, variant: data.pendingOrders > 0 ? 'warning' : 'default' },
  { title: 'Resgates Pendentes', value: data.pendingRedemptions, icon: Gift, variant: data.pendingRedemptions > 0 ? 'warning' : 'default' },
  { title: 'Pontos Totais', value: data.totalPoints, icon: Star, variant: 'primary' },
];
