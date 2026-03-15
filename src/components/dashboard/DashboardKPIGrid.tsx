import { AppIcon } from '@/components/ui/app-icon';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KPICard {
  key: string;
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  route: string;
  visible: boolean;
  gradient?: string;
}

interface DashboardKPIGridProps {
  stats: {
    pendingOrders: number;
    billsDueSoon: { length: number } | any[];
    pendingRedemptions: number;
    criticalItems: number;
  };
  isLoading: boolean;
  hasAccess: (m: string) => boolean;
  isVisible: (k: string) => boolean;
}

export function DashboardKPIGrid({ stats, isLoading, hasAccess, isVisible }: DashboardKPIGridProps) {
  const navigate = useNavigate();

  const billsCount = Array.isArray(stats.billsDueSoon) ? stats.billsDueSoon.length : 0;

  const cards: KPICard[] = [
    {
      key: 'pending-orders',
      label: 'Pedidos',
      value: stats.pendingOrders,
      icon: 'ShoppingCart',
      iconBg: '',
      iconColor: 'text-white',
      route: '/orders',
      visible: hasAccess('orders') && isVisible('pending-orders'),
      gradient: 'linear-gradient(135deg, #F59E0B, #F97316)',
    },
    {
      key: 'bills-due',
      label: 'Contas',
      value: billsCount,
      icon: 'AlertTriangle',
      iconBg: '',
      iconColor: 'text-white',
      route: '/finance',
      visible: hasAccess('finance') && isVisible('bills-due'),
      gradient: 'linear-gradient(135deg, #EF4444, #F472B6)',
    },
    {
      key: 'pending-actions',
      label: 'Resgates',
      value: stats.pendingRedemptions,
      icon: 'Gift',
      iconBg: '',
      iconColor: 'text-white',
      route: '/rewards',
      visible: hasAccess('rewards') && isVisible('pending-actions'),
      gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
    },
  ];

  const visibleCards = cards.filter(c => c.visible);
  if (visibleCards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {visibleCards.map((card, i) => (
        <button
          key={card.key}
          onClick={() => navigate(card.route)}
          className={cn(
            "flex items-center gap-3 rounded-2xl p-3.5",
            "bg-card border border-border/40 hover:border-border/60",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation",
            `animate-card-reveal dash-stagger-${i + 2}`,
          )}
        >
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", card.iconBg)}>
            <AppIcon name={card.icon} size={18} className={card.iconColor} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            {isLoading ? (
              <Skeleton className="h-5 w-8 rounded mt-0.5" />
            ) : (
              <span className={cn("text-lg font-bold tracking-tight tabular-nums block leading-none", card.value > 0 ? 'text-foreground' : 'text-muted-foreground/40')}>
                {card.value}
              </span>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{card.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
