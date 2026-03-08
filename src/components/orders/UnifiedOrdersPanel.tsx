import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useUnifiedOrders, UnifiedTab, TabletOrder } from '@/hooks/useUnifiedOrders';
import type { HubOrder, HubOrderStatus } from '@/hooks/useDeliveryHub';

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusColor: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground',
  awaiting_confirmation: 'bg-warning/15 text-warning',
  confirmed: 'bg-primary/15 text-primary',
  sent_to_pdv: 'bg-success/15 text-success',
  error: 'bg-destructive/15 text-destructive',
  new: 'bg-warning/15 text-warning',
  accepted: 'bg-primary/15 text-primary',
  preparing: 'bg-accent/15 text-accent-foreground',
  ready: 'bg-success/15 text-success',
  dispatched: 'bg-primary/15 text-primary',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
};

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  awaiting_confirmation: 'Aguardando',
  confirmed: 'Confirmado',
  sent_to_pdv: 'Enviado PDV',
  error: 'Erro',
  new: 'Novo',
  accepted: 'Aceito',
  preparing: 'Preparando',
  ready: 'Pronto',
  dispatched: 'Despachado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const platformLabel: Record<string, string> = {
  ifood: 'iFood',
  rappi: 'Rappi',
  uber_eats: 'Uber Eats',
  aiqfome: 'AiQFome',
  manual: 'Manual',
};

interface Props {
  unitId: string | undefined;
  onRetryPDV?: (orderId: string) => void;
}

export function UnifiedOrdersPanel({ unitId, onRetryPDV }: Props) {
  const {
    activeTab, setActiveTab,
    comandas, deliveryOrders, hubOrders,
    hubUpdateStatus, hubGetNextStatuses,
    isLoading, stats,
  } = useUnifiedOrders(unitId);

  const tabs: { id: UnifiedTab; label: string; icon: string; count: number; badge?: number }[] = [
    { id: 'comandas', label: 'Comandas', icon: 'Receipt', count: stats.comandas, badge: stats.comandasPending },
    { id: 'delivery', label: 'Delivery', icon: 'Bike', count: stats.delivery, badge: stats.deliveryPending },
    { id: 'ifood', label: 'iFood/Rappi', icon: 'Store', count: stats.ifood, badge: stats.ifoodNew },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <AppIcon name={tab.icon} size={15} />
            {tab.label}
            {(tab.badge ?? 0) > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-destructive text-destructive-foreground">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'comandas' && (
        <TabletOrderList orders={comandas} emptyIcon="QrCode" emptyTitle="Nenhuma comanda" emptySubtitle="Pedidos feitos nas mesas aparecerão aqui" onRetryPDV={onRetryPDV} showTable />
      )}

      {activeTab === 'delivery' && (
        <TabletOrderList orders={deliveryOrders} emptyIcon="Bike" emptyTitle="Nenhum pedido delivery" emptySubtitle="Pedidos do cardápio digital aparecerão aqui" onRetryPDV={onRetryPDV} showCustomer />
      )}

      {activeTab === 'ifood' && (
        <HubOrderList orders={hubOrders} onUpdateStatus={hubUpdateStatus} getNextStatuses={hubGetNextStatuses} />
      )}
    </div>
  );
}

// ---- Tablet order list ----
function TabletOrderList({ orders, emptyIcon, emptyTitle, emptySubtitle, onRetryPDV, showTable, showCustomer }: {
  orders: TabletOrder[];
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
  onRetryPDV?: (id: string) => void;
  showTable?: boolean;
  showCustomer?: boolean;
}) {
  if (orders.length === 0) {
    return <EmptyState icon={emptyIcon as any} title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <div className="space-y-2">
      {orders.map(order => (
        <div key={order.id} className="card-base p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showTable && <span className="font-bold text-foreground">Mesa {order.table_number}</span>}
              {showCustomer && (
                <span className="font-bold text-foreground">
                  {order.customer_name || 'Cliente'}
                </span>
              )}
              <Badge className={statusColor[order.status] || 'bg-secondary'}>
                {statusLabel[order.status] || order.status}
              </Badge>
            </div>
            <span className="font-bold text-primary">{formatPrice(order.total)}</span>
          </div>

          {showCustomer && order.customer_phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AppIcon name="Phone" size={12} /> {order.customer_phone}
            </p>
          )}
          {showCustomer && order.customer_address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AppIcon name="MapPin" size={12} /> {order.customer_address}
            </p>
          )}

          {order.tablet_order_items && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {order.tablet_order_items.map((item: any) => (
                <p key={item.id}>{item.quantity}x {item.tablet_products?.name || '?'}</p>
              ))}
            </div>
          )}

          {order.error_message && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AppIcon name="AlertCircle" size={12} /> {order.error_message}
            </p>
          )}
          {order.status === 'error' && onRetryPDV && (
            <Button size="sm" variant="outline" onClick={() => onRetryPDV(order.id)}>
              <AppIcon name="RefreshCw" size={14} className="mr-1" /> Reenviar
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground">
            {new Date(order.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---- Hub order list (iFood/Rappi) ----
function HubOrderList({ orders, onUpdateStatus, getNextStatuses }: {
  orders: HubOrder[];
  onUpdateStatus: any;
  getNextStatuses: (s: HubOrderStatus) => HubOrderStatus[];
}) {
  if (orders.length === 0) {
    return <EmptyState icon="Store" title="Nenhum pedido de plataforma" subtitle="Pedidos do iFood, Rappi e outras plataformas aparecerão aqui" />;
  }

  return (
    <div className="space-y-2">
      {orders.map(order => {
        const nextStatuses = getNextStatuses(order.status as HubOrderStatus);
        return (
          <div key={order.id} className="card-base p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {platformLabel[order.platform] || order.platform}
                </Badge>
                <span className="font-bold text-foreground text-sm">{order.customer_name}</span>
                <Badge className={statusColor[order.status] || 'bg-secondary'}>
                  {statusLabel[order.status] || order.status}
                </Badge>
              </div>
              <span className="font-bold text-primary">{formatPrice(order.total)}</span>
            </div>

            {order.customer_address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AppIcon name="MapPin" size={12} /> {order.customer_address}
              </p>
            )}

            {order.notes && (
              <p className="text-xs text-muted-foreground italic">{order.notes}</p>
            )}

            {order.platform_display_id && (
              <p className="text-[10px] text-muted-foreground">
                Pedido #{order.platform_display_id}
              </p>
            )}

            {nextStatuses.length > 0 && (
              <div className="flex gap-2 pt-1">
                {nextStatuses.map(ns => (
                  <Button
                    key={ns}
                    size="sm"
                    variant={ns === 'cancelled' ? 'destructive' : 'default'}
                    onClick={() => onUpdateStatus.mutate({ orderId: order.id, status: ns })}
                    disabled={onUpdateStatus.isPending}
                  >
                    {statusLabel[ns] || ns}
                  </Button>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              {new Date(order.received_at).toLocaleString('pt-BR')}
            </p>
          </div>
        );
      })}
    </div>
  );
}
