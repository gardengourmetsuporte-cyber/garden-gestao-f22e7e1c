import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { startOfDay, differenceInMinutes } from 'date-fns';

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

export function useServiceDashboard() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const todayStart = startOfDay(new Date()).toISOString();

  // POS Sales today
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

  // Active tablet orders
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

  // Active deliveries
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

  // Hub orders active
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

  // Realtime for tablet_orders and delivery_hub_orders
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

  const hubActive: HubActiveOrder[] = useMemo(() =>
    hubOrders.map(o => ({
      ...o,
      platform: o.platform || 'manual',
      minutesAgo: differenceInMinutes(now, new Date(o.received_at)),
    })) as HubActiveOrder[],
    [hubOrders]
  );

  return { stats, orders, hourlySales, deliveries, hubActive };
}
