import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { startOfDay, differenceInMinutes } from 'date-fns';

export type Pulse = 'calm' | 'moderate' | 'intense';

export interface OperationPulse {
  overall: Pulse;
  salon: Pulse;
  kitchen: Pulse;
  delivery: Pulse;
  summary: string;
  totalActive: number;
}

export interface ServiceStats {
  salesToday: number;
  salesCount: number;
  activeOrders: number;
  activeDeliveries: number;
  hubActive: number;
}

export interface ActiveOrder {
  id: string;
  source: string;
  table_number: number;
  order_number: number | null;
  status: string;
  total: number;
  customer_name: string | null;
  created_at: string;
  minutesAgo: number;
}

export interface HourlySale {
  hour: number;
  total: number;
  count: number;
}

export interface ActiveDelivery {
  id: string;
  status: string;
  order_number: string | null;
  items_summary: string | null;
  total: number;
  created_at: string;
}

export interface HubActiveOrder {
  id: string;
  platform: string;
  platform_display_id: string | null;
  status: string;
  customer_name: string;
  total: number;
  received_at: string;
  minutesAgo: number;
}

export interface PipelineGroups {
  pending: ActiveOrder[];
  preparing: ActiveOrder[];
  ready: ActiveOrder[];
}

function calcPulse(count: number, avgMin: number, maxMin: number): Pulse {
  if (count > 15 || maxMin > 30) return 'intense';
  if (count >= 5 || avgMin >= 10) return 'moderate';
  return 'calm';
}

function worstPulse(...pulses: Pulse[]): Pulse {
  if (pulses.includes('intense')) return 'intense';
  if (pulses.includes('moderate')) return 'moderate';
  return 'calm';
}

const PULSE_LABELS: Record<Pulse, string> = {
  calm: 'tranquila',
  moderate: 'moderada',
  intense: 'intensa',
};

export function useServiceDashboard() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const todayStart = startOfDay(new Date()).toISOString();

  const { data: sales = [] } = useQuery({
    queryKey: ['service-sales', activeUnitId, todayStart],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data } = await supabase
        .from('pos_sales')
        .select('id, total, created_at, status')
        .eq('unit_id', activeUnitId)
        .eq('status', 'paid')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeUnitId,
    refetchInterval: 30000,
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['service-active-orders', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data } = await supabase
        .from('tablet_orders')
        .select('id, source, table_number, order_number, status, total, customer_name, created_at')
        .eq('unit_id', activeUnitId)
        .in('status', ['pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!activeUnitId,
    refetchInterval: 10000,
  });

  const { data: activeDeliveries = [] } = useQuery({
    queryKey: ['service-deliveries', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data } = await supabase
        .from('deliveries')
        .select('id, status, order_number, items_summary, total, created_at')
        .eq('unit_id', activeUnitId)
        .in('status', ['pending', 'out'])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeUnitId,
    refetchInterval: 15000,
  });

  const { data: hubOrders = [] } = useQuery({
    queryKey: ['service-hub-orders', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data } = await supabase
        .from('delivery_hub_orders')
        .select('id, platform, platform_display_id, status, customer_name, total, received_at')
        .eq('unit_id', activeUnitId)
        .in('status', ['new', 'accepted', 'preparing', 'ready', 'dispatched'])
        .order('received_at', { ascending: true });
      return data || [];
    },
    enabled: !!activeUnitId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!activeUnitId) return;
    const channel = supabase
      .channel(`service-dash-${activeUnitId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tablet_orders', filter: `unit_id=eq.${activeUnitId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['service-active-orders', activeUnitId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_hub_orders', filter: `unit_id=eq.${activeUnitId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['service-hub-orders', activeUnitId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeUnitId, queryClient]);

  const stats: ServiceStats = useMemo(() => ({
    salesToday: sales.reduce((sum, s) => sum + (s.total || 0), 0),
    salesCount: sales.length,
    activeOrders: activeOrders.length,
    activeDeliveries: activeDeliveries.length,
    hubActive: hubOrders.length,
  }), [sales, activeOrders, activeDeliveries, hubOrders]);

  const orders: ActiveOrder[] = useMemo(() => {
    const n = new Date();
    return activeOrders.map(o => ({
      ...o,
      source: o.source || 'mesa',
      minutesAgo: differenceInMinutes(n, new Date(o.created_at)),
    })) as ActiveOrder[];
  }, [activeOrders]);

  const pipeline: PipelineGroups = useMemo(() => {
    const pending: ActiveOrder[] = [];
    const preparing: ActiveOrder[] = [];
    const ready: ActiveOrder[] = [];
    orders.forEach(o => {
      if (['pending', 'awaiting_confirmation', 'confirmed'].includes(o.status)) pending.push(o);
      else if (o.status === 'preparing') preparing.push(o);
      else if (o.status === 'ready') ready.push(o);
    });
    return { pending, preparing, ready };
  }, [orders]);

  const hourlySales: HourlySale[] = useMemo(() => {
    const map = new Map<number, { total: number; count: number }>();
    sales.forEach(s => {
      const h = new Date(s.created_at).getHours();
      const existing = map.get(h) || { total: 0, count: 0 };
      map.set(h, { total: existing.total + s.total, count: existing.count + 1 });
    });
    return Array.from(map.entries())
      .map(([hour, v]) => ({ hour, ...v }))
      .sort((a, b) => a.hour - b.hour);
  }, [sales]);

  const deliveries: ActiveDelivery[] = activeDeliveries as ActiveDelivery[];

  const hubActive: HubActiveOrder[] = useMemo(() => {
    const n = new Date();
    return hubOrders.map(o => ({
      ...o,
      platform: o.platform || 'manual',
      minutesAgo: differenceInMinutes(n, new Date(o.received_at)),
    })) as HubActiveOrder[];
  }, [hubOrders]);

  // Pulse calculation
  const pulse: OperationPulse = useMemo(() => {
    const salonOrders = orders.filter(o => ['mesa', 'mesa_levar', 'qrcode'].includes(o.source));
    const kitchenOrders = orders.filter(o => o.status === 'preparing');
    const deliveryCount = activeDeliveries.length + hubActive.length;

    const avg = (arr: ActiveOrder[]) => arr.length === 0 ? 0 : arr.reduce((s, o) => s + o.minutesAgo, 0) / arr.length;
    const max = (arr: ActiveOrder[]) => arr.length === 0 ? 0 : Math.max(...arr.map(o => o.minutesAgo));

    const salon = calcPulse(salonOrders.length, avg(salonOrders), max(salonOrders));
    const kitchen = calcPulse(kitchenOrders.length, avg(kitchenOrders), max(kitchenOrders));
    const delivery = calcPulse(deliveryCount, 0, Math.max(...hubActive.map(h => h.minutesAgo), 0));

    const overall = worstPulse(salon, kitchen, delivery);
    const totalActive = orders.length + deliveryCount;

    const parts: string[] = [];
    if (kitchen === 'intense') parts.push('cozinha sob pressão');
    if (delivery === 'intense') parts.push('entregas acumulando');
    
    const summary = parts.length > 0
      ? `Operação ${PULSE_LABELS[overall]} — ${parts.join(', ')}`
      : `Operação ${PULSE_LABELS[overall]} — ${totalActive} pedido${totalActive !== 1 ? 's' : ''} ativo${totalActive !== 1 ? 's' : ''}`;

    return { overall, salon, kitchen, delivery, summary, totalActive };
  }, [orders, activeDeliveries, hubActive]);

  return { stats, orders, pipeline, hourlySales, deliveries, hubActive, pulse };
}
