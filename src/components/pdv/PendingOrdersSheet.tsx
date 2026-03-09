import { useState } from 'react';
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
import type { PendingOrder } from '@/hooks/usePOS';

interface PendingOrdersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: PendingOrder[];
  loading: boolean;
  onLoadOrder: (order: PendingOrder) => void;
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
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  preparing: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  ready: 'bg-green-500/15 text-green-400 border-green-500/30',
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
  onDispatch,
  dispatching,
}: {
  order: (PendingOrder & { sequentialNumber: number }) | null;
  onClose: () => void;
  onLoadOrder: (order: PendingOrder) => void;
  onDispatch: (order: PendingOrder) => void;
  dispatching: string | null;
}) {
  const [showItems, setShowItems] = useState(false);

  if (!order) return null;

  const sourceKey = getSourceKey(order);
  const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
  const isDelivery = sourceKey === 'delivery' || sourceKey === 'ifood' || sourceKey === 'whatsapp';
  const canDispatch = isDelivery && ['confirmed', 'preparing', 'ready', 'pending'].includes(order.status);
  const orderNumber = order.id.slice(0, 4).toUpperCase();
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

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black tracking-tight">#{orderNumber}</span>
            <Badge className={cn("text-xs font-bold px-2.5 py-1 border", STATUS_COLORS[order.status] || 'bg-secondary text-muted-foreground')}>
              {STATUS_LABELS[order.status] || order.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">há cerca de {timeAgo}</span>
            <button
              onClick={() => { onClose(); setShowItems(false); }}
              className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <AppIcon name="X" size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Customer card */}
          <div className="rounded-2xl border border-border/30 bg-secondary/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <AppIcon name="User" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-tight">{order.customer_name || 'Cliente'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {isDelivery ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">Entrega</span>
                    ) : sourceKey === 'mesa' && order.table_number ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">Mesa {order.table_number}</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">{cfg.label}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <AppIcon name="Clock" size={11} />
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                >
                  <AppIcon name="MessageCircle" size={18} />
                  <span className="text-[9px] font-bold">WhatsApp</span>
                </a>
              )}
            </div>

            {/* Address */}
            {order.customer_address && (
              <div className="rounded-xl bg-background/60 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AppIcon name="MapPin" size={14} className="text-primary" />
                  Endereço
                </p>
                <p className="text-sm text-muted-foreground pl-5">{order.customer_address}</p>
                {googleMapsLink && (
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-semibold flex items-center gap-1 pl-5 hover:underline"
                  >
                    <AppIcon name="ExternalLink" size={12} />
                    Ver no Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Items section — collapsible */}
          {!showItems ? (
            <button
              onClick={() => setShowItems(true)}
              className="w-full flex items-center justify-between rounded-2xl border border-border/30 bg-secondary/20 p-4 hover:bg-secondary/30 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="ShoppingBag" size={18} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Itens do pedido</p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
              <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <button onClick={() => setShowItems(false)} className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors">
                  <AppIcon name="ChevronLeft" size={16} />
                  Itens do pedido
                </button>
                <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {order.items.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-secondary/30 rounded-xl p-4 text-center">Sem itens registrados</p>
              ) : (
                <div className="rounded-2xl border border-border/20 overflow-hidden">
                  <div className="grid grid-cols-[36px_1fr_76px] gap-1 px-3.5 py-2.5 bg-secondary/40 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    <span>Qtd</span>
                    <span>Item</span>
                    <span className="text-right">Preço</span>
                  </div>
                  {order.items.map((item, i) => (
                    <div key={i} className="border-t border-border/10">
                      <div className="grid grid-cols-[36px_1fr_76px] gap-1 px-3.5 py-3 items-start">
                        <span className="text-sm font-black text-foreground">{item.quantity}</span>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <span className="text-sm font-bold text-foreground text-right tabular-nums">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="rounded-2xl bg-secondary/20 border border-border/20 p-4 space-y-2 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(itemsSubtotal > 0 ? itemsSubtotal : order.total)}</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-2.5 border-t border-border/20">
                  <span>Total</span>
                  <span className="text-primary tabular-nums">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-border/20 bg-background/80 backdrop-blur-sm px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-3">
          <Button size="sm" variant="outline" className="flex-1 h-11 rounded-xl text-sm" onClick={() => { onLoadOrder(order); onClose(); setShowItems(false); }}>
            <AppIcon name="Banknote" size={16} className="mr-1.5" />
            Cobrar
          </Button>
          {canDispatch && (
            <Button
              size="sm"
              className="flex-1 h-11 rounded-xl text-sm"
              onClick={() => onDispatch(order)}
              disabled={dispatching === order.id}
            >
              <AppIcon name={dispatching === order.id ? 'Loader2' : 'Bike'} size={16} className={cn("mr-1.5", dispatching === order.id && "animate-spin")} />
              Despachar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Sheet ───
export function PendingOrdersSheet({ open, onOpenChange, orders, loading, onLoadOrder }: PendingOrdersSheetProps) {
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<(PendingOrder & { sequentialNumber: number }) | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const { user } = useAuth();
  const { activeUnitId } = useUnit();

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
    } catch (err: any) {
      toast.error('Erro ao despachar: ' + (err.message || 'erro'));
    } finally {
      setDispatching(null);
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
        onDispatch={handleDispatch}
        dispatching={dispatching}
      />
    </>
  );
}
