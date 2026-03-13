import { useServiceDashboard } from '@/hooks/useServiceDashboard';
import { ServiceOperationStatus } from './ServiceOperationStatus';
import { ServiceOrderPipeline } from './ServiceOrderPipeline';
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
  const { stats, pipeline, hourlySales, deliveries, hubActive, pulse } = useServiceDashboard();

  const values: Record<string, string> = {
    sales: formatCurrency(stats.salesToday),
    orders: String(stats.activeOrders),
    deliveries: String(stats.activeDeliveries),
    hub: String(stats.hubActive),
  };

  return (
    <div className="space-y-4">
      {/* Operation Pulse Hero */}
      <ServiceOperationStatus pulse={pulse} />

      {/* KPI Grid 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {KPI_ITEMS.map(kpi => (
          <div
            key={kpi.key}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-card/70 border border-border/30"
          >
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", kpi.variant)}>
              <AppIcon name={kpi.icon} size={18} />
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

      {/* Order Pipeline */}
      <ServiceOrderPipeline pipeline={pipeline} />

      {/* Hourly Sales */}
      <ServiceHourlySales data={hourlySales} />

      {/* Deliveries & Hub */}
      <ServiceDeliveryStatus deliveries={deliveries} hubOrders={hubActive} />
    </div>
  );
}
