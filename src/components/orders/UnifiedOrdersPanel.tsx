import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUnifiedOrders, UnifiedTab, TabletOrder } from '@/hooks/useUnifiedOrders';
import type { HubOrder, HubOrderStatus } from '@/hooks/useDeliveryHub';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusColor: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground',
  awaiting_confirmation: 'bg-warning/15 text-warning',
  confirmed: 'bg-primary/15 text-primary',
  preparing: 'bg-amber-500/15 text-amber-500',
  ready: 'bg-emerald-500/15 text-emerald-500',
  dispatched: 'bg-violet-500/15 text-violet-500',
  sent_to_pdv: 'bg-success/15 text-success',
  delivered: 'bg-success/15 text-success',
  error: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-destructive/15 text-destructive',
  new: 'bg-warning/15 text-warning',
  accepted: 'bg-primary/15 text-primary',
};

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  awaiting_confirmation: 'Aguardando',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  dispatched: 'Saiu p/ entrega',
  sent_to_pdv: 'Enviado PDV',
  delivered: 'Entregue',
  error: 'Erro',
  cancelled: 'Cancelado',
  new: 'Novo',
  accepted: 'Aceito',
};

const platformLabel: Record<string, string> = {
  ifood: 'iFood',
  rappi: 'Rappi',
  uber_eats: 'Uber Eats',
  aiqfome: 'AiQFome',
  manual: 'Manual',
};

// Status flow for tablet delivery orders
const TABLET_STATUS_FLOW: Record<string, { next: string[]; labels: Record<string, { label: string; icon: string; variant: 'default' | 'destructive' | 'outline' }> }> = {
  awaiting_confirmation: {
    next: ['confirmed', 'cancelled'],
    labels: {
      confirmed: { label: 'Aceitar pedido', icon: 'check_circle', variant: 'default' },
      cancelled: { label: 'Recusar', icon: 'cancel', variant: 'destructive' },
    },
  },
  confirmed: {
    next: ['preparing', 'cancelled'],
    labels: {
      preparing: { label: 'Começar o preparo', icon: 'skillet', variant: 'default' },
      cancelled: { label: 'Cancelar', icon: 'cancel', variant: 'destructive' },
    },
  },
  preparing: {
    next: ['ready'],
    labels: {
      ready: { label: 'Pedido pronto', icon: 'done_all', variant: 'default' },
    },
  },
  ready: {
    next: ['dispatched'],
    labels: {
      dispatched: { label: 'Saiu para entrega', icon: 'local_shipping', variant: 'default' },
    },
  },
  dispatched: {
    next: ['delivered'],
    labels: {
      delivered: { label: 'Entregue', icon: 'check_circle', variant: 'default' },
    },
  },
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

  const [selectedOrder, setSelectedOrder] = useState<TabletOrder | null>(null);

  const tabs: { id: UnifiedTab; label: string; icon: string; count: number; badge?: number }[] = [
    { id: 'comandas', label: 'Comandas', icon: 'Receipt', count: stats.comandas, badge: stats.comandasPending },
    { id: 'delivery', label: 'Delivery', icon: 'Truck', count: stats.delivery, badge: stats.deliveryPending },
    { id: 'ifood', label: 'iFood/Rappi', icon: 'Store', count: stats.ifood, badge: stats.ifoodNew },
  ];

  return (
    <div className="space-y-3">
      {/* Tab cards */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative rounded-2xl p-3 text-left transition-all active:scale-[0.97]",
              activeTab === tab.id
                ? "bg-primary/15 border border-primary/30 shadow-sm"
                : "bg-card border border-border/30"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                activeTab === tab.id ? "bg-primary/20" : "bg-secondary/60"
              )}>
                <AppIcon name={tab.icon} size={16} className={activeTab === tab.id ? "text-primary" : "text-muted-foreground"} />
              </div>
              {(tab.badge ?? 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-destructive text-destructive-foreground">
                  {tab.badge}
                </span>
              )}
            </div>
            <p className={cn(
              "text-xs font-bold truncate",
              activeTab === tab.id ? "text-primary" : "text-foreground"
            )}>{tab.label}</p>
            <p className="text-[10px] text-muted-foreground">{tab.count} pedidos</p>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'comandas' && (
        <TabletOrderList orders={comandas} emptyIcon="QrCode" emptyTitle="Nenhuma comanda" emptySubtitle="Pedidos feitos nas mesas aparecerão aqui" onRetryPDV={onRetryPDV} showTable onOpenOrder={setSelectedOrder} />
      )}

      {activeTab === 'delivery' && (
        <TabletOrderList orders={deliveryOrders} emptyIcon="Bike" emptyTitle="Nenhum pedido delivery" emptySubtitle="Pedidos do cardápio digital aparecerão aqui" onRetryPDV={onRetryPDV} showCustomer onOpenOrder={setSelectedOrder} />
      )}

      {activeTab === 'ifood' && (
        <HubOrderList orders={hubOrders} onUpdateStatus={hubUpdateStatus} getNextStatuses={hubGetNextStatuses} />
      )}

      {/* Order Detail Sheet */}
      <TabletOrderDetailSheet
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdated={(updated) => {
          setSelectedOrder(updated);
        }}
      />
    </div>
  );
}

