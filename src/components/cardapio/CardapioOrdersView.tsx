import { useState, useMemo, useCallback } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { HubOrder } from '@/hooks/useDeliveryHub';

/* ─── Types ─── */
interface OrderItem {
  id: string;
  created_at: string;
  total: number;
  status: string;
  source?: string;
  table_number?: number;
  customer_name?: string;
  tablet_order_items?: any[];
}

interface Props {
  orders: OrderItem[];
  hubOrders?: HubOrder[];
}

/* ─── Status ─── */
const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; pulse?: boolean }> = {
  draft: { label: 'Rascunho', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: 'FileEdit' },
  awaiting_confirmation: { label: 'Aguardando', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: 'Clock', pulse: true },
  pending: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: 'Clock', pulse: true },
  confirmed: { label: 'Confirmado', color: 'text-sky-400', bg: 'bg-sky-500/15', icon: 'CheckCircle2' },
  new: { label: 'Novo', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: 'Bell', pulse: true },
  accepted: { label: 'Aceito', color: 'text-sky-400', bg: 'bg-sky-500/15', icon: 'CheckCircle2' },
  preparing: { label: 'Preparando', color: 'text-orange-400', bg: 'bg-orange-500/15', icon: 'Flame', pulse: true },
  ready: { label: 'Pronto', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: 'PackageCheck' },
  dispatched: { label: 'Despachado', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: 'Truck' },
  delivered: { label: 'Entregue', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: 'CircleCheckBig' },
  sent_to_pdv: { label: 'Enviado PDV', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: 'CircleCheckBig' },
  cancelled: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/12', icon: 'XCircle' },
  error: { label: 'Erro', color: 'text-red-400', bg: 'bg-red-500/12', icon: 'AlertTriangle' },
};

/* ─── Channels ─── */
type Channel = 'todos' | 'delivery' | 'mesa' | 'balcao' | 'qrcode' | 'ifood';

const CHANNELS: { id: Channel; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos', icon: 'LayoutGrid' },
  { id: 'delivery', label: 'Delivery', icon: 'Truck' },
  { id: 'mesa', label: 'Mesa', icon: 'Utensils' },
  { id: 'balcao', label: 'Balcão', icon: 'Store' },
  { id: 'ifood', label: 'iFood', icon: 'ShoppingBag' },
];

/* ─── Helpers ─── */
function normalizeHubOrders(hubOrders: HubOrder[]): OrderItem[] {
  return hubOrders.map(o => ({
    id: o.id,
    created_at: o.received_at || o.created_at,
    total: o.total,
    status: o.status,
    source: 'ifood',
    customer_name: o.customer_name,
    table_number: 0,
  }));
}

function getOrderChannel(order: OrderItem): Channel {
  if (order.source === 'ifood') return 'ifood';
  if (order.source === 'delivery') return 'delivery';
  if (order.source === 'balcao') return 'balcao';
  if (order.source === 'qrcode') return 'balcao';
  if ((order.table_number ?? 0) > 0) return 'mesa';
  return 'balcao';
}

function getSourceIcon(ch: Channel) {
  switch (ch) {
    case 'ifood': return 'ShoppingBag';
    case 'delivery': return 'Truck';
    case 'mesa': return 'Utensils';
    default: return 'Store';
  }
}

function getSourceLabel(order: OrderItem) {
  if (order.source === 'ifood') return order.customer_name || 'iFood';
  if (order.source === 'delivery') return 'Delivery';
  if ((order.table_number ?? 0) > 0) return `Mesa ${order.table_number}`;
  if (order.customer_name) return order.customer_name;
  return 'Balcão';
}

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const getStatus = (s: string) => STATUS_CONFIG[s] || { label: s, color: 'text-muted-foreground', bg: 'bg-muted/50', icon: 'HelpCircle' };

