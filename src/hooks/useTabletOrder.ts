import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TabletProduct {
  id: string;
  name: string;
  codigo_pdv: string | null;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
}

export interface CartItem {
  product: TabletProduct;
  quantity: number;
  notes: string;
}

export function useTabletOrder(unitId: string) {
  const [products, setProducts] = useState<TabletProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tablet_products')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .order('category')
      .order('sort_order');
    setProducts((data as TabletProduct[]) || []);
    setLoading(false);
  }, [unitId]);

  const addToCart = (product: TabletProduct) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(c =>
        c.product.id === productId ? { ...c, quantity } : c
      )
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setCart(prev =>
      prev.map(c =>
        c.product.id === productId ? { ...c, notes } : c
      )
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const createOrder = async (tableNumber: number) => {
    setLoading(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('tablet_orders')
        .insert({
          unit_id: unitId,
          table_number: tableNumber,
          status: 'awaiting_confirmation',
          total: cartTotal,
        })
        .select()
        .single();

      if (orderError || !order) throw new Error(orderError?.message || 'Erro ao criar pedido');

      // Create order items
      const items = cart.map(c => ({
        order_id: (order as any).id,
        product_id: c.product.id,
        quantity: c.quantity,
        notes: c.notes || null,
        unit_price: c.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('tablet_order_items')
        .insert(items);

      if (itemsError) throw new Error(itemsError.message);

      // Generate QR token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes

      const { error: qrError } = await supabase
        .from('tablet_qr_confirmations')
        .insert({
          order_id: (order as any).id,
          token,
          expires_at: expiresAt,
        });

      if (qrError) throw new Error(qrError.message);

      setCart([]);
      setOrderStatus('awaiting_confirmation');
      return { orderId: (order as any).id, token };
    } catch (err: any) {
      console.error('Error creating order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string, token: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('tablet-order', {
        body: { order_id: orderId, token },
        headers: {},
      });

      // The edge function URL needs action param
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=confirm-qr`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ order_id: orderId, token }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao confirmar pedido');

      setOrderStatus('confirmed');
      return data;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    cart,
    cartTotal,
    loading,
    orderStatus,
    fetchProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNotes,
    createOrder,
    confirmOrder,
    setCart,
  };
}
