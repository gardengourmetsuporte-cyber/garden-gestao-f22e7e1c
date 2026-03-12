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
  UtensilsCrossed, Truck, RefreshCw, Hash, User, Undo2,
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
  { key: 'awaiting_confirmation', label: 'Aguardando', gradient: 'from-amber-500/20 to-amber-600/5', accent: 'amber', dotColor: 'bg-amber-400', textColor: 'text-amber-400', bgCard: 'bg-amber-500/8', borderCard: 'border-amber-500/20', btnBg: 'bg-amber-400', btnHover: 'hover:bg-amber-300' },
  { key: 'confirmed', label: 'Confirmado', gradient: 'from-sky-500/20 to-sky-600/5', accent: 'sky', dotColor: 'bg-sky-400', textColor: 'text-sky-400', bgCard: 'bg-sky-500/8', borderCard: 'border-sky-500/20', btnBg: 'bg-sky-400', btnHover: 'hover:bg-sky-300' },
  { key: 'preparing', label: 'Preparando', gradient: 'from-violet-500/20 to-violet-600/5', accent: 'violet', dotColor: 'bg-violet-400', textColor: 'text-violet-400', bgCard: 'bg-violet-500/8', borderCard: 'border-violet-500/20', btnBg: 'bg-violet-400', btnHover: 'hover:bg-violet-300' },
  { key: 'ready', label: 'Pronto', gradient: 'from-emerald-500/20 to-emerald-600/5', accent: 'emerald', dotColor: 'bg-emerald-400', textColor: 'text-emerald-400', bgCard: 'bg-emerald-500/8', borderCard: 'border-emerald-500/20', btnBg: 'bg-emerald-400', btnHover: 'hover:bg-emerald-300' },
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
      'inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg',
      isCritical ? 'bg-red-500/20 text-red-400 animate-pulse' :
      isUrgent ? 'bg-orange-500/15 text-orange-400' :
      'bg-white/[0.06] text-white/40',
    )}>
      <Clock className="w-3 h-3" />
      {mins}m
    </span>
  );
}

