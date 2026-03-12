import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  ChefHat, Clock, Maximize, Minimize, Volume2, VolumeX,
  UtensilsCrossed, Truck, RefreshCw, Hash, Undo2, GripVertical,
} from 'lucide-react';
import { KDSOrderDetail } from '@/components/kds/KDSOrderDetail';

// ─── Types ────────────────────────────────────────────────────────
type KDSOrder = {
  id: string;
  unit_id: string;
  table_number: number;
  status: string;
  total: number;
  created_at: string;
  source: string;
  customer_name: string | null;
  order_number?: number;
  tablet_order_items?: {
    id: string;
    quantity: number;
    notes: string | null;
    tablet_products: {
      name: string;
      codigo_pdv: string | null;
      recipes?: {
        recipe_ingredients?: {
          quantity: number;
          unit_type: string;
          kds_station_id: string | null;
          kds_stations: { name: string; color: string } | null;
          inventory_items: { name: string } | null;
        }[];
      } | null;
    } | null;
  }[];
};

const ACTIVE_STATUSES = ['awaiting_confirmation', 'confirmed', 'preparing', 'ready'];

const COLUMNS = [
  { key: 'awaiting_confirmation', label: 'Aguardando', emoji: '🟡', bg: 'bg-amber-950/40', border: 'border-amber-700/30', dot: 'bg-amber-400', text: 'text-amber-300', badge: 'bg-amber-400/15 text-amber-300', btn: 'bg-amber-500 hover:bg-amber-400 text-black' },
  { key: 'confirmed', label: 'Confirmado', emoji: '🔵', bg: 'bg-sky-950/40', border: 'border-sky-700/30', dot: 'bg-sky-400', text: 'text-sky-300', badge: 'bg-sky-400/15 text-sky-300', btn: 'bg-sky-500 hover:bg-sky-400 text-black' },
  { key: 'preparing', label: 'Preparando', emoji: '🟣', bg: 'bg-violet-950/40', border: 'border-violet-700/30', dot: 'bg-violet-400', text: 'text-violet-300', badge: 'bg-violet-400/15 text-violet-300', btn: 'bg-violet-500 hover:bg-violet-400 text-black' },
  { key: 'ready', label: 'Pronto', emoji: '🟢', bg: 'bg-emerald-950/40', border: 'border-emerald-700/30', dot: 'bg-emerald-400', text: 'text-emerald-300', badge: 'bg-emerald-400/15 text-emerald-300', btn: 'bg-emerald-500 hover:bg-emerald-400 text-black' },
] as const;

const STATUS_NEXT: Record<string, { next: string | null; nextLabel: string; prev: string | null; prevLabel: string }> = {
  awaiting_confirmation: { next: 'confirmed', nextLabel: 'Aceitar', prev: null, prevLabel: '' },
  confirmed: { next: 'preparing', nextLabel: 'Preparar', prev: 'awaiting_confirmation', prevLabel: 'Voltar' },
  preparing: { next: 'ready', nextLabel: 'Pronto', prev: 'confirmed', prevLabel: 'Voltar' },
  ready: { next: 'delivered', nextLabel: 'Entregue', prev: 'preparing', prevLabel: 'Voltar' },
};

// ─── Elapsed timer ────────────────────────────────────────────────
function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  const isCritical = mins >= 15;
  const isUrgent = mins >= 10;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md',
      isCritical ? 'bg-red-500/25 text-red-300 animate-pulse' :
      isUrgent ? 'bg-orange-500/20 text-orange-300' :
      'bg-white/[0.06] text-white/35',
    )}>
      <Clock className="w-2.5 h-2.5" />
      {mins}m
    </span>
  );
}

// ─── Source badge ────────────────────────────────────────────────
function SourceBadge({ source, tableNumber, customerName }: { source: string; tableNumber: number; customerName: string | null }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-white/40 font-medium truncate">
      {source === 'delivery' ? (
        <><Truck className="w-3 h-3 text-blue-400 shrink-0" /><span>Delivery</span></>
      ) : source === 'qrcode' ? (
        <><Hash className="w-3 h-3 text-purple-400 shrink-0" /><span>Mesa {tableNumber}</span></>
      ) : (
        <><UtensilsCrossed className="w-3 h-3 text-emerald-400 shrink-0" /><span>Mesa {tableNumber}</span></>
      )}
      {customerName && <><span className="text-white/15">·</span><span className="truncate">{customerName}</span></>}
    </div>
  );
}

