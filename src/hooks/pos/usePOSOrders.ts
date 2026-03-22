import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PendingOrder } from './types';

export function usePOSOrders(activeUnitId: string | null) {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchPendingOrders = useCallback(async () => {
    if (!activeUnitId) return;
    setLoadingOrders(true);

    const { data: tabletData } = await supabase
      .from('tablet_orders')
      .select('id, source, customer_name, customer_phone, customer_address, table_number, order_number, comanda_number, total, status, created_at, tablet_order_items(quantity, unit_price, tablet_products(name))')
      .eq('unit_id', activeUnitId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    const { data: deliveryData } = await supabase
      .from('delivery_hub_orders')
      .select('id, customer_name, customer_phone, customer_address, total, status, created_at, platform')
      .eq('unit_id', activeUnitId)
      .in('status', ['new', 'accepted', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    const orders: PendingOrder[] = [];

    (tabletData || []).forEach((o: any) => {
      orders.push({
        id: o.id,
        source: o.source || 'mesa',
        customer_name: o.customer_name,
        customer_phone: o.customer_phone || null,
        customer_address: o.customer_address || null,
        table_number: o.table_number,
        order_number: o.order_number ?? null,
        comanda_number: o.comanda_number ?? null,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
        items: (o.tablet_order_items || []).map((i: any) => ({
          name: i.tablet_products?.name || '?',
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
    });

    (deliveryData || []).forEach((o: any) => {
      orders.push({
        id: o.id,
        source: o.platform || 'delivery',
        customer_name: o.customer_name,
        customer_phone: o.customer_phone || null,
        customer_address: o.customer_address || null,
        table_number: null,
        order_number: null,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
        items: [],
      });
    });

    setPendingOrders(orders);
    setLoadingOrders(false);
  }, [activeUnitId]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  // Realtime for orders
  useEffect(() => {
    if (!activeUnitId) return;
    const channel = supabase
      .channel('pos-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tablet_orders', filter: `unit_id=eq.${activeUnitId}` }, () => fetchPendingOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_hub_orders', filter: `unit_id=eq.${activeUnitId}` }, () => fetchPendingOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeUnitId, fetchPendingOrders]);

  const removeOrderLocally = useCallback((orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  return { pendingOrders, loadingOrders, fetchPendingOrders, removeOrderLocally };
}
