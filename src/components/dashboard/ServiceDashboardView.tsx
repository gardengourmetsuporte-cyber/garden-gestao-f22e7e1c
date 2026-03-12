import { useServiceDashboard } from '@/hooks/useServiceDashboard';
import { ServiceActiveOrders } from './ServiceActiveOrders';
import { ServiceHourlySales } from './ServiceHourlySales';
import { ServiceDeliveryStatus } from './ServiceDeliveryStatus';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const KPI_ITEMS = [
  { key: 'sales', icon: 'payments', label: 'Vendas Hoje', variant: 'bg-emerald-500/15 text-emerald-400' },
  { key: 'orders', icon: 'receipt_long', label: 'Pedidos Ativos', variant: 'bg-blue-500/15 text-blue-400' },
  { key: 'deliveries', icon: 'two_wheeler', label: 'Entregas', variant: 'bg-amber-500/15 text-amber-400' },
  { key: 'hub', icon: 'hub', label: 'Delivery Hub', variant: 'bg-red-500/15 text-red-400' },
] as const;

export function ServiceDashboardView() {
  const { stats, orders, hourlySales, deliveries, hubActive } = useServiceDashboard();

  const values: Record<string, string> = {
    sales: formatCurrency(stats.salesToday),
    orders: String(stats.activeOrders),
    deliveries: String(stats.activeDeliveries),
    hub: String(stats.hubActive),
  };

  return (
    <div className="mt-4 space-y-4">
      {/* KPI Strip — horizontal scroll like QuickStats */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 lg:-mx-8 lg:px-8 snap-x snap-mandatory">
        {KPI_ITEMS.map(kpi => (
          <div
            key={kpi.key}
            className="flex items-center gap-2.5 shrink-0 snap-start rounded-xl px-3.5 py-2.5 bg-card/70 border border-border/30 min-w-[140px]"
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", kpi.variant)}>
              <AppIcon name={kpi.icon} size={16} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-lg font-extrabold font-display leading-tight" style={{ letterSpacing: '-0.02em' }}>
                {values[kpi.key]}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Orders */}
      <ServiceActiveOrders orders={orders} />

      {/* Hourly Sales Chart */}
      <ServiceHourlySales data={hourlySales} />

      {/* Deliveries & Hub */}
      <ServiceDeliveryStatus deliveries={deliveries} hubOrders={hubActive} />
    </div>
  );
}
