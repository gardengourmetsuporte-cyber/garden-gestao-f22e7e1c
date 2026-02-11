import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, OrderStatus } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export function useOrders() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
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

      if (activeUnitId) {
        query = query.eq('unit_id', activeUnitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [activeUnitId]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchOrders().finally(() => setIsLoading(false));
    }
  }, [user, fetchOrders]);

  const createOrder = useCallback(async (
    supplierId: string,
    items: { item_id: string; quantity: number; notes?: string }[]
  ) => {
    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        supplier_id: supplierId,
        created_by: user?.id,
        status: 'draft' as OrderStatus,
      })
      .select(`*, supplier:suppliers(*)`)
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      item_id: item.item_id,
      quantity: item.quantity,
      notes: item.notes,
    }));

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select(`*, item:inventory_items(*, category:categories(*))`);

    if (itemsError) throw itemsError;

    const fullOrder = {
      ...orderData,
      order_items: itemsData,
    } as Order;

    setOrders(prev => [fullOrder, ...prev]);
    return fullOrder;
  }, [user?.id]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const updates: { status: OrderStatus; sent_at?: string } = { status };
    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select(`
        *,
        supplier:suppliers(*),
        order_items(*, item:inventory_items(*, category:categories(*)))
      `)
      .single();

    if (error) throw error;
    setOrders(prev => prev.map(o => o.id === orderId ? (data as Order) : o));
    return data as Order;
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    // First delete order items (required due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Then delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const updateOrderItem = useCallback(async (
    itemId: string,
    updates: { quantity?: number; notes?: string }
  ) => {
    const { error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;
    await fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    updateOrderItem,
    refetch: fetchOrders,
  };
}