// ─── Draggable Order Card ────────────────────────────────────────
function DraggableOrderCard({
  order, col, onBump, onSelect,
}: {
  order: KDSOrder;
  col: typeof COLUMNS[number];
  onBump: (id: string, next: string) => void;
  onSelect: (o: KDSOrder) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: { order, status: order.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  const items = order.tablet_order_items || [];
  const shortId = order.order_number ? `${order.order_number}` : order.id.slice(0, 4).toUpperCase();
  const statusCfg = STATUS_NEXT[order.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-xl border backdrop-blur-sm transition-all cursor-grab active:cursor-grabbing touch-manipulation',
        col.border, col.bg,
        isDragging && 'shadow-2xl shadow-black/60 ring-2 ring-white/20',
      )}
    >
      {/* Card body - tap to view detail */}
      <div
        className="w-full text-left px-3 pt-3 pb-2 space-y-2"
        onPointerUp={(e) => {
          // Only trigger select on quick taps (not drags)
          if (!isDragging) {
            e.stopPropagation();
            onSelect(order);
          }
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-base font-black tracking-tight', col.text)}>#{shortId}</span>
          <div className="flex items-center gap-1.5">
            <ElapsedBadge createdAt={order.created_at} />
            <GripVertical className="w-3.5 h-3.5 text-white/25" />
          </div>
        </div>

        <SourceBadge source={order.source || 'mesa'} tableNumber={order.table_number} customerName={order.customer_name} />

        {/* Items */}
        <div className="space-y-0.5">
          {items.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center gap-1.5">
              <span className={cn('text-[10px] font-black w-4 h-4 rounded flex items-center justify-center shrink-0', col.badge)}>
                {item.quantity}
              </span>
              <span className="text-[11px] text-white/60 truncate leading-4">{item.tablet_products?.name || 'Item'}</span>
            </div>
          ))}
          {items.length > 3 && (
            <span className="text-[9px] text-white/20 font-medium pl-5">+{items.length - 3} itens</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 px-2.5 pb-2.5 pt-1">
        {statusCfg?.prev && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onBump(order.id, statusCfg.prev!)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-bold text-white/40 bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 transition-all"
          >
            <Undo2 className="w-3 h-3" />
          </button>
        )}
        {statusCfg?.next && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onBump(order.id, statusCfg.next!)}
            className={cn(
              'flex-1 py-2 rounded-lg text-[11px] font-black tracking-wide active:scale-95 transition-all',
              col.btn,
            )}
          >
            {statusCfg.nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Overlay card (dragging ghost) ───────────────────────────────
function DragOverlayCard({ order }: { order: KDSOrder }) {
  const col = COLUMNS.find(c => c.key === order.status) || COLUMNS[1];
  const items = order.tablet_order_items || [];
  const shortId = order.order_number ? `${order.order_number}` : order.id.slice(0, 4).toUpperCase();

  return (
    <div className={cn(
      'rounded-xl border backdrop-blur-md shadow-2xl shadow-black/60 rotate-1 scale-105',
      col.border, col.bg,
      'ring-2 ring-white/25',
    )} style={{ width: 'min(280px, 70vw)' }}>
      <div className="px-3 pt-3 pb-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={cn('text-base font-black', col.text)}>#{shortId}</span>
          <ElapsedBadge createdAt={order.created_at} />
        </div>
        <div className="space-y-0.5">
          {items.slice(0, 2).map(item => (
            <div key={item.id} className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-white/50">{item.quantity}x</span>
              <span className="text-[11px] text-white/40 truncate">{item.tablet_products?.name || 'Item'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Droppable Column ────────────────────────────────────────────
function KDSColumn({
  col, orders, onBump, onSelect,
}: {
  col: typeof COLUMNS[number];
  orders: KDSOrder[];
  onBump: (id: string, next: string) => void;
  onSelect: (o: KDSOrder) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });

  return (
    <div className={cn(
      'flex flex-col h-full min-w-[280px] w-[280px] lg:min-w-0 lg:w-auto shrink-0 lg:shrink',
      'border-r border-white/[0.04] last:border-r-0',
    )}>
      {/* Column header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0',
        isOver && 'bg-white/[0.06]',
      )}>
        <div className={cn('w-2 h-2 rounded-full shrink-0', col.dot, orders.length > 0 && 'animate-pulse')} />
        <span className={cn('text-[11px] font-bold uppercase tracking-widest flex-1', orders.length > 0 ? col.text : 'text-white/20')}>
          {col.label}
        </span>
        <span className={cn(
          'text-[10px] font-black min-w-[20px] h-5 rounded-md flex items-center justify-center',
          orders.length > 0 ? col.badge : 'bg-white/[0.04] text-white/15',
        )}>
          {orders.length}
        </span>
      </div>

      {/* Scrollable order list */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-2 space-y-2 transition-colors',
          isOver && 'bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]',
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        {orders.map(order => (
          <DraggableOrderCard key={order.id} order={order} col={col} onBump={onBump} onSelect={onSelect} />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/[0.06]">
            <ChefHat className="w-7 h-7 mb-1.5" />
            <span className="text-[10px] font-medium">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main KDS Page ────────────────────────────────────────────────
export default function KDS() {
  const { unitId } = useParams<{ unitId: string }>();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<KDSOrder | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const { data: orders = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ['kds-orders', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('tablet_orders')
        .select('id, unit_id, table_number, order_number, status, total, created_at, source, customer_name, tablet_order_items(id, quantity, notes, tablet_products(name, codigo_pdv, recipes(recipe_ingredients!recipe_ingredients_recipe_id_fkey(quantity, unit_type, kds_station_id, kds_stations(name, color), inventory_items(name)))))')
        .eq('unit_id', unitId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data as unknown as KDSOrder[]) || [];
    },
    enabled: !!unitId,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Realtime
  useEffect(() => {
    if (!unitId) return;
    const channel = supabase
      .channel(`kds-${unitId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tablet_orders', filter: `unit_id=eq.${unitId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['kds-orders', unitId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [unitId, queryClient]);

  // New-order beep
  useEffect(() => {
    const currentIds = new Set(orders.map(o => o.id));
    const prevIds = prevOrderIdsRef.current;
    if (prevIds.size > 0 && soundEnabled) {
      if (orders.some(o => !prevIds.has(o.id))) playBeep();
    }
    prevOrderIdsRef.current = currentIds;
  }, [orders, soundEnabled]);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine'; gain.gain.value = 0.3;
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  const handleBump = useCallback(async (orderId: string, nextStatus: string) => {
    if (nextStatus === 'delivered' || nextStatus === 'completed') {
      queryClient.setQueryData(['kds-orders', unitId], (old: KDSOrder[] | undefined) =>
        (old || []).filter(o => o.id !== orderId)
      );
    } else {
      queryClient.setQueryData(['kds-orders', unitId], (old: KDSOrder[] | undefined) =>
        (old || []).map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
      );
    }
    const { error } = await supabase
      .from('tablet_orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) queryClient.invalidateQueries({ queryKey: ['kds-orders', unitId] });
  }, [unitId, queryClient]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const [time, setTime] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 30_000); return () => clearInterval(i); }, []);

  const ordersByStatus = useMemo(() => {
    const g: Record<string, KDSOrder[]> = { awaiting_confirmation: [], confirmed: [], preparing: [], ready: [] };
    orders.forEach(o => { if (g[o.status]) g[o.status].push(o); });
    return g;
  }, [orders]);

  const activeOrder = useMemo(() => orders.find(o => o.id === activeId) || null, [orders, activeId]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const targetStatus = over.id as string;

    if (!ACTIVE_STATUSES.includes(targetStatus)) return;

    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === targetStatus) return;

    const currentIdx = ACTIVE_STATUSES.indexOf(order.status);
    const targetIdx = ACTIVE_STATUSES.indexOf(targetStatus);
    if (Math.abs(currentIdx - targetIdx) > 1) return;

    handleBump(orderId, targetStatus);
  }, [orders, handleBump]);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const totalOrders = orders.length;

  return (
    <div className="h-screen bg-[#0a0c10] text-white flex flex-col select-none overflow-hidden">
      {/* ── Fixed Top Bar ── */}
      <header className="flex items-center h-12 px-3 border-b border-white/[0.06] bg-[#0d0f14] shrink-0 z-20">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <ChefHat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight leading-none">KDS</h1>
            <p className="text-[9px] text-white/25 font-medium">
              {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-mono font-bold text-white/20 mr-1 tabular-nums">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-white/[0.06] active:scale-95 transition-all" title="Atualizar">
            <RefreshCw className={cn('w-3.5 h-3.5 text-white/25', isPending && 'animate-spin text-emerald-400')} />
          </button>
          <button onClick={() => setSoundEnabled(s => !s)} className="p-2 rounded-lg hover:bg-white/[0.06] active:scale-95 transition-all">
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white/25" /> : <VolumeX className="w-3.5 h-3.5 text-white/15" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/[0.06] active:scale-95 transition-all">
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-white/25" /> : <Maximize className="w-3.5 h-3.5 text-white/25" />}
          </button>
        </div>
      </header>

      {/* Error bar */}
      {isError && (
        <div className="mx-2 mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-red-400 font-medium truncate">{(error as Error)?.message || 'Falha ao carregar'}</p>
          <button onClick={() => refetch()} className="h-6 px-2.5 rounded-md bg-red-500 text-white text-[10px] font-bold shrink-0 active:scale-95">
            Tentar
          </button>
        </div>
      )}

      {/* ── Columns with DnD ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex overflow-x-auto overflow-y-hidden lg:grid lg:grid-cols-4">
          {COLUMNS.map(col => (
            <KDSColumn
              key={col.key}
              col={col}
              orders={ordersByStatus[col.key] || []}
              onBump={handleBump}
              onSelect={setSelectedOrder}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOrder ? <DragOverlayCard order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>

      {/* ── Detail overlay ── */}
      {selectedOrder && (
        <KDSOrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onBump={handleBump} />
      )}

      {/* Loading overlay */}
      {(isPending && !isError && orders.length === 0) && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      )}
    </div>
  );
}
