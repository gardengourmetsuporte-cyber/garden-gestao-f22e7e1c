import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  ChefHat, Clock, Maximize, Minimize, Volume2, VolumeX,
  UtensilsCrossed, Truck, RefreshCw, X, Hash, User, ShoppingBag,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  tablet_order_items?: {
    id: string;
    quantity: number;
    notes: string | null;
    tablet_products: { name: string; codigo_pdv: string | null } | null;
  }[];
};

const ACTIVE_STATUSES = ['awaiting_confirmation', 'confirmed', 'preparing', 'ready'];

const STATUS_CFG: Record<string, {
  label: string;
  accent: string;       // tailwind color stem e.g. "amber"
  next: string | null;
  nextLabel: string;
}> = {
  awaiting_confirmation: { label: 'Aguardando', accent: 'amber', next: 'confirmed', nextLabel: 'ACEITAR' },
  confirmed:             { label: 'Confirmado', accent: 'yellow', next: 'preparing', nextLabel: 'PREPARAR' },
  preparing:             { label: 'Preparando', accent: 'orange', next: 'ready', nextLabel: 'PRONTO ✓' },
  ready:                 { label: 'Pronto',     accent: 'emerald', next: 'delivered', nextLabel: 'ENTREGUE' },
};

const ACCENT_MAP: Record<string, { text: string; bg: string; border: string; btn: string; ring: string }> = {
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   btn: 'bg-amber-500 hover:bg-amber-400',     ring: 'ring-amber-500/40' },
  yellow:  { text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  btn: 'bg-yellow-500 hover:bg-yellow-400',    ring: 'ring-yellow-500/40' },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  btn: 'bg-orange-500 hover:bg-orange-400',    ring: 'ring-orange-500/40' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', btn: 'bg-emerald-500 hover:bg-emerald-400',  ring: 'ring-emerald-500/40' },
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
      'inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md',
      isCritical ? 'bg-red-500/20 text-red-400 animate-pulse' :
      isUrgent ? 'bg-orange-500/15 text-orange-400' :
      'bg-white/5 text-white/50',
    )}>
      <Clock className="w-3 h-3" />
      {mins}m
    </span>
  );
}

// ─── Order Card (compact, clickable) ──────────────────────────────
function OrderCard({
  order, onBump, onSelect,
}: {
  order: KDSOrder;
  onBump: (id: string, next: string) => void;
  onSelect: (o: KDSOrder) => void;
}) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.confirmed;
  const a = ACCENT_MAP[cfg.accent];
  const source = order.source || 'mesa';
  const items = order.tablet_order_items || [];
  const shortId = order.id.slice(0, 4).toUpperCase();

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border overflow-hidden backdrop-blur-sm transition-all',
      a.border, a.bg,
    )}>
      {/* Clickable body */}
      <button
        type="button"
        onClick={() => onSelect(order)}
        className="flex-1 text-left px-3.5 pt-3 pb-2 space-y-2 active:bg-white/5 transition-colors"
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-black text-white tracking-tight">#{shortId}</span>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md', a.bg, a.text)}>
              {cfg.label}
            </span>
          </div>
          <ElapsedBadge createdAt={order.created_at} />
        </div>

        {/* Source */}
        <div className="flex items-center gap-1.5">
          {source === 'delivery' ? (
            <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-white/70 truncate">
            {source === 'delivery' ? 'Delivery' : `Mesa ${order.table_number}`}
          </span>
          {order.customer_name && (
            <span className="text-[10px] text-white/40 truncate ml-auto">{order.customer_name}</span>
          )}
        </div>

        {/* Items preview (max 3) */}
        <div className="space-y-1">
          {items.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-start gap-1.5">
              <span className="text-xs font-bold text-white/80 shrink-0">{item.quantity}x</span>
              <span className="text-xs text-white/60 truncate">{item.tablet_products?.name || 'Item'}</span>
            </div>
          ))}
          {items.length > 3 && (
            <span className="text-[10px] text-white/30 font-medium">+{items.length - 3} itens</span>
          )}
          {items.length === 0 && (
            <span className="text-[10px] text-white/20">Sem itens</span>
          )}
        </div>
      </button>

      {/* Bump button */}
      {cfg.next && (
        <button
          onClick={(e) => { e.stopPropagation(); onBump(order.id, cfg.next!); }}
          className={cn(
            'w-full py-3 text-sm font-black tracking-wide text-black transition-all active:scale-[0.97]',
            a.btn,
          )}
        >
          {cfg.nextLabel}
        </button>
      )}
    </div>
  );
}

