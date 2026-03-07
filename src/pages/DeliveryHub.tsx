import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { useDeliveryHub, HubOrder, HubOrderStatus } from '@/hooks/useDeliveryHub';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  ifood: { label: 'iFood', color: 'bg-red-500/15 text-red-500', icon: 'Truck' },
  rappi: { label: 'Rappi', color: 'bg-orange-500/15 text-orange-500', icon: 'Truck' },
  uber_eats: { label: 'Uber Eats', color: 'bg-emerald-500/15 text-emerald-500', icon: 'Truck' },
  aiqfome: { label: 'AiQFome', color: 'bg-purple-500/15 text-purple-500', icon: 'Truck' },
  manual: { label: 'Manual', color: 'bg-muted text-muted-foreground', icon: 'Edit' },
};

const STATUS_CONFIG: Record<HubOrderStatus, { label: string; color: string; icon: string; bg: string }> = {
  new: { label: 'Novo', color: 'text-blue-500', icon: 'notifications_active', bg: 'bg-blue-500/15' },
  accepted: { label: 'Aceito', color: 'text-emerald-500', icon: 'check_circle', bg: 'bg-emerald-500/15' },
  preparing: { label: 'Preparando', color: 'text-amber-500', icon: 'skillet', bg: 'bg-amber-500/15' },
  ready: { label: 'Pronto', color: 'text-primary', icon: 'done_all', bg: 'bg-primary/15' },
  dispatched: { label: 'Saiu', color: 'text-violet-500', icon: 'local_shipping', bg: 'bg-violet-500/15' },
  delivered: { label: 'Entregue', color: 'text-success', icon: 'check_circle', bg: 'bg-success/15' },
  cancelled: { label: 'Cancelado', color: 'text-destructive', icon: 'cancel', bg: 'bg-destructive/15' },
};

const FILTER_TABS = [
  { key: 'active' as const, label: 'Ativos', icon: 'pending' },
  { key: 'new' as const, label: 'Novos', icon: 'notifications_active' },
  { key: 'delivered' as const, label: 'Entregues', icon: 'check_circle' },
  { key: 'all' as const, label: 'Todos', icon: 'list' },
];

