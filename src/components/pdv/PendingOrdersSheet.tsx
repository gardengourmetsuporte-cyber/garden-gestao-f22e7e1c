import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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

  // Sort orders by created_at ascending for logical numbering
  const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Assign sequential numbers
  const numberedOrders = sortedOrders.map((order, idx) => ({
    ...order,
    sequentialNumber: idx + 1,
  }));

  // Group by source
  const grouped = numberedOrders.reduce((acc, order) => {
    const key = getSourceKey(order);
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {} as Record<string, typeof numberedOrders>);

  // Get source keys present
  const sourceKeys = Object.keys(grouped);

  // Filter
  const filteredGrouped = filterSource
    ? { [filterSource]: grouped[filterSource] || [] }
    : grouped;

  const filteredOrders = filterSource
    ? numberedOrders.filter(o => getSourceKey(o) === filterSource)
    : numberedOrders;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-2xl flex flex-col p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">Pedidos Pendentes ({orders.length})</SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', viewMode === 'blocks' && 'bg-secondary')}
                onClick={() => setViewMode('blocks')}
              >
                <AppIcon name="LayoutGrid" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', viewMode === 'list' && 'bg-secondary')}
                onClick={() => setViewMode('list')}
              >
                <AppIcon name="List" size={16} />
              </Button>
            </div>
          </div>

          {/* Source filter chips */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Carregando...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhum pedido pendente</p>
          ) : viewMode === 'blocks' ? (
            /* BLOCK VIEW - grouped by source */
            <div className="space-y-5">
              {Object.entries(filteredGrouped).map(([sourceKey, sourceOrders]) => {
                const cfg = SOURCE_CONFIG[sourceKey] || { icon: 'ShoppingBag', label: sourceKey };
                return (
                  <div key={sourceKey}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <AppIcon name={cfg.icon} size={14} className="text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground/60">({sourceOrders.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {sourceOrders.map(order => (
                        <button
                          key={order.id}
                          onClick={() => onLoadOrder(order)}
                          className="bg-card border border-border/50 rounded-xl p-3 text-left hover:border-primary/30 transition-all active:scale-[0.97] relative overflow-hidden"
                        >
                          {/* Sequential number badge */}
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{order.sequentialNumber}</span>
                          </div>

                          {/* Source + customer */}
                          <div className="flex items-center gap-1.5 mb-1.5 pr-8">
                            <span className="text-xs font-bold text-foreground truncate">
                              {sourceKey === 'mesa' && order.table_number ? `Mesa ${order.table_number}` : cfg.label}
                            </span>
                          </div>

                          {order.customer_name && (
                            <p className="text-[11px] text-muted-foreground truncate mb-1">• {order.customer_name}</p>
                          )}

                          {/* Time */}
                          <p className="text-[10px] text-muted-foreground mb-2">
                            {format(new Date(order.created_at), 'HH:mm')}
                          </p>

                          {/* Items preview */}
                          {order.items.length > 0 && (
                            <div className="text-[10px] text-muted-foreground/80 mb-2 space-y-0.5">
                              {order.items.slice(0, 2).map((item, i) => (
                                <p key={i} className="truncate">{item.quantity}x {item.name}</p>
                              ))}
                              {order.items.length > 2 && <p className="text-muted-foreground/50">+{order.items.length - 2} itens</p>}
                            </div>
                          )}

                          {/* Status + price */}
                          <div className="flex items-center justify-between mt-auto">
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] px-1.5 py-0.5 border', STATUS_COLORS[order.status] || 'bg-secondary text-muted-foreground')}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                            <span className="text-sm font-bold text-primary">{formatCurrency(order.total)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW - grouped by source */
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
                      {sourceOrders.map(order => (
                        <button
                          key={order.id}
                          onClick={() => onLoadOrder(order)}
                          className="w-full bg-card border border-border/50 rounded-xl p-3 text-left hover:border-primary/30 transition-all"
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
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] border', STATUS_COLORS[order.status] || 'bg-secondary text-muted-foreground')}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{format(new Date(order.created_at), 'HH:mm')}</span>
                              {order.items.length > 0 && (
                                <span>• {order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-primary">{formatCurrency(order.total)}</span>
                          </div>
                        </button>
                      ))}
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
