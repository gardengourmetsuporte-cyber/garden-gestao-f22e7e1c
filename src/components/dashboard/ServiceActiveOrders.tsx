import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { ActiveOrder } from '@/hooks/useServiceDashboard';

const SOURCE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  mesa: { label: 'Mesa', icon: 'table_restaurant', color: 'bg-blue-500/10 text-blue-600' },
  mesa_levar: { label: 'Mesa (levar)', icon: 'takeout_dining', color: 'bg-cyan-500/10 text-cyan-600' },
  qrcode: { label: 'QR Code', icon: 'qr_code_2', color: 'bg-violet-500/10 text-violet-600' },
  balcao: { label: 'Balcão', icon: 'storefront', color: 'bg-amber-500/10 text-amber-600' },
  delivery: { label: 'Delivery', icon: 'delivery_dining', color: 'bg-green-500/10 text-green-600' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  awaiting_confirmation: 'Aguardando',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
};

function TimeBadge({ minutes }: { minutes: number }) {
  const isLong = minutes > 30;
  const isWarning = minutes > 15;
  return (
    <span className={cn(
      'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
      isLong ? 'bg-destructive/10 text-destructive' :
      isWarning ? 'bg-amber-500/10 text-amber-600' :
      'bg-muted text-muted-foreground'
    )}>
      {minutes}min
    </span>
  );
}

export function ServiceActiveOrders({ orders }: { orders: ActiveOrder[] }) {
  // Group by source
  const grouped = orders.reduce<Record<string, ActiveOrder[]>>((acc, o) => {
    const key = o.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <AppIcon name="check_circle" size={32} className="mx-auto mb-2 text-green-500" />
          Nenhum pedido ativo no momento
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AppIcon name="receipt_long" size={18} className="text-primary" />
          Pedidos Ativos
          <Badge variant="secondary" className="ml-auto text-[10px]">{orders.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {Object.entries(grouped).map(([source, items]) => {
          const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.mesa;
          return (
            <div key={source}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
                  <AppIcon name={cfg.icon} size={12} />
                  {cfg.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map(order => (
                  <div key={order.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 text-xs">
                    <span className="font-semibold text-foreground min-w-[40px]">
                      {order.source === 'balcao' ? `#${order.order_number || '—'}` : `Mesa ${order.table_number}`}
                    </span>
                    <span className="text-muted-foreground truncate flex-1">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="font-medium text-foreground">{formatCurrency(order.total)}</span>
                    <TimeBadge minutes={order.minutesAgo} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
