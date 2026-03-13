import { useState, useMemo, useCallback } from 'react';
import { startOfDay, subDays, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
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
  ready: { label: 'Pronto', color: 'text-success', bg: 'bg-success/15', icon: 'PackageCheck' },
  dispatched: { label: 'Despachado', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: 'Truck' },
  delivered: { label: 'Entregue', color: 'text-success', bg: 'bg-success/15', icon: 'CircleCheckBig' },
  sent_to_pdv: { label: 'Enviado PDV', color: 'text-success', bg: 'bg-success/15', icon: 'CircleCheckBig' },
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

/* ─── Date Filter ─── */
type DateFilter = 'today' | 'yesterday' | '7days' | 'custom';

const DATE_PILLS: { id: DateFilter; label: string; icon?: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: '7days', label: '7 dias' },
  { id: 'custom', label: '', icon: 'CalendarDays' },
];

/* ─── Operational Groups ─── */
type OpGroup = 'novos' | 'emPreparo' | 'prontos' | 'entregues' | 'cancelados';

const OP_GROUPS: { id: OpGroup; label: string; icon: string; color: string; dotColor: string; pulse?: boolean }[] = [
  { id: 'novos', label: 'Novos', icon: 'Bell', color: 'text-amber-400', dotColor: 'bg-amber-400', pulse: true },
  { id: 'emPreparo', label: 'Em Preparo', icon: 'Flame', color: 'text-orange-400', dotColor: 'bg-orange-400', pulse: true },
  { id: 'prontos', label: 'Prontos', icon: 'PackageCheck', color: 'text-success', dotColor: 'bg-success' },
  { id: 'entregues', label: 'Entregues', icon: 'CircleCheckBig', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  { id: 'cancelados', label: 'Cancelados', icon: 'XCircle', color: 'text-red-400/60', dotColor: 'bg-red-400/60' },
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
  balcao: 'border-l-primary',
  qrcode: 'border-l-purple-500',
  ifood: 'border-l-red-500',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getDateRange(filter: DateFilter, customDate?: Date): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = startOfDay(now);
  switch (filter) {
    case 'today':
      return { start: todayStart, end: now };
    case 'yesterday': {
      const yd = subDays(todayStart, 1);
      return { start: yd, end: todayStart };
    }
    case '7days':
      return { start: subDays(todayStart, 6), end: now };
    case 'custom': {
      if (customDate) {
        const cs = startOfDay(customDate);
        const ce = new Date(cs);
        ce.setDate(ce.getDate() + 1);
        return { start: cs, end: ce };
      }
      return { start: todayStart, end: now };
    }
  }
}

function isInRange(dateStr: string, range: { start: Date; end: Date }) {
  const d = new Date(dateStr);
  return isWithinInterval(d, { start: range.start, end: range.end });
}

/* ─── Main Component ─── */
export function CardapioOrdersView({ orders, hubOrders = [] }: Props) {
  const [channel, setChannel] = useState<Channel>('todos');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const allOrders = useMemo(() => {
    const normalized = normalizeHubOrders(hubOrders);
    return [...orders, ...normalized];
  }, [orders, hubOrders]);

  const dateRange = useMemo(() => getDateRange(dateFilter, customDate), [dateFilter, customDate]);

  const channelCounts = useMemo(() => {
    const counts: Record<Channel, number> = { todos: 0, delivery: 0, mesa: 0, balcao: 0, qrcode: 0, ifood: 0 };
    const rangeOrders = allOrders.filter(o => isInRange(o.created_at, dateRange));
    counts.todos = rangeOrders.length;
    rangeOrders.forEach(o => { counts[getOrderChannel(o)]++; });
    return counts;
  }, [allOrders, dateRange]);

  const filtered = useMemo(() => {
    let result = allOrders.filter(o => isInRange(o.created_at, dateRange));
    if (channel !== 'todos') result = result.filter(o => getOrderChannel(o) === channel);
    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [allOrders, channel, dateRange]);

  // Group by operational status
  const grouped = useMemo(() => {
    const groups: Record<OpGroup, OrderItem[]> = {
      novos: [], emPreparo: [], prontos: [], entregues: [], cancelados: [],
    };
    filtered.forEach(o => {
      groups[getOpGroup(o.status)].push(o);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const active = grouped.novos.length + grouped.emPreparo.length + grouped.prontos.length;
    const done = grouped.entregues.length;
    const revenue = filtered.filter(o => getOpGroup(o.status) !== 'cancelados').reduce((sum, o) => sum + o.total, 0);
    return { active, done, revenue };
  }, [grouped, filtered]);

  const handleOrderClick = useCallback((order: OrderItem) => {
    setSelectedOrder(order);
  }, []);

  const handleDateFilterChange = useCallback((f: DateFilter) => {
    setDateFilter(f);
    if (f !== 'custom') setCustomDate(undefined);
  }, []);

  const handleCustomDate = useCallback((d: Date) => {
    setCustomDate(d);
    setDateFilter('custom');
  }, []);

  return (
    <div className="space-y-0">
      {/* ─── Sticky Filters ─── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-4 pt-3 pb-2.5 lg:px-6 space-y-2.5 border-b border-border/20">
        {/* ─── Channel Pills ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1">
          {CHANNELS.map(ch => {
            const active = channel === ch.id;
            const count = channelCounts[ch.id];
            return (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-200 touch-manipulation",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card/80 border border-border/30 text-muted-foreground active:scale-95"
                )}
              >
                <AppIcon name={ch.icon} size={14} />
                {ch.label}
                {count > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-extrabold rounded-full",
                    active ? "bg-white/25 text-primary-foreground" : "bg-primary/15 text-primary"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Date Filter Pills ─── */}
        <div className="flex items-center justify-center gap-2">
          {DATE_PILLS.map(pill => {
            if (pill.id === 'custom') {
              return (
                <div key={pill.id} className="shrink-0">
                  <DatePicker
                    date={customDate}
                    onSelect={handleCustomDate}
                    formatStr="dd/MM"
                    placeholder=""
                    className={cn(
                      "h-8 min-w-8 w-auto px-2.5 rounded-full text-xs font-bold border",
                      dateFilter === 'custom'
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-card/60 border-border/30 text-muted-foreground"
                    )}
                  />
                </div>
              );
            }
            const isActive = dateFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => handleDateFilterChange(pill.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0",
                  isActive
                    ? "bg-primary/15 border border-primary/40 text-primary"
                    : "bg-card/60 border border-border/30 text-muted-foreground active:scale-95"
                )}
              >
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                {pill.label}
              </button>
            );
          })}
          {dateFilter === 'custom' && customDate && (
            <span className="text-[11px] font-semibold text-primary shrink-0">
              {format(customDate, "dd 'de' MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="px-4 py-3 lg:px-6 space-y-4">
      {/* ─── Live Stats Bar ─── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20 p-3 text-center">
          {stats.active > 0 && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          <p className="text-2xl font-black tabular-nums text-amber-400">{stats.active}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70 mt-0.5">Ativos</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/20 p-3 text-center">
          <p className="text-2xl font-black tabular-nums text-emerald-400">{stats.done}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/70 mt-0.5">Entregues</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-3 text-center min-w-0">
          <p className="text-base sm:text-lg font-black tabular-nums text-primary truncate">{formatPrice(stats.revenue)}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70 mt-0.5">Faturamento</p>
        </div>
      </div>

      {/* ─── Orders Feed (Operational Groups) ─── */}
      {filtered.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="Nenhum pedido" subtitle="Os pedidos aparecerão aqui em tempo real" />
      ) : (
        <div className="space-y-4">
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
                onOrderClick={handleOrderClick}
              />
            );
          })}
        </div>
      )}

      {/* ─── Order Detail Sheet ─── */}
      <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </div>
    </div>
  );
}

/* ─── Order Section (collapsible) ─── */
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
  const header = (
    <div className="flex items-center gap-2">
      {group.pulse
        ? <div className={cn("w-2 h-2 rounded-full animate-pulse", group.dotColor)} />
        : <AppIcon name={group.icon} size={12} className={group.color} />
      }
      <p className={cn("text-[11px] font-bold uppercase tracking-[0.15em]", group.color)}>
        {group.label} ({items.length})
      </p>
      {collapsible && (
        <AppIcon name="ChevronDown" size={12} className={cn("ml-auto transition-transform text-muted-foreground/40", "group-data-[state=open]:rotate-180")} />
      )}
    </div>
  );

  const isActiveGroup = group.id === 'novos' || group.id === 'emPreparo' || group.id === 'prontos';

  const content = (
    <div className={cn(isActiveGroup ? "space-y-2" : "space-y-1.5")}>
      {items.map((order, i) =>
        isActiveGroup ? (
          <TimelineOrderCard key={order.id} order={order} index={i} onClick={() => onOrderClick(order)} />
        ) : (
          <CompactOrderCard
            key={order.id}
            order={order}
            index={i}
            onClick={() => onOrderClick(order)}
            dimmed={group.id === 'cancelados'}
          />
        )
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Collapsible defaultOpen={defaultOpen} className="group">
        <CollapsibleTrigger className="w-full text-left mb-2">
          {header}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {content}
        </CollapsibleContent>
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
                <span className={cn("text-[11px] font-bold uppercase tracking-wide", st.color)}>{st.label}</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground/60">
                  {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          <p className="text-base font-black text-foreground tabular-nums shrink-0">{formatPrice(order.total)}</p>
        </div>
      </div>

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
                  filled ? isCurrent ? "bg-primary animate-pulse" : "bg-primary/60" : "bg-secondary/60"
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

        <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl mb-4", st.bg)}>
          {st.pulse && <div className={cn("w-2 h-2 rounded-full animate-pulse", st.color.replace('text-', 'bg-'))} />}
          <AppIcon name={st.icon} size={16} className={st.color} />
          <span className={cn("text-sm font-bold", st.color)}>{st.label}</span>
        </div>

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
