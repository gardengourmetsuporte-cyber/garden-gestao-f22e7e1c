import { useServiceDashboard } from '@/hooks/useServiceDashboard';
import { ServiceOperationStatus } from './ServiceOperationStatus';
import { ServiceOrderPipeline } from './ServiceOrderPipeline';
import { ServiceHourlySales } from './ServiceHourlySales';
import { ServiceDeliveryStatus } from './ServiceDeliveryStatus';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const KPI_ITEMS = [
  { key: 'sales', icon: 'payments', label: 'Vendas Hoje', gradient: 'linear-gradient(135deg, #22C55E, #10B981)' },
  { key: 'orders', icon: 'receipt_long', label: 'Pedidos Ativos', gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)' },
  { key: 'deliveries', icon: 'two_wheeler', label: 'Entregas', gradient: 'linear-gradient(135deg, #F59E0B, #F97316)' },
  { key: 'hub', icon: 'hub', label: 'Delivery Hub', gradient: 'linear-gradient(135deg, #EF4444, #F472B6)' },
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
        {KPI_ITEMS.map((kpi, i) => (
          <div
            key={kpi.key}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-card/70 border border-border/30",
              "transition-all duration-300 hover:border-border/60 hover:bg-card/90 hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] active:scale-[0.97]",
              "animate-slide-up",
              `dash-stagger-${i + 2}`,
            )}
          >
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", kpi.variant)}>
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
