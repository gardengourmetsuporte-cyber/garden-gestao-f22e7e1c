import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { PinDialog } from '@/components/checklists/PinDialog';
import { usePOS } from '@/hooks/usePOS';
import type { PendingOrder } from '@/hooks/usePOS';

interface PendingOrdersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: PendingOrder[];
  loading: boolean;
  onLoadOrder: (order: PendingOrder) => void;
  onChargeOrder?: (order: PendingOrder) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  new: 'Novo',
  accepted: 'Aceito',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  confirmed: 'bg-success/15 text-success border-success/30',
  preparing: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  ready: 'bg-success/15 text-success border-success/30',
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  accepted: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

const SOURCE_CONFIG: Record<string, { icon: string; label: string }> = {
  mesa: { icon: 'UtensilsCrossed', label: 'Mesas' },
  delivery: { icon: 'Truck', label: 'Delivery' },
  ifood: { icon: 'Truck', label: 'iFood' },
  balcao: { icon: 'Store', label: 'Balcão' },
  whatsapp: { icon: 'MessageCircle', label: 'WhatsApp' },
};

function getSourceKey(order: PendingOrder): string {
  const s = order.source?.toLowerCase() || 'outros';
  if (s.includes('ifood')) return 'ifood';
  if (s.includes('delivery') || s.includes('rappi') || s.includes('uber')) return 'delivery';
  if (s.includes('mesa') || s.includes('table')) return 'mesa';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('balcao') || s.includes('balcão')) return 'balcao';
  return s;
}

