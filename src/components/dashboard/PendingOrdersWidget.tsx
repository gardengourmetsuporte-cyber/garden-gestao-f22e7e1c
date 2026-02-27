import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useOrders } from '@/hooks/useOrders';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export function PendingOrdersWidget() {
  const navigate = useNavigate();
  const { orders } = useOrders();

  const pendingThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return orders.filter(o => {
      if (o.status !== 'draft' && o.status !== 'sent') return false;
      const created = parseISO(o.created_at);
      return isWithinInterval(created, { start: weekStart, end: weekEnd }) || created < weekStart;
    });
  }, [orders]);

  if (pendingThisWeek.length === 0) return null;

  return (
    <button
      onClick={() => navigate('/orders')}
      className="w-full text-left card-command-info p-4 rounded-2xl animate-spring-in"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="ShoppingCart" size={16} className="text-primary" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
              Pedidos pendentes
            </span>
            <span className="text-[10px] font-semibold ml-2 px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {pendingThisWeek.length}
            </span>
          </div>
        </div>
        <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
      </div>

      <div className="space-y-2">
        {pendingThisWeek.slice(0, 4).map(order => {
          const statusConfig = order.status === 'sent'
            ? { label: 'Enviado', cls: 'bg-primary/10 text-primary' }
            : { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' };

          return (
            <div
              key={order.id}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/50 border border-border/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AppIcon name="Package" size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {order.supplier?.name || 'Fornecedor'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {order.order_items?.length || 0} ite{(order.order_items?.length || 0) !== 1 ? 'ns' : 'm'}
                  </p>
                </div>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", statusConfig.cls)}>
                {statusConfig.label}
              </span>
            </div>
          );
        })}
        {pendingThisWeek.length > 4 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{pendingThisWeek.length - 4} pedido{pendingThisWeek.length - 4 > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </button>
  );
}