// ─── Order Detail (Full-screen for better KDS visibility) ─────────
function OrderDetail({
  order, onClose, onBump,
}: {
  order: KDSOrder;
  onClose: () => void;
  onBump: (id: string, next: string) => void;
}) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.confirmed;
  const a = ACCENT_MAP[cfg.accent];
  const source = order.source || 'mesa';
  const items = order.tablet_order_items || [];
  const shortId = order.id.slice(0, 4).toUpperCase();
  const mins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60_000);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(240,10%,4%)] animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* ── Header ── */}
      <header className={cn('flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0', a.bg)}>
        <div className="flex items-center gap-4">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', a.bg, 'ring-2', a.ring)}>
            <span className={cn('text-2xl font-black', a.text)}>#{shortId}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className={cn('text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg', a.bg, a.text, 'ring-1', a.ring)}>
                {cfg.label}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1.5 text-sm font-mono font-bold px-2.5 py-1 rounded-lg',
                mins >= 15 ? 'bg-red-500/20 text-red-400 animate-pulse' :
                mins >= 10 ? 'bg-orange-500/15 text-orange-400' :
                'bg-white/5 text-white/50',
              )}>
                <Clock className="w-4 h-4" />
                {mins} min
              </span>
            </div>
            <p className="text-xs text-white/40 mt-1">
              Criado {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/10 transition-colors active:scale-95">
          <X className="w-7 h-7 text-white/60" />
        </button>
      </header>

      {/* ── Info bar ── */}
      <div className="flex items-center gap-6 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          {source === 'delivery' ? <Truck className="w-5 h-5 text-blue-400" /> : <UtensilsCrossed className="w-5 h-5 text-emerald-400" />}
          <span className="text-base font-bold text-white/80">
            {source === 'delivery' ? 'Delivery' : `Mesa ${order.table_number}`}
          </span>
        </div>
        {order.customer_name && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-white/40" />
            <span className="text-base text-white/60 font-medium">{order.customer_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <ShoppingBag className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/50 font-semibold">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>

      {/* ── Items list (scrollable, large) ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid gap-3 max-w-3xl mx-auto">
          {items.map((item, idx) => (
            <div key={item.id} className={cn(
              'flex items-start gap-4 rounded-2xl p-4 border transition-colors',
              'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]',
            )}>
              <span className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0',
                a.bg, a.text, 'ring-1', a.ring,
              )}>
                {item.quantity}x
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white/90 leading-snug">{item.tablet_products?.name || 'Item'}</p>
                {item.tablet_products?.codigo_pdv && (
                  <p className="text-xs text-white/30 font-mono mt-0.5">COD PDV: {item.tablet_products.codigo_pdv}</p>
                )}
                {item.notes && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-400/90 font-medium">⚠ {item.notes}</p>
                  </div>
                )}
              </div>
              {/* Future: ficha técnica button per item */}
            </div>
          ))}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <ShoppingBag className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">Nenhum item neste pedido</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer with actions ── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[hsl(240,10%,5%)] px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-colors active:scale-[0.97]"
          >
            Voltar
          </button>
          <div className="flex-1" />
          {cfg.next && (
            <button
              onClick={() => { onBump(order.id, cfg.next!); onClose(); }}
              className={cn(
                'px-10 py-3.5 rounded-xl text-base font-black text-black tracking-wide transition-all active:scale-[0.97] shadow-lg',
                a.btn,
              )}
            >
              {cfg.nextLabel}
            </button>
          )}
        </div>
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
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  const { data: orders = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ['kds-orders', unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const withTimeout = <T,>(promise: Promise<T>, ms = 12000) =>
        Promise.race<T>([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout ao carregar pedidos do KDS')), ms)),
        ]);

      try {
        const res = await withTimeout(
          supabase
            .from('tablet_orders')
            .select('id, unit_id, table_number, status, total, created_at, source, customer_name, tablet_order_items(id, quantity, notes, tablet_products(name, codigo_pdv))')
            .eq('unit_id', unitId)
            .in('status', ACTIVE_STATUSES)
            .order('created_at', { ascending: true })
            .limit(50)
        );
        console.log('[KDS] Query result:', { data: res.data?.length, error: res.error });
        if (res.error) {
          console.error('[KDS] Supabase error:', res.error);
          throw res.error;
        }
        return (res.data as unknown as KDSOrder[]) || [];
      } catch (err: any) {
        console.error('[KDS] Fetch error:', err?.name, err?.message, err);
        const msg = String(err?.message || '');
        const isAbort = err?.name === 'AbortError' || msg.toLowerCase().includes('abort');
        if (isAbort) throw new Error('Conexão instável. Tente novamente.');
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
    const { error } = await supabase
      .from('tablet_orders')
      .update({ status: nextStatus })
      .eq('id', orderId);
    if (error) {
      console.error('[KDS] Bump failed:', error);
    }
    queryClient.invalidateQueries({ queryKey: ['kds-orders', unitId] });
  }, [unitId, queryClient]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  const ordersByStatus = useMemo(() => {
    const g = { awaiting_confirmation: [] as KDSOrder[], confirmed: [] as KDSOrder[], preparing: [] as KDSOrder[], ready: [] as KDSOrder[] };
    orders.forEach(o => { if (g[o.status as keyof typeof g]) g[o.status as keyof typeof g].push(o); });
    return g;
  }, [orders]);

  const COLUMNS = [
    { key: 'awaiting_confirmation' as const, label: 'Aguardando', accent: 'amber' },
    { key: 'confirmed' as const, label: 'Confirmado', accent: 'yellow' },
    { key: 'preparing' as const, label: 'Preparando', accent: 'orange' },
    { key: 'ready' as const, label: 'Pronto', accent: 'emerald' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(240,10%,4%)] text-white flex flex-col select-none">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[hsl(240,10%,5%)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/30">
            <ChefHat className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-tight">KDS</h1>
            <p className="text-[10px] text-white/40 font-medium -mt-0.5">Cozinha • {orders.length} pedidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-mono font-bold text-white/40 mr-1">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => setSoundEnabled(s => !s)} className="p-2 rounded-xl hover:bg-white/5 transition-colors" title={soundEnabled ? 'Mudo' : 'Som'}>
            {soundEnabled ? <Volume2 className="w-5 h-5 text-white/50" /> : <VolumeX className="w-5 h-5 text-white/25" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-xl hover:bg-white/5 transition-colors" title="Tela cheia">
            {isFullscreen ? <Minimize className="w-5 h-5 text-white/50" /> : <Maximize className="w-5 h-5 text-white/50" />}
          </button>
        </div>
      </header>

      {/* ── Column headers ── */}
      {isError && (
        <div className="mx-2.5 mt-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-destructive font-medium truncate">
            {(error as Error)?.message || 'Falha ao carregar pedidos'}
          </p>
          <button
            onClick={() => refetch()}
            className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 shrink-0">
        {COLUMNS.map(col => {
          const a = ACCENT_MAP[col.accent];
          const count = ordersByStatus[col.key].length;
          return (
            <div key={col.key} className={cn('flex items-center justify-center gap-2 py-2.5 border-b-2', count > 0 ? a.border : 'border-white/[0.04]')}>
              <span className={cn('text-[11px] font-bold uppercase tracking-widest', count > 0 ? a.text : 'text-white/20')}>
                {col.label}
              </span>
              {count > 0 && (
                <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-md', a.bg, a.text)}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Orders grid ── */}
      <div className="flex-1 grid grid-cols-4 gap-2.5 p-2.5 overflow-auto">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col gap-2.5">
            {ordersByStatus[col.key].map(order => (
              <OrderCard key={order.id} order={order} onBump={handleBump} onSelect={setSelectedOrder} />
            ))}
            {ordersByStatus[col.key].length === 0 && (
              <div className="flex-1 flex items-center justify-center min-h-[180px]">
                <span className="text-white/10 text-xs font-medium">Nenhum pedido</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Detail overlay ── */}
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onBump={handleBump} />
      )}

      {/* Loading */}
      {(isPending && !isError) && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      )}
    </div>
  );
}