// ─── Order Detail Sheet (opens when clicking a card) ───
function OrderDetailSheet({
  order,
  onClose,
  onLoadOrder,
  onChargeOrder,
  onDispatch,
  dispatching,
  onUpdateStatus,
  updatingStatus,
}: {
  order: (PendingOrder & { sequentialNumber: number }) | null;
  onClose: () => void;
  onLoadOrder: (order: PendingOrder) => void;
  onChargeOrder?: (order: PendingOrder) => void;
  onDispatch: (order: PendingOrder) => void;
  dispatching: string | null;
  onUpdateStatus: (order: PendingOrder, status: string) => void;
  updatingStatus: string | null;
}) {
  const [showItems, setShowItems] = useState(false);

  if (!order) return null;

  const sourceKey = getSourceKey(order);
  const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
  const isDelivery = sourceKey === 'delivery' || sourceKey === 'ifood' || sourceKey === 'whatsapp';
  const canDispatch = isDelivery && ['confirmed', 'preparing', 'ready', 'pending'].includes(order.status);
  const orderNumber = order.order_number ? `${order.order_number}` : order.id.slice(0, 4).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false, locale: ptBR });
  const formattedDate = format(new Date(order.created_at), "dd/MM, HH:mm");

  const whatsappLink = order.customer_phone
    ? `https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`
    : null;

  const googleMapsLink = order.customer_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`
    : null;

  const itemsSubtotal = order.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <Sheet open={!!order} onOpenChange={(open) => { if (!open) { onClose(); setShowItems(false); } }}>
      <SheetContent side="bottom" className="max-h-[90dvh] rounded-t-3xl flex flex-col p-0">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">

          {/* Compact header: # + status + time + close */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black tracking-tight">#{orderNumber}</span>
            <Badge className={cn("text-[10px] font-bold px-2 py-0.5 border", STATUS_COLORS[order.status] || 'bg-secondary text-muted-foreground')}>
              {STATUS_LABELS[order.status] || order.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              <AppIcon name="Clock" size={11} className="inline mr-0.5 -mt-px" />
              {formattedDate}
            </span>
            <button
              onClick={() => { onClose(); setShowItems(false); }}
              className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            >
              <AppIcon name="X" size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Grouped info card */}
          <div className="card-surface rounded-2xl divide-y divide-border/20 overflow-hidden">
            {/* Customer row */}
            <div className="flex items-center gap-3 p-3.5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}>
                <AppIcon name="User" size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{order.customer_name || 'Cliente'}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {isDelivery ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">Entrega</span>
                  ) : sourceKey === 'mesa' && order.table_number ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">Mesa {order.table_number}</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">{cfg.label}</span>
                  )}
                </div>
              </div>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)' }}
                >
                  <AppIcon name="MessageCircle" size={18} className="text-white" />
                </a>
              )}
            </div>

            {/* Address row (if delivery) */}
            {order.customer_address && (
              <div className="px-3.5 py-3 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #EF4444, #F472B6)' }}>
                  <AppIcon name="MapPin" size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{order.customer_address}</p>
                  {googleMapsLink && (
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-1 hover:underline"
                    >
                      <AppIcon name="ExternalLink" size={11} />
                      Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Items row — collapsible */}
            {!showItems ? (
              <button
                onClick={() => setShowItems(true)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-secondary/30 transition-colors active:scale-[0.99] text-left"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
                  <AppIcon name="ShoppingBag" size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Itens do pedido</p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {formatCurrency(order.total)}
                  </p>
                </div>
                <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
              </button>
            ) : (
              <div className="p-3.5">
                <button onClick={() => setShowItems(false)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2.5">
                  <AppIcon name="ChevronLeft" size={14} />
                  Itens ({order.items.length})
                </button>

                {order.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-secondary/30 rounded-xl p-4 text-center">Sem itens registrados</p>
                ) : (
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-black text-primary w-5 text-center shrink-0">{item.quantity}×</span>
                          <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums shrink-0 ml-2">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 mt-2 border-t border-border/20">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-lg font-black text-primary tabular-nums">{formatCurrency(order.total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-border/20 bg-background/80 backdrop-blur-sm px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
          <div className="flex gap-2.5">
            <Button size="sm" variant="outline" className="flex-1 h-11 rounded-xl text-sm" onClick={() => { onLoadOrder(order); onClose(); setShowItems(false); }}>
              <AppIcon name="Plus" size={16} className="mr-1.5" />
              Adicionar itens
            </Button>
            <Button size="sm" className="flex-1 h-11 rounded-xl text-sm" onClick={() => { if (onChargeOrder) { onChargeOrder(order); } else { onLoadOrder(order); } onClose(); setShowItems(false); }}>
              <AppIcon name="Banknote" size={16} className="mr-1.5" />
              Cobrar
            </Button>
          </div>

          {order.status === 'preparing' && (
            <Button
              size="sm"
              className="w-full h-11 rounded-xl text-sm"
              onClick={() => onUpdateStatus(order, 'ready')}
              disabled={updatingStatus === order.id}
            >
              <AppIcon name={updatingStatus === order.id ? 'Loader2' : 'CheckCircle'} size={18} className={cn("mr-1.5", updatingStatus === order.id && "animate-spin")} />
              Marcar como Pronto
            </Button>
          )}

          {order.status === 'ready' && !isDelivery && (
            <Button
              size="sm"
              className="w-full h-11 rounded-xl text-sm"
              onClick={() => onUpdateStatus(order, 'delivered')}
              disabled={updatingStatus === order.id}
            >
              <AppIcon name={updatingStatus === order.id ? 'Loader2' : 'PackageCheck'} size={18} className={cn("mr-1.5", updatingStatus === order.id && "animate-spin")} />
              Entregue
            </Button>
          )}

          {canDispatch && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-11 rounded-xl text-sm"
              onClick={() => onDispatch(order)}
              disabled={dispatching === order.id}
            >
              <AppIcon name={dispatching === order.id ? 'Loader2' : 'two_wheeler'} size={18} className={cn("mr-1.5", dispatching === order.id && "animate-spin")} />
              Despachar
            </Button>
          )}

          {!['delivered', 'dispatched', 'cancelled'].includes(order.status) && (
            <button
              className="w-full py-2 text-xs text-destructive font-medium flex items-center justify-center gap-1 hover:bg-destructive/5 rounded-xl transition-colors"
              onClick={() => onUpdateStatus(order, 'cancelled')}
              disabled={updatingStatus === order.id}
            >
              <AppIcon name="X" size={13} />
              Cancelar pedido
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Sheet ───
export function PendingOrdersSheet({ open, onOpenChange, orders, loading, onLoadOrder, onChargeOrder }: PendingOrdersSheetProps) {
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<(PendingOrder & { sequentialNumber: number }) | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'blocks'>('blocks');
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const numberedOrders = sortedOrders.map((order, idx) => ({ ...order, sequentialNumber: idx + 1 }));

  const grouped = numberedOrders.reduce((acc, order) => {
    const key = getSourceKey(order);
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {} as Record<string, typeof numberedOrders>);

  const sourceKeys = Object.keys(grouped);
  const filteredGrouped = filterSource ? { [filterSource]: grouped[filterSource] || [] } : grouped;

  const handleDispatch = async (order: PendingOrder) => {
    if (!activeUnitId || !user?.id) return;
    setDispatching(order.id);
    try {
      const { data: address, error: addrError } = await supabase
        .from('delivery_addresses')
        .insert({
          unit_id: activeUnitId,
          customer_name: order.customer_name || 'Cliente',
          full_address: order.customer_address || 'Endereço não informado',
          neighborhood: '',
          city: '',
        })
        .select()
        .single();
      if (addrError) throw addrError;

      const { error: delError } = await supabase
        .from('deliveries')
        .insert({
          unit_id: activeUnitId,
          address_id: address.id,
          status: 'pending',
          total: order.total,
          order_number: order.id.slice(0, 8),
          items_summary: order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
          created_by: user.id,
        });
      if (delError) throw delError;

      await supabase.from('tablet_orders').update({ status: 'dispatched' }).eq('id', order.id);

      toast.success('Entrega despachada!');
      setSelectedOrder(null);
      // Invalidate deliveries cache so the Entregas module shows the new delivery
      queryClient.invalidateQueries({ queryKey: ['deliveries', activeUnitId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-pending-orders', activeUnitId] });
    } catch (err: any) {
      toast.error('Erro ao despachar: ' + (err.message || 'erro'));
    } finally {
      setDispatching(null);
    }
  };

  const handleUpdateStatus = async (order: PendingOrder, newStatus: string) => {
    setUpdatingStatus(order.id);
    try {
      const { error } = await supabase
        .from('tablet_orders')
        .update({ status: newStatus })
        .eq('id', order.id);
      if (error) throw error;
      const labels: Record<string, string> = {
        ready: 'Pedido marcado como pronto!',
        delivered: 'Pedido entregue!',
        cancelled: 'Pedido cancelado.',
      };
      toast.success(labels[newStatus] || 'Status atualizado!');
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + (err.message || 'erro'));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const renderOrderCard = (order: typeof numberedOrders[0], sourceKey: string) => {
    const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };

    return (
      <button
        key={order.id}
        onClick={() => setSelectedOrder(order)}
        className="w-full bg-card border border-border/50 rounded-xl p-3 text-left active:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
              {order.sequentialNumber}
            </span>
            <span className="text-xs font-medium">
              {sourceKey === 'mesa' && order.table_number ? `Mesa ${order.table_number}` : cfg.label}
            </span>
            {order.customer_name && <span className="text-xs text-muted-foreground">• {order.customer_name}</span>}
          </div>
          <Badge variant="outline" className={cn('text-[9px] border', STATUS_COLORS[order.status] || 'bg-secondary text-muted-foreground')}>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{format(new Date(order.created_at), 'HH:mm')}</span>
            {order.items.length > 0 && (
              <span className="truncate max-w-[180px]">• {order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
            )}
          </div>
          <span className="text-sm font-bold text-primary">{formatCurrency(order.total)}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] rounded-t-2xl flex flex-col p-0">
          <div className="px-5 pt-5 pb-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-bold">Pedidos Pendentes ({orders.length})</SheetTitle>
              <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', viewMode === 'blocks' && 'bg-background shadow-sm')}
                  onClick={() => setViewMode('blocks')}
                >
                  <AppIcon name="LayoutGrid" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', viewMode === 'list' && 'bg-background shadow-sm')}
                  onClick={() => setViewMode('list')}
                >
                  <AppIcon name="List" size={16} />
                </Button>
              </div>
            </div>

            {sourceKeys.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setFilterSource(null)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                    !filterSource ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  Todos ({orders.length})
                </button>
                {sourceKeys.map(key => {
                  const cfg = SOURCE_CONFIG[key] || { icon: 'ShoppingBag', label: key };
                  return (
                    <button
                      key={key}
                      onClick={() => setFilterSource(filterSource === key ? null : key)}
                      className={cn(
                        'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5',
                        filterSource === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      <AppIcon name={cfg.icon} size={12} />
                      {cfg.label} ({grouped[key].length})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <p className="text-center text-muted-foreground text-sm py-8">Carregando...</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhum pedido pendente</p>
            ) : viewMode === 'blocks' ? (
              <div className="space-y-4">
                {Object.entries(filteredGrouped).map(([sourceKey, sourceOrders]) => {
                  const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
                  return (
                    <div key={sourceKey}>
                      <div className="flex items-center gap-2 mb-2">
                        <AppIcon name={cfg.icon} size={14} className="text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {sourceOrders.map(order => {
                          const statusColor = STATUS_COLORS[order.status] || 'bg-secondary text-muted-foreground';
                          const isUrgent = order.status === 'pending' || order.status === 'awaiting_confirmation';
                          return (
                            <button
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className={cn(
                                "relative bg-card/80 backdrop-blur-sm border rounded-2xl p-3.5 text-left active:scale-[0.97] transition-all flex flex-col gap-2.5 overflow-hidden",
                                isUrgent ? "border-warning/30 shadow-[0_0_12px_-4px_hsl(var(--warning)/0.2)]" : "border-border/40"
                              )}
                            >
                              {/* Top row: number + status */}
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black",
                                  isUrgent ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"
                                )}>
                                  {order.sequentialNumber}
                                </span>
                                <Badge variant="outline" className={cn('text-[9px] font-semibold border-0 rounded-full px-2.5 py-0.5', statusColor)}>
                                  {STATUS_LABELS[order.status] || order.status}
                                </Badge>
                              </div>

                              {/* Info */}
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {sourceKey === 'mesa' && order.table_number ? `Mesa ${order.table_number}` : cfg.label}
                                </p>
                                {order.customer_name && (
                                  <p className="text-[11px] text-muted-foreground truncate">{order.customer_name}</p>
                                )}
                              </div>

                              {/* Footer: time + price */}
                              <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/20">
                                <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(order.created_at), 'HH:mm')}</span>
                                <span className="text-sm font-black text-primary">{formatCurrency(order.total)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredGrouped).map(([sourceKey, sourceOrders]) => {
                  const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
                  return (
                    <div key={sourceKey}>
                      <div className="flex items-center gap-2 mb-2">
                        <AppIcon name={cfg.icon} size={14} className="text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                      </div>
                      <div className="space-y-1.5">
                        {sourceOrders.map(order => renderOrderCard(order, sourceKey))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail sheet opens on top */}
      <OrderDetailSheet
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onLoadOrder={onLoadOrder}
        onChargeOrder={onChargeOrder}
        onDispatch={handleDispatch}
        dispatching={dispatching}
        onUpdateStatus={handleUpdateStatus}
        updatingStatus={updatingStatus}
      />
    </>
  );
}
