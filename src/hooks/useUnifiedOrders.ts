import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeliveryHub, HubOrder } from './useDeliveryHub';

export type OrderSource = 'mesa' | 'delivery';
export type UnifiedTab = 'comandas' | 'delivery' | 'ifood';

export interface TabletOrder {
  id: string;
  unit_id: string;
  table_number: number;
  status: string;
  total: number;
  error_message: string | null;
  created_at: string;
  source: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  tablet_order_items?: any[];
}

export function useUnifiedOrders(unitId: string | undefined) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<UnifiedTab>('comandas');

  // Tablet orders (mesa + delivery)
  const { data: tabletOrders = [], isLoading: tabletLoading } = useQuery({
    queryKey: ['unified-tablet-orders', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('tablet_orders')
        .select('*, tablet_order_items(*, tablet_products(name, codigo_pdv))')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as unknown as TabletOrder[]) || [];
    },
    enabled: !!unitId,
    refetchInterval: 15000,
  });

  // Realtime for tablet_orders
  useEffect(() => {
    if (!unitId) return;
    const channel = supabase
      .channel(`unified-orders-${unitId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tablet_orders',
        filter: `unit_id=eq.${unitId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['unified-tablet-orders', unitId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [unitId, queryClient]);

  // Delivery hub (iFood/Rappi)
  const deliveryHub = useDeliveryHub(unitId);

  const comandas = useMemo(() =>
    tabletOrders.filter(o => (o.source || 'mesa') === 'mesa'),
    [tabletOrders]
  );

  const deliveryOrders = useMemo(() =>
    tabletOrders.filter(o => o.source === 'delivery'),
    [tabletOrders]
  );

  const stats = useMemo(() => ({
    comandas: comandas.length,
    delivery: deliveryOrders.length,
    ifood: deliveryHub.stats.total,
    comandasPending: comandas.filter(o => ['awaiting_confirmation', 'confirmed'].includes(o.status)).length,
    deliveryPending: deliveryOrders.filter(o => ['awaiting_confirmation', 'confirmed'].includes(o.status)).length,
    ifoodNew: deliveryHub.stats.new,
  }), [comandas, deliveryOrders, deliveryHub.stats]);

  return {
    activeTab,
    setActiveTab,
    comandas,
    deliveryOrders,
    hubOrders: deliveryHub.orders,
    hubUpdateStatus: deliveryHub.updateStatus,
    hubGetNextStatuses: deliveryHub.getNextStatuses,
    isLoading: tabletLoading || deliveryHub.isLoading,
    stats,
  };
}
