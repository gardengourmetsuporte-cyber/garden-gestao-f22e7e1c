import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HubPlatform = 'ifood' | 'rappi' | 'uber_eats' | 'aiqfome' | 'manual';
export type HubOrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';

export interface HubOrder {
  id: string;
  unit_id: string;
  platform: HubPlatform;
  platform_order_id: string | null;
  platform_display_id: string | null;
  status: HubOrderStatus;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string | null;
  notes: string | null;
  platform_data: any;
  received_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  items?: HubOrderItem[];
}

export interface HubOrderItem {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  options: any[];
}

const STATUS_FLOW: Record<HubOrderStatus, HubOrderStatus[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['dispatched'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function useDeliveryHub(unitId: string | undefined) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<HubOrderStatus | 'active' | 'all'>('active');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['delivery-hub-orders', unitId, statusFilter],
    queryFn: async () => {
      if (!unitId) return [];
      let query = supabase
        .from('delivery_hub_orders')
        .select('*')
        .eq('unit_id', unitId)
        .order('received_at', { ascending: false })
        .limit(100);

      if (statusFilter === 'active') {
        query = query.in('status', ['new', 'accepted', 'preparing', 'ready', 'dispatched']);
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as HubOrder[]) || [];
    },
    enabled: !!unitId,
    refetchInterval: 15000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!unitId) return;
    const channel = supabase
      .channel(`hub-orders-${unitId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_hub_orders',
        filter: `unit_id=eq.${unitId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['delivery-hub-orders', unitId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [unitId, queryClient]);

  const fetchOrderItems = useCallback(async (orderId: string): Promise<HubOrderItem[]> => {
    const { data } = await supabase
      .from('delivery_hub_order_items')
      .select('*')
      .eq('order_id', orderId);
    return (data as unknown as HubOrderItem[]) || [];
  }, []);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, cancelReason }: { orderId: string; status: HubOrderStatus; cancelReason?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delivery-hub-webhook?action=update-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ order_id: orderId, status, cancel_reason: cancelReason }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-hub-orders', unitId] });
    },
  });

  const getNextStatuses = (currentStatus: HubOrderStatus) => STATUS_FLOW[currentStatus] || [];

  const stats = {
    new: orders.filter(o => o.status === 'new').length,
    active: orders.filter(o => ['accepted', 'preparing', 'ready', 'dispatched'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    total: orders.length,
  };

  return {
    orders,
    isLoading,
    statusFilter,
    setStatusFilter,
    updateStatus,
    fetchOrderItems,
    getNextStatuses,
    stats,
  };
}