// ─── Source icon ─────────────────────────────────────────────────
function SourceBadge({ source, tableNumber, customerName }: { source: string; tableNumber: number; customerName: string | null }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
      {source === 'delivery' ? (
        <><Truck className="w-3.5 h-3.5 text-blue-400" /><span>Delivery</span></>
      ) : source === 'qrcode' ? (
        <><Hash className="w-3.5 h-3.5 text-purple-400" /><span>Mesa {tableNumber}</span></>
      ) : (
        <><UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" /><span>Mesa {tableNumber}</span></>
      )}
      {customerName && <><span className="text-white/20">·</span><span className="truncate max-w-[80px]">{customerName}</span></>}
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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  const items = order.tablet_order_items || [];
  const shortId = order.order_number ? `${order.order_number}` : order.id.slice(0, 4).toUpperCase();
  const statusCfg = STATUS_NEXT[order.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-2xl border backdrop-blur-sm transition-shadow',
        col.borderCard, col.bgCard,
        isDragging && 'shadow-2xl shadow-black/40 scale-[1.02]',
        'hover:shadow-lg hover:shadow-black/20',
      )}
    >
      {/* Drag handle + clickable body */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-manipulation"
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(order); }}
          className="w-full text-left px-4 pt-3.5 pb-2.5 space-y-2.5 active:bg-white/[0.03] transition-colors rounded-t-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className={cn('text-lg font-black tracking-tight', col.textColor)}>#{shortId}</span>
            </div>
            <ElapsedBadge createdAt={order.created_at} />
          </div>

          {/* Source */}
          <SourceBadge source={order.source || 'mesa'} tableNumber={order.table_number} customerName={order.customer_name} />

          {/* Items */}
          <div className="space-y-1 pb-0.5">
            {items.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-start gap-2">
                <span className={cn('text-[11px] font-black shrink-0 w-5 h-5 rounded-md flex items-center justify-center', col.bgCard, col.textColor)}>
                  {item.quantity}
                </span>
                <span className="text-xs text-white/70 truncate leading-5">{item.tablet_products?.name || 'Item'}</span>
              </div>
            ))}
            {items.length > 4 && (
              <span className="text-[10px] text-white/25 font-medium pl-7">+{items.length - 4} itens</span>
            )}
          </div>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 px-3 pb-3">
        {statusCfg?.prev && (
          <button
            onClick={(e) => { e.stopPropagation(); onBump(order.id, statusCfg.prev!); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white/50 bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 transition-all"
          >
            <Undo2 className="w-3 h-3" />
            {statusCfg.prevLabel}
          </button>
        )}
        {statusCfg?.next && (
          <button
            onClick={(e) => { e.stopPropagation(); onBump(order.id, statusCfg.next!); }}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-xs font-black text-black tracking-wide active:scale-95 transition-all',
              col.btnBg, col.btnHover,
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
      'rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/50 rotate-2 scale-105',
      col.borderCard, col.bgCard,
      'ring-2 ring-white/20',
    )}>
      <div className="px-4 pt-3.5 pb-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className={cn('text-lg font-black tracking-tight', col.textColor)}>#{shortId}</span>
          <ElapsedBadge createdAt={order.created_at} />
        </div>
        <SourceBadge source={order.source || 'mesa'} tableNumber={order.table_number} customerName={order.customer_name} />
        <div className="space-y-1">
          {items.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="text-[11px] font-black text-white/60">{item.quantity}x</span>
              <span className="text-xs text-white/50 truncate">{item.tablet_products?.name || 'Item'}</span>
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
    <div className="flex flex-col h-full min-w-0">
      {/* Column header */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]',
        isOver && 'bg-white/[0.04]',
      )}>
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', col.dotColor, orders.length > 0 && 'animate-pulse')} />
        <span className={cn('text-xs font-bold uppercase tracking-widest', orders.length > 0 ? col.textColor : 'text-white/20')}>
          {col.label}
        </span>
        {orders.length > 0 && (
          <span className={cn(
            'ml-auto text-[11px] font-black w-6 h-6 rounded-lg flex items-center justify-center',
            col.bgCard, col.textColor,
          )}>
            {orders.length}
          </span>
        )}
      </div>

      {/* Scrollable order list */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-2.5 space-y-2.5 transition-colors',
          isOver && 'bg-white/[0.02] ring-1 ring-inset ring-white/[0.06] rounded-b-xl',
        )}
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {orders.map(order => (
          <DraggableOrderCard key={order.id} order={order} col={col} onBump={onBump} onSelect={onSelect} />
        ))}
        {orders.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-white/[0.08]">
            <ChefHat className="w-8 h-8 mb-2" />
            <span className="text-[11px] font-medium">Nenhum pedido</span>
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
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  );

  const { data: orders = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ['kds-orders', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const withTimeout = <T,>(promise: Promise<T>, ms = 12000) =>
        Promise.race<T>([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))]);
      try {
        const query = supabase
          .from('tablet_orders')
          .select('id, unit_id, table_number, order_number, status, total, created_at, source, customer_name, tablet_order_items(id, quantity, notes, tablet_products(name, codigo_pdv, recipes(recipe_ingredients!recipe_ingredients_recipe_id_fkey(quantity, unit_type, kds_station_id, kds_stations(name, color), inventory_items(name)))))')
          .eq('unit_id', unitId)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: true })
          .limit(50);
        const { data, error } = await withTimeout(Promise.resolve(query)) as { data: any; error: any };
        if (error) throw error;
        return (data as unknown as KDSOrder[]) || [];
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (err?.name === 'AbortError' || msg.toLowerCase().includes('abort')) throw new Error('Conexão instável.');
        throw err;
      }
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

  // Drag handlers
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

    // Only allow drop on column droppables (not on other cards)
    if (!ACTIVE_STATUSES.includes(targetStatus)) return;

    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === targetStatus) return;

    // Allow drag to any adjacent column (forward or backward)
    const currentIdx = ACTIVE_STATUSES.indexOf(order.status);
    const targetIdx = ACTIVE_STATUSES.indexOf(targetStatus);
    if (Math.abs(currentIdx - targetIdx) > 1) return; // only 1 step at a time

    handleBump(orderId, targetStatus);
  }, [orders, handleBump]);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  return (
    <div className="h-screen bg-[hsl(225,15%,6%)] text-white flex flex-col select-none overflow-hidden">
      {/* ── Fixed Top Bar ── */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06] bg-[hsl(225,15%,7%)] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center ring-1 ring-emerald-500/25">
            <ChefHat className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none">KDS</h1>
            <p className="text-[10px] text-white/30 font-medium mt-0.5">
              Cozinha · {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono font-bold text-white/25 mr-2 tabular-nums">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => refetch()} className="p-2.5 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all" title="Atualizar">
            <RefreshCw className={cn('w-4 h-4 text-white/30', isPending && 'animate-spin text-emerald-400')} />
          </button>
          <button onClick={() => setSoundEnabled(s => !s)} className="p-2.5 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all" title={soundEnabled ? 'Silenciar' : 'Ativar som'}>
            {soundEnabled ? <Volume2 className="w-4 h-4 text-white/30" /> : <VolumeX className="w-4 h-4 text-white/15" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2.5 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all" title="Tela cheia">
            {isFullscreen ? <Minimize className="w-4 h-4 text-white/30" /> : <Maximize className="w-4 h-4 text-white/30" />}
          </button>
        </div>
      </header>

      {/* Error bar */}
      {isError && (
        <div className="mx-3 mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-red-400 font-medium truncate">{(error as Error)?.message || 'Falha ao carregar'}</p>
          <button onClick={() => refetch()} className="h-7 px-3 rounded-lg bg-red-500 text-white text-[11px] font-bold shrink-0 active:scale-95">
            Tentar novamente
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
        <div className="flex-1 grid grid-cols-4 divide-x divide-white/[0.04] overflow-hidden">
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
