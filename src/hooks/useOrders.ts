import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

async function fetchOrdersData(unitId: string | null): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      supplier:suppliers(*),
      order_items(
        *,
        item:inventory_items(*, category:categories(*))
      )
    `)
    .order('created_at', { ascending: false });

  if (unitId) {
    query = query.eq('unit_id', unitId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Order[]) || [];
}

export function useOrders() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['orders', activeUnitId];

  const { data: orders = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchOrdersData(activeUnitId),
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, activeUnitId]);

  const createOrderMut = useMutation({
    mutationFn: async ({ supplierId, items }: {
      supplierId: string;
      items: { item_id: string; quantity: number; notes?: string }[];
    }) => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          supplier_id: supplierId,
          created_by: user?.id,
          status: 'draft' as OrderStatus,
        })
        .select('*, supplier:suppliers(*)')
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        item_id: item.item_id,
        quantity: item.quantity,
        notes: item.notes,
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select('*, item:inventory_items(*, category:categories(*))');

      if (itemsError) throw itemsError;

      return { ...orderData, order_items: itemsData } as Order;
    },
    onSuccess: invalidate,
  });

  const updateOrderStatusMut = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const updates: { status: OrderStatus; sent_at?: string } = { status };
      if (status === 'sent') updates.sent_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select('*, supplier:suppliers(*), order_items(*, item:inventory_items(*, category:categories(*)))')
        .single();

      if (error) throw error;
      return data as Order;
    },
    onSuccess: invalidate,
  });

  const deleteOrderMut = useMutation({
    mutationFn: async (orderId: string) => {
      const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (itemsError) throw itemsError;
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateOrderItemMut = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: { quantity?: number; notes?: string } }) => {
      const { error } = await supabase.from('order_items').update(updates).eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    orders,
    isLoading,
    createOrder: (supplierId: string, items: { item_id: string; quantity: number; notes?: string }[]) =>
      createOrderMut.mutateAsync({ supplierId, items }),
    updateOrderStatus: (orderId: string, status: OrderStatus) =>
      updateOrderStatusMut.mutateAsync({ orderId, status }),
    deleteOrder: (orderId: string) => deleteOrderMut.mutateAsync(orderId),
    updateOrderItem: (itemId: string, updates: { quantity?: number; notes?: string }) =>
      updateOrderItemMut.mutateAsync({ itemId, updates }),
    refetch: invalidate,
  };
}
