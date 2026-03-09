import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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

type ViewMode = 'list' | 'blocks';

function getSourceKey(order: PendingOrder): string {
  const s = order.source?.toLowerCase() || 'outros';
  if (s.includes('ifood')) return 'ifood';
  if (s.includes('delivery') || s.includes('rappi') || s.includes('uber')) return 'delivery';
  if (s.includes('mesa') || s.includes('table')) return 'mesa';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('balcao') || s.includes('balcão')) return 'balcao';
  return s;
}

export function PendingOrdersSheet({ open, onOpenChange, orders, loading, onLoadOrder }: PendingOrdersSheetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      // Create delivery address
      const { data: address, error: addrError } = await supabase
        .from('delivery_addresses')
        .insert({
          unit_id: activeUnitId,
          customer_name: order.customer_name || 'Cliente',
          full_address: (order as any).customer_address || 'Endereço não informado',
          neighborhood: '',
          city: '',
        })
        .select()
        .single();
      if (addrError) throw addrError;

      // Create delivery
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

      // Update order status to dispatched
      await supabase.from('tablet_orders').update({ status: 'dispatched' }).eq('id', order.id);

      toast.success('Entrega despachada!');
      setExpandedId(null);
    } catch (err: any) {
      toast.error('Erro ao despachar: ' + (err.message || 'erro'));
    } finally {
      setDispatching(null);
    }
  };

  const isDeliverySource = (order: PendingOrder) => {
    const s = getSourceKey(order);
    return s === 'delivery' || s === 'ifood' || s === 'whatsapp';
  };

  const renderOrderCard = (order: typeof numberedOrders[0], sourceKey: string) => {
    const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
    const isExpanded = expandedId === order.id;
    const canDispatch = isDeliverySource(order) && ['confirmed', 'preparing', 'ready', 'pending'].includes(order.status);

    return (
      <div key={order.id} className="bg-card border border-border/50 rounded-xl overflow-hidden transition-all">
        <button
          onClick={() => setExpandedId(isExpanded ? null : order.id)}
          className="w-full p-3 text-left active:bg-secondary/30 transition-colors"
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

        {/* Expanded actions */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-2">
            {order.items.length > 0 && (
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                {order.items.map((item, i) => (
                  <p key={i}>{item.quantity}x {item.name} — {formatCurrency(item.unit_price * item.quantity)}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => onLoadOrder(order)}>
                <AppIcon name="Banknote" size={14} className="mr-1" />
                Cobrar
              </Button>
              {canDispatch && (
                <Button
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  onClick={() => handleDispatch(order)}
                  disabled={dispatching === order.id}
                >
                  <AppIcon name={dispatching === order.id ? 'Loader2' : 'Bike'} size={14} className={cn("mr-1", dispatching === order.id && "animate-spin")} />
                  Despachar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
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
  );
}
