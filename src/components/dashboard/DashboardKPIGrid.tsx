import { AppIcon } from '@/components/ui/app-icon';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface KPICard {
  key: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
  visible: boolean;
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
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      route: '/orders',
      visible: hasAccess('orders') && isVisible('pending-orders'),
    },
    {
      key: 'bills-due',
      label: 'Contas',
      value: billsCount,
      icon: 'AlertTriangle',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      route: '/finance',
      visible: hasAccess('finance') && isVisible('bills-due'),
    },
    {
      key: 'pending-actions',
      label: 'Resgates',
      value: stats.pendingRedemptions,
      icon: 'Gift',
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      route: '/rewards',
      visible: hasAccess('rewards') && isVisible('pending-actions'),
    },
  ];

  const visibleCards = cards.filter(c => c.visible);
  if (visibleCards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {visibleCards.map((card, i) => (
        <button
          key={card.key}
          onClick={() => navigate(card.route)}
          className={`dash-kpi-card group animate-card-reveal dash-stagger-${i + 2}`}
        >
          <div className={`dash-kpi-icon ${card.bgColor} ${card.color} animate-subtle-float`} style={{ animationDelay: `${i * 200}ms` }}>
            <AppIcon name={card.icon} size={18} />
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <Skeleton className="h-7 w-10 rounded-lg" />
            ) : (
              <span className={`text-2xl font-extrabold tracking-tight animate-number-reveal ${card.value > 0 ? card.color : 'text-muted-foreground/40'}`} style={{ animationDelay: `${200 + i * 100}ms` }}>
                {card.value}
              </span>
            )}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
