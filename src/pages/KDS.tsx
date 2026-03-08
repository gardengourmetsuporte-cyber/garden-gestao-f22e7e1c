import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChefHat, Clock, Maximize, Minimize, Volume2, VolumeX, UtensilsCrossed, Truck, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; next: string | null; nextLabel: string }> = {
  awaiting_confirmation: {
    label: 'Aguardando',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    next: 'confirmed',
    nextLabel: 'ACEITAR',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/40',
    next: 'preparing',
    nextLabel: 'PREPARAR',
  },
  preparing: {
    label: 'Preparando',
    color: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/40',
    next: 'ready',
    nextLabel: 'PRONTO ✓',
  },
  ready: {
    label: 'Pronto',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    next: 'delivered',
    nextLabel: 'ENTREGUE',
  },
};

function ElapsedTime({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  const isUrgent = minutes >= 10;
  const isCritical = minutes >= 15;

  return (
    <span className={cn(
      'flex items-center gap-1 text-sm font-mono font-bold',
      isCritical ? 'text-red-400 animate-pulse' : isUrgent ? 'text-orange-400' : 'text-muted-foreground'
    )}>
      <Clock className="w-3.5 h-3.5" />
      {minutes} min
    </span>
  );
}

function OrderCard({ order, onBump }: { order: KDSOrder; onBump: (id: string, nextStatus: string) => void }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const source = order.source || 'mesa';
  const items = order.tablet_order_items || [];
  const shortId = order.id.slice(0, 4).toUpperCase();

  return (
    <div className={cn(
      'flex flex-col rounded-xl border-2 overflow-hidden transition-all',
      config.bg, config.border,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-white">#{shortId}</span>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', config.bg, config.color)}>
            {config.label}
          </span>
        </div>
        <ElapsedTime createdAt={order.created_at} />
      </div>

      {/* Source & customer */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        {source === 'delivery' ? (
          <Truck className="w-4 h-4 text-blue-400" />
        ) : (
          <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
        )}
        <span className="text-sm font-semibold text-white/80">
          {source === 'delivery' ? 'Delivery' : `Mesa ${order.table_number}`}
        </span>
        {order.customer_name && (
          <span className="text-xs text-muted-foreground truncate ml-auto">
            {order.customer_name}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-1.5 min-h-[80px]">
        {items.map(item => (
          <div key={item.id} className="flex gap-2 items-start">
            <span className="text-sm font-bold text-white/90 shrink-0">{item.quantity}x</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white/80 block truncate">
                {item.tablet_products?.name || 'Item'}
              </span>
              {item.notes && (
                <span className="text-xs text-amber-400/80 block truncate">⚠ {item.notes}</span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground">Sem itens</span>
        )}
      </div>

      {/* Action button */}
      {config.next && (
        <button
          onClick={() => onBump(order.id, config.next!)}
          className={cn(
            'w-full py-4 text-base font-black tracking-wide transition-all active:scale-[0.98]',
            order.status === 'awaiting_confirmation' && 'bg-amber-500 text-black hover:bg-amber-400',
            order.status === 'confirmed' && 'bg-yellow-500 text-black hover:bg-yellow-400',
            order.status === 'preparing' && 'bg-emerald-500 text-black hover:bg-emerald-400',
            order.status === 'ready' && 'bg-blue-500 text-white hover:bg-blue-400',
          )}
        >
          {config.nextLabel}
        </button>
      )}
    </div>
  );
}

export default function KDS() {
  const { unitId } = useParams<{ unitId: string }>();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch active orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kds-orders', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('tablet_orders')
        .select('*, tablet_order_items(*, tablet_products(name, codigo_pdv))')
        .eq('unit_id', unitId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data as unknown as KDSOrder[]) || [];
    },
    enabled: !!unitId,
    refetchInterval: 10_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!unitId) return;
    const channel = supabase
      .channel(`kds-${unitId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tablet_orders',
        filter: `unit_id=eq.${unitId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['kds-orders', unitId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [unitId, queryClient]);

  // Audio alert on new orders
  useEffect(() => {
    const currentIds = new Set(orders.map(o => o.id));
    const prevIds = prevOrderIdsRef.current;
    if (prevIds.size > 0 && soundEnabled) {
      const hasNew = orders.some(o => !prevIds.has(o.id));
      if (hasNew) {
        playBeep();
      }
    }
    prevOrderIdsRef.current = currentIds;
  }, [orders, soundEnabled]);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  // Bump order to next status
  const handleBump = useCallback(async (orderId: string, nextStatus: string) => {
    const updateData: any = { status: nextStatus };
    if (nextStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }
    await supabase.from('tablet_orders').update(updateData).eq('id', orderId);
    queryClient.invalidateQueries({ queryKey: ['kds-orders', unitId] });
  }, [unitId, queryClient]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const ordersByStatus = useMemo(() => {
    const grouped = { awaiting_confirmation: [] as KDSOrder[], confirmed: [] as KDSOrder[], preparing: [] as KDSOrder[], ready: [] as KDSOrder[] };
    orders.forEach(o => {
      if (grouped[o.status as keyof typeof grouped]) {
        grouped[o.status as keyof typeof grouped].push(o);
      }
    });
    return grouped;
  }, [orders]);

  const totalActive = orders.length;

  return (
    <div className="min-h-screen bg-[hsl(240,10%,4%)] text-white flex flex-col select-none">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[hsl(240,10%,6%)] shrink-0">
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-emerald-400" />
          <h1 className="text-xl font-black tracking-tight">KDS - Cozinha</h1>
          <span className="ml-2 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full">
            {totalActive} {totalActive === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono font-bold text-white/60">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={soundEnabled ? 'Desativar som' : 'Ativar som'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Status columns header */}
      <div className="grid grid-cols-4 gap-px bg-white/5 text-center text-xs font-bold uppercase tracking-widest py-2 shrink-0">
        <span className="text-amber-400">Aguardando ({ordersByStatus.awaiting_confirmation.length})</span>
        <span className="text-yellow-400">Confirmado ({ordersByStatus.confirmed.length})</span>
        <span className="text-orange-400">Preparando ({ordersByStatus.preparing.length})</span>
        <span className="text-emerald-400">Pronto ({ordersByStatus.ready.length})</span>
      </div>

      {/* Orders grid */}
      <div className="flex-1 grid grid-cols-4 gap-3 p-3 overflow-auto">
        {(['awaiting_confirmation', 'confirmed', 'preparing', 'ready'] as const).map(status => (
          <div key={status} className="flex flex-col gap-3">
            {ordersByStatus[status].map(order => (
              <OrderCard key={order.id} order={order} onBump={handleBump} />
            ))}
            {ordersByStatus[status].length === 0 && (
              <div className="flex-1 flex items-center justify-center text-white/20 text-sm font-medium min-h-[200px]">
                Nenhum pedido
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      )}
    </div>
  );
}
