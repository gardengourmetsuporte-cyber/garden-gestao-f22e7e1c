import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

function AnimatedValue({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

const items = [
  { key: 'criticalItems', title: 'Itens Críticos', icon: 'AlertTriangle', route: '/inventory', activeVariant: 'warning' },
  { key: 'pendingOrders', title: 'Pedidos', icon: 'ShoppingCart', route: '/orders', activeVariant: 'primary' },
  { key: 'pendingClosings', title: 'Fechamentos', icon: 'FileText', route: '/cash-closing', activeVariant: 'destructive' },
  { key: 'pendingRedemptions', title: 'Resgates', icon: 'Gift', route: '/rewards', activeVariant: 'success' },
] as const;

const variantIcon: Record<string, string> = {
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  destructive: 'bg-destructive/15 text-destructive',
  success: 'bg-success/15 text-success',
  default: 'bg-secondary text-secondary-foreground',
};

export function QuickStatsWidget() {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const value = stats[item.key as keyof typeof stats] as number;
        const isActive = value > 0;
        const variant = isActive ? item.activeVariant : 'default';

        return (
          <button
            key={item.key}
            onClick={() => navigate(item.route)}
            className={cn(
              "card-stat-holo text-left transition-all duration-200 active:scale-[0.97]",
              isActive && "ring-1 ring-inset",
              isActive && variant === 'warning' && "ring-warning/20",
              isActive && variant === 'primary' && "ring-primary/20",
              isActive && variant === 'destructive' && "ring-destructive/20",
              isActive && variant === 'success' && "ring-success/20",
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("stat-holo-icon", variantIcon[variant])}>
                <AppIcon name={item.icon as any} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{item.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>
                    <AnimatedValue value={value} />
                  </p>
                  {isActive && (
                    <span className={cn("text-[9px] font-bold uppercase tracking-wide", variantIcon[variant].split(' ')[1])}>
                      pendente{value !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
