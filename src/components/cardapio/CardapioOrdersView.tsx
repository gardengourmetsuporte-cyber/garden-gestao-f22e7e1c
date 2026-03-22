import { useState, useMemo } from 'react';
import { startOfDay, subDays, isWithinInterval, format, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { formatCurrency } from '@/lib/format';
import type { HubOrder } from '@/hooks/useDeliveryHub';

/* ─── Types ─── */
interface OrderItem {
  id: string;
  created_at: string;
  total: number;
  status: string;
  source?: string;
  table_number?: number;
  comanda_number?: number;
  customer_name?: string;
  tablet_order_items?: any[];
}

interface Props {
  orders: OrderItem[];
  hubOrders?: HubOrder[];
}

/* ─── Status ─── */
const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'] as const;

const STATUS_CONFIG: Record<string, { label: string; icon: string }> = {
  draft: { label: 'Rascunho', icon: 'FileText' },
  awaiting_confirmation: { label: 'Aguardando', icon: 'Clock' },
  pending: { label: 'Pendente', icon: 'Clock' },
  confirmed: { label: 'Confirmado', icon: 'CheckCircle2' },
  new: { label: 'Novo', icon: 'Bell' },
  accepted: { label: 'Aceito', icon: 'CheckCircle2' },
  preparing: { label: 'Preparando', icon: 'Flame' },
  ready: { label: 'Pronto', icon: 'PackageCheck' },
  dispatched: { label: 'Despachado', icon: 'Truck' },
  delivered: { label: 'Entregue', icon: 'CheckCircle2' },
  sent_to_pdv: { label: 'Enviado PDV', icon: 'CheckCircle2' },
  cancelled: { label: 'Cancelado', icon: 'XCircle' },
  error: { label: 'Erro', icon: 'AlertTriangle' },
};

/* ─── Channels ─── */
type Channel = 'todos' | 'delivery' | 'comanda' | 'balcao' | 'ifood';

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'comanda', label: 'Comanda' },
  { id: 'balcao', label: 'Balcão' },
  { id: 'ifood', label: 'iFood' },
];

/* ─── Operational Groups ─── */
type OpGroup = 'novos' | 'emPreparo' | 'prontos' | 'entregues' | 'cancelados';

const OP_GROUPS: { id: OpGroup; label: string; icon: string }[] = [
  { id: 'novos', label: 'Novos', icon: 'Bell' },
  { id: 'emPreparo', label: 'Em Preparo', icon: 'Flame' },
  { id: 'prontos', label: 'Prontos', icon: 'PackageCheck' },
  { id: 'entregues', label: 'Entregues', icon: 'CheckCircle2' },
  { id: 'cancelados', label: 'Cancelados', icon: 'XCircle' },
];

function getOpGroup(status: string): OpGroup {
  if (['pending', 'awaiting_confirmation', 'new', 'confirmed', 'accepted'].includes(status)) return 'novos';
  if (status === 'preparing') return 'emPreparo';
  if (status === 'ready') return 'prontos';
  if (['delivered', 'sent_to_pdv', 'dispatched'].includes(status)) return 'entregues';
  if (['cancelled', 'error'].includes(status)) return 'cancelados';
  return 'novos';
}

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
  if (order.source === 'balcao' || order.source === 'qrcode') return 'balcao';
  if ((order.comanda_number ?? 0) > 0 || (order.table_number ?? 0) > 0) return 'comanda';
  return 'balcao';
}

function getSourceLabel(order: OrderItem) {
  if (order.source === 'ifood') return order.customer_name || 'iFood';
  if (order.source === 'delivery') return order.customer_name || 'Delivery';
  if ((order.comanda_number ?? 0) > 0) return `Comanda ${order.comanda_number}`;
  if ((order.table_number ?? 0) > 0) return `Mesa ${order.table_number}`;
  if (order.customer_name) return order.customer_name;
  return 'Balcão';
}

function getSourceIcon(ch: Channel) {
  switch (ch) {
    case 'ifood': return 'ShoppingBag';
    case 'delivery': return 'Truck';
    case 'comanda': return 'Receipt';
    default: return 'Storefront';
  }
}

const getStatus = (s: string) => STATUS_CONFIG[s] || { label: s, icon: 'Info' };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function mapToFlowStatus(status: string): typeof STATUS_FLOW[number] {
  if (['awaiting_confirmation', 'pending', 'confirmed', 'new', 'accepted'].includes(status)) return 'pending';
  if (status === 'preparing') return 'preparing';
  if (status === 'ready') return 'ready';
  return 'delivered';
}