export default function DeliveryHub() {
  const { activeUnit } = useUnit();
  const {
    orders, isLoading, statusFilter, setStatusFilter,
    updateStatus, fetchOrderItems, getNextStatuses, stats,
  } = useDeliveryHub(activeUnit?.id);

  const [selectedOrder, setSelectedOrder] = useState<HubOrder | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const handleOpenOrder = async (order: HubOrder) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const items = await fetchOrderItems(order.id);
      setOrderItems(items);
    } catch { setOrderItems([]); }
    finally { setLoadingItems(false); }
  };

  const handleStatusChange = async (orderId: string, status: HubOrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      toast.success(`Pedido ${STATUS_CONFIG[status].label.toLowerCase()}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    }
  };

  if (isLoading) return <AppLayout><PageLoader /></AppLayout>;

  return (
    <AppLayout>
      <div className="pb-28 lg:pb-12 px-4 pt-2 lg:px-8 lg:max-w-7xl lg:mx-auto space-y-4">
        <DesktopActionBar label="Hub de Delivery" onClick={() => {}} />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Novos', count: stats.new, color: 'text-blue-500', icon: 'notifications_active' },
            { label: 'Ativos', count: stats.active, color: 'text-amber-500', icon: 'pending' },
            { label: 'Entregues', count: stats.delivered, color: 'text-success', icon: 'check_circle' },
            { label: 'Total', count: stats.total, color: 'text-foreground', icon: 'list' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card/60 border border-border/20">
              <AppIcon name={s.icon} size={20} className={s.color} />
              <span className={cn("text-2xl font-black tabular-nums leading-none", s.color)}>{s.count}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                statusFilter === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AppIcon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/20 bg-card/20">
              <div className="w-16 h-16 rounded-2xl bg-muted/15 flex items-center justify-center mb-3">
                <AppIcon name="delivery_dining" size={32} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Nenhum pedido</p>
              <p className="text-xs text-muted-foreground/50 mt-1 max-w-[250px]">
                Pedidos recebidos de plataformas de delivery aparecerão aqui em tempo real
              </p>
            </div>
          ) : (
            orders.map(order => <HubOrderCard key={order.id} order={order} onOpen={handleOpenOrder} onStatusChange={handleStatusChange} />)
          )}
        </div>
      </div>

      {/* Order detail sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-3xl overflow-auto">
          {selectedOrder && (
            <OrderDetail
              order={selectedOrder}
              items={orderItems}
              loadingItems={loadingItems}
              onStatusChange={handleStatusChange}
              getNextStatuses={getNextStatuses}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function HubOrderCard({ order, onOpen, onStatusChange }: {
  order: HubOrder;
  onOpen: (o: HubOrder) => void;
  onStatusChange: (id: string, status: HubOrderStatus) => void;
}) {
  const platform = PLATFORM_CONFIG[order.platform] || PLATFORM_CONFIG.manual;
  const status = STATUS_CONFIG[order.status];
  const timeAgo = formatDistanceToNow(new Date(order.received_at), { addSuffix: true, locale: ptBR });

  return (
    <button
      onClick={() => onOpen(order)}
      className="w-full bg-card border border-border/40 rounded-2xl p-4 text-left active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase", platform.color)}>
              {platform.label}
            </span>
            <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1", status.bg, status.color)}>
              <AppIcon name={status.icon} size={12} fill={1} />
              {status.label}
            </span>
          </div>

          <p className="font-semibold text-foreground truncate">
            {order.platform_display_id ? `#${order.platform_display_id}` : `#${order.id.slice(0, 8)}`}
            {order.customer_name && <span className="text-muted-foreground font-normal"> — {order.customer_name}</span>}
          </p>

          {order.customer_address && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <AppIcon name="location_on" size={12} className="inline mr-0.5" />
              {order.customer_address}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground">
            {Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
        </div>
      </div>

      {/* Quick actions for new orders */}
      {order.status === 'new' && (
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            className="flex-1 h-9 rounded-xl text-xs font-bold"
            onClick={() => onStatusChange(order.id, 'accepted')}
          >
            <AppIcon name="check" size={14} className="mr-1" /> Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl text-xs"
            onClick={() => onStatusChange(order.id, 'cancelled')}
          >
            <AppIcon name="close" size={14} />
          </Button>
        </div>
      )}
    </button>
  );
}

function OrderDetail({ order, items, loadingItems, onStatusChange, getNextStatuses }: {
  order: HubOrder;
  items: any[];
  loadingItems: boolean;
  onStatusChange: (id: string, status: HubOrderStatus) => void;
  getNextStatuses: (s: HubOrderStatus) => HubOrderStatus[];
}) {
  const platform = PLATFORM_CONFIG[order.platform] || PLATFORM_CONFIG.manual;
  const status = STATUS_CONFIG[order.status];
  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-5 pb-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold uppercase", platform.color)}>
            {platform.label}
          </span>
          Pedido {order.platform_display_id ? `#${order.platform_display_id}` : `#${order.id.slice(0, 8)}`}
        </SheetTitle>
      </SheetHeader>

      {/* Status badge */}
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold", status.bg, status.color)}>
        <AppIcon name={status.icon} size={16} fill={1} />
        {status.label}
      </div>

      {/* Customer info */}
      <div className="bg-secondary/30 rounded-2xl p-4 space-y-2">
        {order.customer_name && (
          <div className="flex items-center gap-2">
            <AppIcon name="person" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">{order.customer_name}</span>
          </div>
        )}
        {order.customer_phone && (
          <div className="flex items-center gap-2">
            <AppIcon name="phone" size={16} className="text-muted-foreground" />
            <span className="text-sm">{order.customer_phone}</span>
          </div>
        )}
        {order.customer_address && (
          <div className="flex items-center gap-2">
            <AppIcon name="location_on" size={16} className="text-muted-foreground" />
            <span className="text-sm">{order.customer_address}</span>
          </div>
        )}
        {order.payment_method && (
          <div className="flex items-center gap-2">
            <AppIcon name="payments" size={16} className="text-muted-foreground" />
            <span className="text-sm">{order.payment_method}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <AppIcon name="schedule" size={16} className="text-muted-foreground" />
          <span className="text-sm">{format(new Date(order.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>

      {/* Items */}
      <div>
        <h4 className="text-sm font-bold mb-2">Itens do pedido</h4>
        {loadingItems ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <AppIcon name="Loader2" size={16} className="animate-spin" /> Carregando...
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Sem itens registrados</p>
        ) : (
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-border/20 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1">{item.quantity}x</span>
                    {item.name}
                  </p>
                  {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                  {item.options?.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.options.map((opt: any, j: number) => (
                        <span key={j} className="mr-2">+ {opt.name || opt}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium shrink-0 ml-2">
                  {Number(item.total_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="bg-secondary/30 rounded-2xl p-4 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{Number(order.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        {Number(order.delivery_fee) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de entrega</span>
            <span>{Number(order.delivery_fee).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        )}
        {Number(order.discount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desconto</span>
            <span className="text-success">-{Number(order.discount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border/20">
          <span>Total</span>
          <span>{Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-500/10 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-500 mb-1">Observações</p>
          <p className="text-sm">{order.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex gap-2">
          {nextStatuses.map(ns => {
            const nsConfig = STATUS_CONFIG[ns];
            const isCancel = ns === 'cancelled';
            return (
              <Button
                key={ns}
                variant={isCancel ? 'outline' : 'default'}
                className={cn("flex-1 h-12 rounded-xl font-bold", isCancel && "text-destructive")}
                onClick={() => onStatusChange(order.id, ns)}
              >
                <AppIcon name={nsConfig.icon} size={18} className="mr-1.5" />
                {nsConfig.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
