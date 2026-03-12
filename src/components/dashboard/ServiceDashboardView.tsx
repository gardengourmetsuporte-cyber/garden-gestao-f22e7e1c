import { useServiceDashboard } from '@/hooks/useServiceDashboard';
import { ServiceActiveOrders } from './ServiceActiveOrders';
import { ServiceHourlySales } from './ServiceHourlySales';
import { ServiceDeliveryStatus } from './ServiceDeliveryStatus';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';

function KpiCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="p-3 flex flex-col items-center gap-1">
        <AppIcon name={icon} size={20} className={accent || 'text-primary'} />
        <span className="text-base font-bold text-foreground leading-tight">{value}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </CardContent>
    </Card>
  );
}

export function ServiceDashboardView() {
  const { stats, orders, hourlySales, deliveries, hubActive } = useServiceDashboard();

  return (
    <div className="mt-4 space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon="payments" label="Vendas Hoje" value={formatCurrency(stats.salesToday)} accent="text-green-500" />
        <KpiCard icon="receipt_long" label="Pedidos Ativos" value={String(stats.activeOrders)} accent="text-blue-500" />
        <KpiCard icon="two_wheeler" label="Entregas" value={String(stats.activeDeliveries)} accent="text-amber-500" />
        <KpiCard icon="hub" label="Delivery Hub" value={String(stats.hubActive)} accent="text-red-500" />
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