/* ─── Main Component ─── */
export function CardapioOrdersView({ orders, hubOrders = [] }: Props) {
  const [channel, setChannel] = useState<Channel>('todos');
  const [dateFilter, setDateFilter] = useState<'hoje' | 'ontem' | 'semana'>('hoje');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const selectedDate = useMemo(() => {
    if (dateFilter === 'ontem') return subDays(new Date(), 1);
    return new Date();
  }, [dateFilter]);

  const allOrders = useMemo(() => {
    const normalized = normalizeHubOrders(hubOrders);
    return [...orders, ...normalized];
  }, [orders, hubOrders]);

  // Filter by selected date
  const dateRange = useMemo(() => {
    if (dateFilter === 'semana') {
      const end = new Date();
      end.setDate(end.getDate() + 1);
      return { start: startOfDay(subDays(new Date(), 6)), end };
    }
    const start = startOfDay(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }, [selectedDate, dateFilter]);

  const channelCounts = useMemo(() => {
    const counts: Record<Channel, number> = { todos: 0, delivery: 0, comanda: 0, balcao: 0, ifood: 0 };
    const rangeOrders = allOrders.filter(o => {
      const d = new Date(o.created_at);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
    counts.todos = rangeOrders.length;
    rangeOrders.forEach(o => { counts[getOrderChannel(o)]++; });
    return counts;
  }, [allOrders, dateRange]);

  const filtered = useMemo(() => {
    let result = allOrders.filter(o => {
      const d = new Date(o.created_at);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
    if (channel !== 'todos') result = result.filter(o => getOrderChannel(o) === channel);
    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [allOrders, channel, dateRange]);

  const grouped = useMemo(() => {
    const groups: Record<OpGroup, OrderItem[]> = {
      novos: [], emPreparo: [], prontos: [], entregues: [], cancelados: [],
    };
    filtered.forEach(o => { groups[getOpGroup(o.status)].push(o); });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const active = grouped.novos.length + grouped.emPreparo.length + grouped.prontos.length;
    const done = grouped.entregues.length;
    const revenue = filtered.filter(o => getOpGroup(o.status) !== 'cancelados').reduce((sum, o) => sum + o.total, 0);
    return { active, done, revenue };
  }, [grouped, filtered]);


  return (
    <div className="space-y-0">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-2 pb-3 space-y-3">
        {/* Date Filter Chips */}
        <div className="flex items-center gap-2 px-4">
          {([
            { key: 'hoje' as const, label: 'Hoje' },
            { key: 'ontem' as const, label: 'Ontem' },
            { key: 'semana' as const, label: 'Últimos 7 dias' },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.96]",
                dateFilter === f.key
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/40 text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4">
          {CHANNELS.map(ch => {
            const active = channel === ch.id;
            const count = channelCounts[ch.id];
            return (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-[0.97] outline-none focus-visible:ring-0",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary/40 text-muted-foreground"
                )}
              >
                {ch.label}
                {count > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full",
                    active ? "bg-primary/25 text-primary" : "bg-muted/60 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 py-3 lg:px-6 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Ativos', value: String(stats.active), highlight: stats.active > 0 },
            { label: 'Entregues', value: String(stats.done), highlight: false },
            { label: 'Faturamento', value: formatCurrency(stats.revenue), highlight: false },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-secondary/50 rounded-xl p-3 text-center"
            >
              {stat.highlight && (
                <div className="flex justify-center mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              )}
              <p className="text-xl font-extrabold text-foreground tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                {stat.value}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Orders Feed */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="ShoppingBag"
            title="Nenhum pedido"
            subtitle={isDateToday(selectedDate)
              ? 'Os pedidos aparecerão aqui em tempo real'
              : `Sem pedidos em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
            }
          />
        ) : (
          <div className="space-y-5">
            {OP_GROUPS.map(group => {
              const items = grouped[group.id];
              if (items.length === 0) return null;

              const isCollapsible = group.id === 'entregues' || group.id === 'cancelados';
              const defaultOpen = !isCollapsible || items.length <= 3;

              return (
                <OrderSection
                  key={group.id}
                  group={group}
                  items={items}
                  collapsible={isCollapsible}
                  defaultOpen={defaultOpen}
                  onOrderClick={setSelectedOrder}
                />
              );
            })}
          </div>
        )}

        {/* Order Detail Sheet */}
        <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </div>
    </div>
  );
}

/* ─── Order Section ─── */
function OrderSection({
  group,
  items,
  collapsible,
  defaultOpen,
  onOrderClick,
}: {
  group: typeof OP_GROUPS[number];
  items: OrderItem[];
  collapsible: boolean;
  defaultOpen: boolean;
  onOrderClick: (o: OrderItem) => void;
}) {
  const isActive = group.id === 'novos' || group.id === 'emPreparo' || group.id === 'prontos';

  const header = (
    <div className="flex items-center gap-2">
      {isActive && group.id !== 'prontos'
        ? <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        : <AppIcon name={group.icon} size={12} className="text-muted-foreground" />
      }
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {group.label}
        <span className="ml-1.5 text-foreground">{items.length}</span>
      </p>
      {collapsible && (
        <AppIcon name="ChevronDown" size={12} className="ml-auto text-muted-foreground/40 transition-transform group-data-[state=open]:rotate-180" />
      )}
    </div>
  );

  const content = (
    <div className="space-y-2">
      {items.map((order, i) =>
        isActive ? (
          <ActiveOrderCard key={order.id} order={order} index={i} onClick={() => onOrderClick(order)} />
        ) : (
          <CompactOrderCard key={order.id} order={order} index={i} onClick={() => onOrderClick(order)} dimmed={group.id === 'cancelados'} />
        )
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Collapsible defaultOpen={defaultOpen} className="group">
        <CollapsibleTrigger className="w-full text-left mb-2">{header}</CollapsibleTrigger>
        <CollapsibleContent>{content}</CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <section className="space-y-2">
      {header}
      {content}
    </section>
  );
}

/* ─── Active Order Card ─── */
function ActiveOrderCard({ order, index, onClick }: { order: OrderItem; index: number; onClick: () => void }) {
  const st = getStatus(order.status);
  const ch = getOrderChannel(order);
  const items = order.tablet_order_items || [];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-card p-4 transition-all active:scale-[0.98] animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center shrink-0">
            <AppIcon name={getSourceIcon(ch)} size={18} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-foreground truncate">{getSourceLabel(order)}</p>
              <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(order.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AppIcon name={st.icon} size={11} className="text-primary" />
              <span className="text-[11px] font-semibold text-primary">{st.label}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <p className="text-base font-extrabold text-foreground tabular-nums shrink-0">{formatCurrency(order.total)}</p>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
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
      )}

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center gap-1">
          {STATUS_FLOW.map((step, i) => {
            const currentIdx = STATUS_FLOW.indexOf(mapToFlowStatus(order.status));
            const filled = i <= currentIdx;
            return (
              <div key={step} className="flex-1">
                <div className={cn(
                  "h-1 rounded-full transition-all",
                  filled ? "bg-primary" : "bg-secondary/60"
                )} />
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}

/* ─── Compact Order Card ─── */
function CompactOrderCard({ order, index, onClick, dimmed }: { order: OrderItem; index: number; onClick: () => void; dimmed?: boolean }) {
  const ch = getOrderChannel(order);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 p-3 rounded-xl bg-card transition-all active:scale-[0.98] animate-fade-in",
        dimmed && "opacity-50"
      )}
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0">
        <AppIcon name={getSourceIcon(ch)} size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{getSourceLabel(order)}</p>
        <span className="text-[10px] text-muted-foreground">
          {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground/80 tabular-nums shrink-0">{formatCurrency(order.total)}</p>
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
              <div className="w-11 h-11 rounded-xl bg-secondary/80 flex items-center justify-center">
                <AppIcon name={getSourceIcon(ch)} size={20} className="text-foreground" />
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
            <p className="text-xl font-black tabular-nums">{formatCurrency(order.total)}</p>
          </SheetTitle>
        </SheetHeader>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 mb-4">
          <AppIcon name={st.icon} size={16} className="text-primary" />
          <span className="text-sm font-bold text-primary">{st.label}</span>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5">
            {STATUS_FLOW.map((step, i) => {
              const currentIdx = STATUS_FLOW.indexOf(mapToFlowStatus(order.status));
              const filled = i <= currentIdx;
              const stepLabel = step === 'pending' ? 'Recebido' : step === 'preparing' ? 'Preparando' : step === 'ready' ? 'Pronto' : 'Entregue';
              return (
                <div key={step} className="flex-1 text-center">
                  <div className={cn(
                    "h-1.5 rounded-full mb-1.5",
                    filled ? "bg-primary" : "bg-secondary/60"
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
                      {formatCurrency(item.unit_price * item.quantity)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Canal</span>
            <div className="flex items-center gap-1.5">
              <AppIcon name={getSourceIcon(ch)} size={14} className="text-foreground" />
              <span className="text-sm font-semibold">
                {ch === 'ifood' ? 'iFood' : ch === 'delivery' ? 'Delivery' : ch === 'mesa' ? 'Mesa' : 'Balcão'}
              </span>
            </div>
          </div>
          {order.customer_name && (
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="text-sm font-semibold">{order.customer_name}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-border/10 pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-black">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={onClose}>
          Fechar
        </Button>
      </SheetContent>
    </Sheet>
  );
}