// ---- Tablet order list ----
function TabletOrderList({ orders, emptyIcon, emptyTitle, emptySubtitle, onRetryPDV, showTable, showCustomer, onOpenOrder }: {
  orders: TabletOrder[];
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
  onRetryPDV?: (id: string) => void;
  showTable?: boolean;
  showCustomer?: boolean;
  onOpenOrder: (order: TabletOrder) => void;
}) {
  if (orders.length === 0) {
    return <EmptyState icon={emptyIcon as any} title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <div className="space-y-2">
      {orders.map(order => {
        const isPending = ['awaiting_confirmation', 'confirmed'].includes(order.status);
        return (
          <button
            key={order.id}
            onClick={() => onOpenOrder(order)}
            className={cn(
              "w-full text-left rounded-2xl bg-card border p-4 space-y-2.5 transition-all active:scale-[0.98]",
              isPending ? "border-warning/40 shadow-sm shadow-warning/10" : "border-border/30"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  isPending ? "bg-warning/15" : "bg-secondary/60"
                )}>
                  <AppIcon name={showTable ? "Hash" : "User"} size={14} className={isPending ? "text-warning" : "text-muted-foreground"} />
                </div>
                <div>
                  {showTable && <p className="text-sm font-bold text-foreground">Mesa {order.table_number}</p>}
                  {showCustomer && (
                    <p className="text-sm font-bold text-foreground">{order.customer_name || 'Cliente'}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-sm font-black text-primary">{formatPrice(order.total)}</p>
                  <Badge className={cn("text-[10px] mt-0.5", statusColor[order.status] || 'bg-secondary')}>
                    {statusLabel[order.status] || order.status}
                  </Badge>
                </div>
                <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
              </div>
            </div>

            {showCustomer && order.customer_phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pl-10">
                <AppIcon name="Phone" size={12} /> {order.customer_phone}
              </p>
            )}

            {order.tablet_order_items && order.tablet_order_items.length > 0 && (
              <div className="bg-secondary/30 rounded-xl p-2.5 space-y-1">
                {order.tablet_order_items.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.quantity}x {item.tablet_products?.name || '?'}</span>
                  </div>
                ))}
                {order.tablet_order_items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{order.tablet_order_items.length - 3} itens</p>
                )}
              </div>
            )}

            {order.error_message && (
              <p className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/5 rounded-lg px-2.5 py-1.5">
                <AppIcon name="AlertCircle" size={12} /> {order.error_message}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- Order Detail Sheet ----
function TabletOrderDetailSheet({ order, onClose, onStatusUpdated }: {
  order: TabletOrder | null;
  onClose: () => void;
  onStatusUpdated: (order: TabletOrder) => void;
}) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const flow = TABLET_STATUS_FLOW[order.status];
  const nextStatuses = flow?.next || [];
  const orderNumber = order.id.slice(0, 4).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false, locale: ptBR });
  const isDelivery = order.source === 'delivery';
  const formattedDate = new Date(order.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'cancelled') updates.error_message = 'Pedido recusado pelo restaurante';

      const { error } = await supabase
        .from('tablet_orders')
        .update(updates)
        .eq('id', order.id);
      if (error) throw error;

      const updated = { ...order, status: newStatus };
      onStatusUpdated(updated);
      toast.success(`Pedido ${statusLabel[newStatus]?.toLowerCase() || 'atualizado'}`);

      if (['delivered', 'cancelled'].includes(newStatus)) {
        setTimeout(onClose, 600);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar pedido');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsappLink = order.customer_phone
    ? `https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`
    : null;

  const googleMapsLink = order.customer_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`
    : null;

  // Calculate items subtotal from items if available
  const items = order.tablet_order_items || [];
  const itemsSubtotal = items.reduce((sum: number, item: any) => {
    const price = item.unit_price || item.total_price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);
  const deliveryFee = order.total - itemsSubtotal;

  return (
    <Sheet open={!!order} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[90dvh] rounded-t-3xl overflow-auto pb-safe">
        <div className="space-y-4 pb-6">
          {/* Header */}
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl font-black">#{orderNumber}</span>
                <Badge className={cn("text-xs font-bold", statusColor[order.status])}>
                  {statusLabel[order.status] || order.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                Recebido há {timeAgo}
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Customer card */}
          <div className="rounded-2xl border border-border/30 bg-secondary/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="person" size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{order.customer_name || 'Cliente'}</p>
                  {isDelivery && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      Entrega
                    </span>
                  )}
                  {!isDelivery && order.table_number > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                      Mesa {order.table_number}
                    </span>
                  )}
                </div>
              </div>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                >
                  <AppIcon name="MessageCircle" size={14} />
                  {order.customer_phone}
                </a>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <AppIcon name="schedule" size={14} />
                {formattedDate}
              </span>
            </div>

            {/* Address with Google Maps */}
            {order.customer_address && (
              <div className="rounded-xl bg-background/60 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AppIcon name="location_on" size={14} className="text-primary" />
                  Endereço:
                </p>
                <p className="text-sm text-muted-foreground pl-5">{order.customer_address}</p>
                {googleMapsLink && (
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-semibold flex items-center gap-1 pl-5 hover:underline"
                  >
                    <AppIcon name="open_in_new" size={12} />
                    Ver no Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-foreground">Itens do pedido</h4>
              <span className="text-[10px] text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-secondary/30 rounded-xl p-4 text-center">Sem itens registrados</p>
            ) : (
              <div className="rounded-2xl border border-border/20 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[40px_1fr_60px_80px] gap-1 px-3 py-2 bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <span>Qtd</span>
                  <span>Itens</span>
                  <span className="text-right">Cód.</span>
                  <span className="text-right">Preços</span>
                </div>
                {items.map((item: any, i: number) => {
                  const itemPrice = item.unit_price || item.total_price || 0;
                  const totalItemPrice = itemPrice * (item.quantity || 1);
                  return (
                    <div key={item.id || i} className="border-t border-border/10">
                      <div className="grid grid-cols-[40px_1fr_60px_80px] gap-1 px-3 py-2.5 items-start">
                        <span className="text-sm font-bold text-foreground">{item.quantity || 1}</span>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.tablet_products?.name || item.name || '?'}</p>
                          {item.notes && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{item.notes}</p>
                          )}
                          {item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {item.selected_options.map((opt: any, j: number) => (
                                <p key={j} className="text-[11px] text-muted-foreground">
                                  {opt.quantity > 1 ? `${opt.quantity} ` : ''}{opt.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground text-right tabular-nums">
                          {item.tablet_products?.codigo_pdv || '—'}
                        </span>
                        <span className="text-sm font-bold text-foreground text-right tabular-nums">
                          {formatPrice(totalItemPrice)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="rounded-2xl bg-secondary/20 border border-border/20 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold tabular-nums">{formatPrice(itemsSubtotal > 0 ? itemsSubtotal : order.total)}</span>
            </div>
            {deliveryFee > 0 && isDelivery && (
              <div className="flex justify-between text-sm">
                <span className="text-primary font-medium">Taxa de entrega:</span>
                <span className="text-primary font-semibold tabular-nums">+{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black pt-2 border-t border-border/20">
              <span>Total:</span>
              <span className="text-primary tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.error_message && order.status !== 'cancelled' && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4">
              <p className="text-xs font-bold text-destructive mb-1 flex items-center gap-1.5">
                <AppIcon name="warning" size={14} /> Erro
              </p>
              <p className="text-sm text-destructive/80">{order.error_message}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {nextStatuses.length > 0 && (
              <div className="flex gap-2">
                {nextStatuses.map(ns => {
                  const config = flow?.labels[ns];
                  if (!config) return null;
                  const isCancel = ns === 'cancelled';
                  return (
                    <Button
                      key={ns}
                      variant={config.variant}
                      className={cn(
                        "flex-1 h-12 rounded-xl font-bold text-sm",
                        !isCancel && "shadow-lg shadow-primary/20"
                      )}
                      onClick={() => handleUpdateStatus(ns)}
                      disabled={updating}
                    >
                      {updating ? (
                        <AppIcon name="Loader2" size={18} className="animate-spin mr-1.5" />
                      ) : (
                        <AppIcon name={config.icon} size={18} className="mr-1.5" />
                      )}
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-xl text-xs"
                onClick={handlePrint}
              >
                <AppIcon name="print" size={16} className="mr-1.5" />
                Imprimir
              </Button>
              {order.status === 'error' && onClose && (
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-xs"
                  onClick={onClose}
                >
                  <AppIcon name="RefreshCw" size={16} className="mr-1.5" />
                  Reenviar
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
          <div key={order.id} className="rounded-2xl bg-card border border-border/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center">
                  <AppIcon name="Store" size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{order.customer_name}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {platformLabel[order.platform] || order.platform}
                    </Badge>
                    {order.platform_display_id && (
                      <span className="text-[10px] text-muted-foreground">#{order.platform_display_id}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary">{formatPrice(order.total)}</p>
                <Badge className={cn("text-[10px] mt-0.5", statusColor[order.status] || 'bg-secondary')}>
                  {statusLabel[order.status] || order.status}
                </Badge>
              </div>
            </div>

            {order.customer_address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pl-10">
                <AppIcon name="MapPin" size={12} /> {order.customer_address}
              </p>
            )}

            {order.notes && (
              <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded-lg px-2.5 py-1.5">{order.notes}</p>
            )}

            {nextStatuses.length > 0 && (
              <div className="flex gap-2 pt-1">
                {nextStatuses.map(ns => (
                  <Button
                    key={ns}
                    size="sm"
                    variant={ns === 'cancelled' ? 'destructive' : 'default'}
                    className="rounded-xl text-xs"
                    onClick={() => onUpdateStatus.mutate({ orderId: order.id, status: ns })}
                    disabled={onUpdateStatus.isPending}
                  >
                    {statusLabel[ns] || ns}
                  </Button>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground pl-10">
              {new Date(order.received_at).toLocaleString('pt-BR')}
            </p>
          </div>
        );
      })}
    </div>
  );
}
