import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  draft: { label: 'Rascunho', color: 'bg-secondary text-muted-foreground', dotColor: 'bg-muted-foreground' },
  awaiting_confirmation: { label: 'Aguardando', color: 'bg-warning/15 text-warning', dotColor: 'bg-warning' },
  pending: { label: 'Pendente', color: 'bg-warning/15 text-warning', dotColor: 'bg-warning' },
  confirmed: { label: 'Confirmado', color: 'bg-primary/15 text-primary', dotColor: 'bg-primary' },
  preparing: { label: 'Preparando', color: 'bg-orange-500/15 text-orange-400', dotColor: 'bg-orange-400' },
  ready: { label: 'Pronto', color: 'bg-emerald-500/15 text-emerald-400', dotColor: 'bg-emerald-400' },
  dispatched: { label: 'Despachado', color: 'bg-blue-500/15 text-blue-400', dotColor: 'bg-blue-400' },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/15 text-emerald-400', dotColor: 'bg-emerald-400' },
  sent_to_pdv: { label: 'Enviado PDV', color: 'bg-emerald-500/15 text-emerald-400', dotColor: 'bg-emerald-400' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive', dotColor: 'bg-destructive' },
  error: { label: 'Erro', color: 'bg-destructive/15 text-destructive', dotColor: 'bg-destructive' },
};

type Channel = 'todos' | 'delivery' | 'mesa' | 'balcao' | 'qrcode';

const CHANNELS: { id: Channel; label: string; icon: string; emptyTitle: string; emptySubtitle: string }[] = [
  { id: 'todos', label: 'Todos', icon: 'LayoutGrid', emptyTitle: 'Nenhum pedido', emptySubtitle: 'Os pedidos aparecerão aqui' },
  { id: 'delivery', label: 'Delivery', icon: 'Truck', emptyTitle: 'Nenhum delivery', emptySubtitle: 'Pedidos de entrega aparecerão aqui' },
  { id: 'mesa', label: 'Mesa', icon: 'Utensils', emptyTitle: 'Nenhum pedido de mesa', emptySubtitle: 'Pedidos do tablet nas mesas aparecerão aqui' },
  { id: 'balcao', label: 'Balcão', icon: 'Store', emptyTitle: 'Nenhum pedido no balcão', emptySubtitle: 'Pedidos para retirada aparecerão aqui' },
  { id: 'qrcode', label: 'QR Code', icon: 'QrCode', emptyTitle: 'Nenhum pedido QR', emptySubtitle: 'Pedidos via QR Code aparecerão aqui' },
];

function getOrderChannel(order: OrderItem): Channel {
  if (order.source === 'delivery') return 'delivery';
  if (order.source === 'balcao') return 'balcao';
  if (order.source === 'qrcode') return 'qrcode';
  if ((order.table_number ?? 0) > 0) return 'mesa';
  return 'balcao';
}

function getSourceLabel(order: OrderItem) {
  if (order.source === 'delivery') return 'Delivery';
  if (order.source === 'balcao') return 'Balcão';
  if (order.source === 'qrcode') return 'QR Code';
  if ((order.table_number ?? 0) > 0) return `Mesa ${order.table_number}`;
  if (order.customer_name) return order.customer_name;
  return 'Pedido';
}

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const getStatus = (s: string) => STATUS_CONFIG[s] || { label: s, color: 'bg-secondary text-muted-foreground', dotColor: 'bg-muted-foreground' };

