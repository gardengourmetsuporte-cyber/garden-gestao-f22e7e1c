import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { ActiveOrder } from '@/hooks/useServiceDashboard';

const SOURCE_CONFIG: Record<string, { label: string; icon: string; variant: string }> = {
  mesa: { label: 'Mesa', icon: 'table_restaurant', variant: 'bg-blue-500/15 text-blue-400' },
  mesa_levar: { label: 'Mesa (levar)', icon: 'takeout_dining', variant: 'bg-cyan-500/15 text-cyan-400' },
  qrcode: { label: 'QR Code', icon: 'qr_code_2', variant: 'bg-violet-500/15 text-violet-400' },
  balcao: { label: 'Balcão', icon: 'storefront', variant: 'bg-amber-500/15 text-amber-400' },
  delivery: { label: 'Delivery', icon: 'delivery_dining', variant: 'bg-primary/15 text-primary' },
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
      'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
      isLong ? 'bg-destructive/15 text-destructive' :
      isWarning ? 'bg-amber-500/15 text-amber-400' :
      'bg-muted/60 text-muted-foreground'
    )}>
      {minutes}min
    </span>
  );
}

export function ServiceActiveOrders({ orders }: { orders: ActiveOrder[] }) {
  const grouped = orders.reduce<Record<string, ActiveOrder[]>>((acc, o) => {
    const key = o.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <AppIcon name="receipt_long" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground flex-1">Pedidos Ativos</h3>
        {orders.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
            {orders.length}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <AppIcon name="check_circle" size={20} className="text-success" />
          </div>
          <p className="text-xs text-muted-foreground">Nenhum pedido ativo no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([source, items]) => {
            const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.mesa;
            return (
              <div key={source}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', cfg.variant)}>
                    <AppIcon name={cfg.icon} size={11} />
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{items.length}</span>
                </div>
                <div className="space-y-1">
                  {items.map(order => (
                    <div key={order.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/20 border border-border/10 text-xs">
                      <span className="font-bold text-foreground min-w-[44px] tabular-nums">
                        {order.source === 'balcao' ? `#${order.order_number || '—'}` : `M${order.table_number}`}
                      </span>
                      <span className="text-muted-foreground truncate flex-1">
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">{formatCurrency(order.total)}</span>
                      <TimeBadge minutes={order.minutesAgo} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