const CHANNEL_ACCENT: Record<Channel, string> = {
  todos: 'border-l-primary',
  delivery: 'border-l-blue-500',
  mesa: 'border-l-amber-500',
  balcao: 'border-l-emerald-500',
  qrcode: 'border-l-purple-500',
  ifood: 'border-l-red-500',
};

const isActive = (status: string) => ['awaiting_confirmation', 'pending', 'confirmed', 'new', 'accepted', 'preparing', 'ready'].includes(status);
const isDone = (status: string) => ['delivered', 'sent_to_pdv', 'dispatched'].includes(status);
const isError = (status: string) => ['cancelled', 'error'].includes(status);

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/* ─── Main Component ─── */
export function CardapioOrdersView({ orders, hubOrders = [] }: Props) {
  const [channel, setChannel] = useState<Channel>('todos');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const allOrders = useMemo(() => {
    const normalized = normalizeHubOrders(hubOrders);
    return [...orders, ...normalized];
  }, [orders, hubOrders]);

  const today = new Date().toISOString().slice(0, 10);

  const channelCounts = useMemo(() => {
    const counts: Record<Channel, number> = { todos: 0, delivery: 0, mesa: 0, balcao: 0, qrcode: 0, ifood: 0 };
    const todayOrders = allOrders.filter(o => o.created_at.slice(0, 10) === today);
    counts.todos = todayOrders.length;
    todayOrders.forEach(o => { counts[getOrderChannel(o)]++; });
    return counts;
  }, [allOrders, today]);

  const filtered = useMemo(() => {
    const sorted = [...allOrders].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (channel === 'todos') return sorted;
    return sorted.filter(o => getOrderChannel(o) === channel);
  }, [allOrders, channel]);

  // Split: active orders (in progress) vs completed
  const activeOrders = filtered.filter(o => isActive(o.status));
  const doneOrders = filtered.filter(o => isDone(o.status));
  const errorOrders = filtered.filter(o => isError(o.status));
  const otherOrders = filtered.filter(o => !isActive(o.status) && !isDone(o.status) && !isError(o.status));

  const stats = useMemo(() => {
    const todayAll = allOrders.filter(o => o.created_at.slice(0, 10) === today);
    const scoped = channel === 'todos' ? todayAll : todayAll.filter(o => getOrderChannel(o) === channel);
    return {
      active: scoped.filter(o => isActive(o.status)).length,
      done: scoped.filter(o => isDone(o.status)).length,
      errors: scoped.filter(o => isError(o.status)).length,
      revenue: scoped.filter(o => !isError(o.status)).reduce((sum, o) => sum + o.total, 0),
    };
  }, [allOrders, channel, today]);

  const handleOrderClick = useCallback((order: OrderItem) => {
    setSelectedOrder(order);
  }, []);

  return (
    <div className="px-4 py-3 lg:px-6 space-y-4">
      {/* ─── Channel Pills ─── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
        {CHANNELS.map(ch => {
          const active = channel === ch.id;
          const count = channelCounts[ch.id];
          return (
            <button
              key={ch.id}
              onClick={() => setChannel(ch.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 touch-manipulation",
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                  : "bg-card/80 border border-border/30 text-muted-foreground active:scale-95"
              )}
            >
              <AppIcon name={ch.icon} size={14} />
              {ch.label}
              {count > 0 && (
                <span className={cn(
                  "min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-extrabold rounded-full",
                  active ? "bg-white/25 text-primary-foreground" : "bg-primary/15 text-primary"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Live Stats Bar ─── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20 p-3 text-center">
          {stats.active > 0 && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          <p className="text-2xl font-black tabular-nums text-amber-400">{stats.active}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70 mt-0.5">Em preparo</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/20 p-3 text-center">
          <p className="text-2xl font-black tabular-nums text-emerald-400">{stats.done}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/70 mt-0.5">Concluídos</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-lg font-black tabular-nums text-primary">{formatPrice(stats.revenue)}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70 mt-0.5">Faturamento</p>
        </div>
      </div>

      {/* ─── Orders Feed ─── */}
      {filtered.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="Nenhum pedido" subtitle="Os pedidos aparecerão aqui em tempo real" />
      ) : (
        <div className="space-y-5">
          {/* Active orders — priority section */}
          {activeOrders.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-400">
                  Em andamento ({activeOrders.length})
                </p>
              </div>
              <div className="space-y-2">
                {activeOrders.map((order, i) => (
                  <TimelineOrderCard
                    key={order.id}
                    order={order}
                    index={i}
                    onClick={() => handleOrderClick(order)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed orders */}
          {doneOrders.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <AppIcon name="CircleCheckBig" size={12} className="text-emerald-400" />
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400/70">
                  Concluídos ({doneOrders.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {doneOrders.slice(0, 10).map((order, i) => (
                  <CompactOrderCard
                    key={order.id}
                    order={order}
                    index={i}
                    onClick={() => handleOrderClick(order)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Errors/Cancelled */}
          {errorOrders.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <AppIcon name="XCircle" size={12} className="text-red-400/70" />
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-red-400/60">
                  Cancelados ({errorOrders.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {errorOrders.slice(0, 5).map((order, i) => (
                  <CompactOrderCard
                    key={order.id}
                    order={order}
                    index={i}
                    onClick={() => handleOrderClick(order)}
                    dimmed
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other (drafts, etc) */}
          {otherOrders.length > 0 && (
            <section className="space-y-1.5">
              {otherOrders.slice(0, 10).map((order, i) => (
                <CompactOrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  onClick={() => handleOrderClick(order)}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {/* ─── Order Detail Sheet ─── */}
      <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}

/* ─── Timeline Order Card (Active) ─── */
function TimelineOrderCard({ order, index, onClick }: { order: OrderItem; index: number; onClick: () => void }) {
  const st = getStatus(order.status);
  const ch = getOrderChannel(order);
  const items = order.tablet_order_items || [];
  const accent = CHANNEL_ACCENT[ch];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-200",
        "active:scale-[0.98] hover:border-border/60 hover:shadow-lg hover:shadow-black/5",
        "border-l-[3px]", accent,
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", st.bg)}>
              <AppIcon name={st.icon} size={18} className={st.color} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold text-foreground truncate">{getSourceLabel(order)}</p>
                <span className="text-[10px] text-muted-foreground/60 shrink-0">{timeAgo(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {st.pulse && <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", st.color.replace('text-', 'bg-'))} />}
                <span className={cn("text-[11px] font-bold uppercase tracking-wide", st.color)}>
                  {st.label}
                </span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground/60">
                  {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          <p className="text-base font-black text-foreground tabular-nums shrink-0">
            {formatPrice(order.total)}
          </p>
        </div>
      </div>

      {/* Items Preview */}
      {items.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {items.slice(0, 3).map((item: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-lg">
                <span className="font-bold text-foreground/70">{item.quantity}×</span>
                <span className="truncate max-w-[140px]">{item.tablet_products?.name || '?'}</span>
              </span>
            ))}
            {items.length > 3 && (
              <span className="text-[11px] text-muted-foreground/50 px-2 py-1">+{items.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Progress Steps (for active orders) */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1">
          {STATUS_FLOW.map((step, i) => {
            const currentIdx = STATUS_FLOW.indexOf(mapToFlowStatus(order.status));
            const filled = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step} className="flex items-center flex-1 gap-1">
                <div className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  filled
                    ? isCurrent ? "bg-primary animate-pulse" : "bg-primary/60"
                    : "bg-secondary/60"
                )} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-muted-foreground/40 uppercase">Pendente</span>
          <span className="text-[8px] text-muted-foreground/40 uppercase">Entregue</span>
        </div>
      </div>
    </button>
  );
}

function mapToFlowStatus(status: string): typeof STATUS_FLOW[number] {
  if (['awaiting_confirmation', 'pending', 'confirmed', 'new', 'accepted'].includes(status)) return 'pending';
  if (status === 'preparing') return 'preparing';
  if (status === 'ready') return 'ready';
  return 'delivered';
}

/* ─── Compact Order Card (Done/Cancelled) ─── */
function CompactOrderCard({ order, index, onClick, dimmed }: { order: OrderItem; index: number; onClick: () => void; dimmed?: boolean }) {
  const st = getStatus(order.status);
  const ch = getOrderChannel(order);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/30",
        "transition-all duration-150 active:scale-[0.98]",
        dimmed && "opacity-50",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", st.bg)}>
        <AppIcon name={getSourceIcon(ch)} size={14} className={st.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{getSourceLabel(order)}</p>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-bold uppercase", st.color)}>{st.label}</span>
          <span className="text-[10px] text-muted-foreground/40">·</span>
          <span className="text-[10px] text-muted-foreground/60">
            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <p className="text-sm font-bold text-foreground/80 tabular-nums shrink-0">{formatPrice(order.total)}</p>
      <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/30 shrink-0" />
    </button>
  );
}

/* ─── Order Detail Sheet ─── */
function OrderDetailSheet({ order, onClose }: { order: OrderItem | null; onClose: () => void }) {
  if (!order) return null;
  const st = getStatus(order.status);
  const ch = getOrderChannel(order);
  const items = order.tablet_order_items || [];

  return (
    <Sheet open={!!order} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", st.bg)}>
                <AppIcon name={st.icon} size={20} className={st.color} />
              </div>
              <div>
                <p className="text-lg font-bold">{getSourceLabel(order)}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  {new Date(order.created_at).toLocaleString('pt-BR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black tabular-nums">{formatPrice(order.total)}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Status Badge */}
        <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl mb-4", st.bg)}>
          {st.pulse && <div className={cn("w-2 h-2 rounded-full animate-pulse", st.color.replace('text-', 'bg-'))} />}
          <AppIcon name={st.icon} size={16} className={st.color} />
          <span className={cn("text-sm font-bold", st.color)}>{st.label}</span>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5">
            {STATUS_FLOW.map((step, i) => {
              const currentIdx = STATUS_FLOW.indexOf(mapToFlowStatus(order.status));
              const filled = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const stepLabel = step === 'pending' ? 'Recebido' : step === 'preparing' ? 'Preparando' : step === 'ready' ? 'Pronto' : 'Entregue';
              return (
                <div key={step} className="flex-1 text-center">
                  <div className={cn(
                    "h-1.5 rounded-full mb-1.5 transition-all",
                    filled ? isCurrent ? "bg-primary" : "bg-primary/60" : "bg-secondary/60"
                  )} />
                  <span className={cn(
                    "text-[9px] font-bold uppercase",
                    filled ? "text-primary" : "text-muted-foreground/40"
                  )}>
                    {stepLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="space-y-2 mb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Itens do pedido</p>
            <div className="space-y-1.5">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                    {item.quantity}
                  </span>
                  <p className="flex-1 text-sm font-medium text-foreground">{item.tablet_products?.name || 'Item'}</p>
                  {item.unit_price && (
                    <p className="text-sm font-semibold text-muted-foreground tabular-nums">
                      {formatPrice(item.unit_price * item.quantity)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Canal</span>
            <div className="flex items-center gap-1.5">
              <AppIcon name={getSourceIcon(ch)} size={14} className="text-foreground" />
              <span className="text-sm font-semibold">{ch === 'ifood' ? 'iFood' : ch === 'delivery' ? 'Delivery' : ch === 'mesa' ? 'Mesa' : 'Balcão'}</span>
            </div>
          </div>
          {order.customer_name && (
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="text-sm font-semibold">{order.customer_name}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-black">{formatPrice(order.total)}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={onClose}>
          Fechar
        </Button>
      </SheetContent>
    </Sheet>
  );
}