export function CardapioOrdersView({ orders }: Props) {
  const [channel, setChannel] = useState<Channel>('todos');

  const today = new Date().toISOString().slice(0, 10);

  const channelCounts = useMemo(() => {
    const counts: Record<Channel, number> = { todos: 0, delivery: 0, mesa: 0, balcao: 0, qrcode: 0 };
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    counts.todos = todayOrders.length;
    todayOrders.forEach(o => { counts[getOrderChannel(o)]++; });
    return counts;
  }, [orders, today]);

  const filtered = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (channel === 'todos') return sorted;
    return sorted.filter(o => getOrderChannel(o) === channel);
  }, [orders, channel]);

  const todayOrders = filtered.filter(o => o.created_at.slice(0, 10) === today);
  const olderOrders = filtered.filter(o => o.created_at.slice(0, 10) !== today);
  const activeChannel = CHANNELS.find(c => c.id === channel)!;

  // Stats for top row
  const stats = useMemo(() => {
    const active = channel === 'todos' ? orders : filtered;
    const todayActive = active.filter(o => o.created_at.slice(0, 10) === today);
    return {
      pending: todayActive.filter(o => ['awaiting_confirmation', 'pending', 'confirmed'].includes(o.status)).length,
      preparing: todayActive.filter(o => ['preparing', 'ready'].includes(o.status)).length,
      done: todayActive.filter(o => ['sent_to_pdv', 'delivered', 'dispatched'].includes(o.status)).length,
      errors: todayActive.filter(o => ['error', 'cancelled'].includes(o.status)).length,
    };
  }, [orders, filtered, channel, today]);

  return (
    <div className="px-4 py-3 lg:px-6 space-y-4">
      {/* Channel Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-0.5">
        {CHANNELS.map(ch => {
          const isActive = channel === ch.id;
          const count = channelCounts[ch.id];
          return (
            <button
              key={ch.id}
              onClick={() => setChannel(ch.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "bg-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
              )}
            >
              <AppIcon name={ch.icon} size={14} />
              {ch.label}
              {count > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-0.5",
                  isActive ? "bg-primary/20" : "bg-secondary"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Summary */}
      {(stats.pending > 0 || stats.preparing > 0 || stats.done > 0 || stats.errors > 0) && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Pendentes', count: stats.pending, color: 'text-warning', bg: 'bg-warning/10', icon: 'Clock' },
            { label: 'Preparando', count: stats.preparing, color: 'text-orange-400', bg: 'bg-orange-400/10', icon: 'ChefHat' },
            { label: 'Concluídos', count: stats.done, color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: 'CheckCircle2' },
            { label: 'Erros', count: stats.errors, color: 'text-destructive', bg: 'bg-destructive/10', icon: 'AlertTriangle' },
          ].map(s => (
            <div key={s.label} className={cn("flex flex-col items-center gap-1 py-2.5 rounded-xl", s.bg)}>
              <span className={cn("text-lg font-extrabold tabular-nums", s.color)}>{s.count}</span>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Orders List */}
      {filtered.length === 0 ? (
        <EmptyState icon={activeChannel.icon} title={activeChannel.emptyTitle} subtitle={activeChannel.emptySubtitle} />
      ) : (
        <div className="space-y-5">
          {todayOrders.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Hoje</p>
              {todayOrders.map((order, i) => (
                <OrderCard key={order.id} order={order} index={i} showSource={channel === 'todos'} />
              ))}
            </div>
          )}

          {olderOrders.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Anteriores</p>
              {olderOrders.slice(0, 20).map((order, i) => (
                <OrderCardCompact key={order.id} order={order} index={i} showSource={channel === 'todos'} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, index, showSource }: { order: OrderItem; index: number; showSource: boolean }) {
  const st = getStatus(order.status);
  const items = order.tablet_order_items || [];
  const channelIcon = getOrderChannel(order) === 'delivery' ? 'Truck'
    : getOrderChannel(order) === 'mesa' ? 'Utensils'
    : getOrderChannel(order) === 'qrcode' ? 'QrCode'
    : 'Store';

  return (
    <div
      className="rounded-2xl bg-card border border-border/40 p-4 space-y-3 animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            getOrderChannel(order) === 'delivery' ? 'bg-blue-500/10' :
            getOrderChannel(order) === 'mesa' ? 'bg-amber-500/10' :
            getOrderChannel(order) === 'qrcode' ? 'bg-purple-500/10' :
            'bg-emerald-500/10'
          )}>
            <AppIcon name={channelIcon} size={16} className={
              getOrderChannel(order) === 'delivery' ? 'text-blue-400' :
              getOrderChannel(order) === 'mesa' ? 'text-amber-400' :
              getOrderChannel(order) === 'qrcode' ? 'text-purple-400' :
              'text-emerald-400'
            } />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">{getSourceLabel(order)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {order.customer_name && showSource && (
                <span className="ml-1.5">· {order.customer_name}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-foreground tabular-nums">{formatPrice(order.total)}</p>
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md inline-block mt-1", st.color)}>
            {st.label}
          </span>
        </div>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 4).map((item: any, idx: number) => (
            <span key={idx} className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
              {item.quantity}× {item.tablet_products?.name || '?'}
            </span>
          ))}
          {items.length > 4 && (
            <span className="text-[10px] text-muted-foreground/60">+{items.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCardCompact({ order, index, showSource }: { order: OrderItem; index: number; showSource: boolean }) {
  const st = getStatus(order.status);
  const channelIcon = getOrderChannel(order) === 'delivery' ? 'Truck'
    : getOrderChannel(order) === 'mesa' ? 'Utensils'
    : getOrderChannel(order) === 'qrcode' ? 'QrCode'
    : 'Store';

  return (
    <div
      className="rounded-2xl bg-card border border-border/40 p-3.5 flex items-center gap-3 animate-fade-in"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        getOrderChannel(order) === 'delivery' ? 'bg-blue-500/10' :
        getOrderChannel(order) === 'mesa' ? 'bg-amber-500/10' :
        getOrderChannel(order) === 'qrcode' ? 'bg-purple-500/10' :
        'bg-emerald-500/10'
      )}>
        <AppIcon name={channelIcon} size={13} className={
          getOrderChannel(order) === 'delivery' ? 'text-blue-400' :
          getOrderChannel(order) === 'mesa' ? 'text-amber-400' :
          getOrderChannel(order) === 'qrcode' ? 'text-purple-400' :
          'text-emerald-400'
        } />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight truncate">{getSourceLabel(order)}</p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          <span className={cn("ml-1.5 font-bold uppercase", st.color.split(' ').find(c => c.startsWith('text-')) || '')}>
            {st.label}
          </span>
        </p>
      </div>
      <p className="text-sm font-extrabold text-foreground tabular-nums">{formatPrice(order.total)}</p>
    </div>
  );
}
