import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { enqueueOperation, setCache, getCache } from '@/lib/offlineDb';
import { toast } from 'sonner';

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
  const { isConnected } = useOnlineStatus();

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    if (isConnected) {
      const { data } = await supabase
        .from('tablet_products')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('category')
        .order('sort_order');
      const prods = (data as TabletProduct[]) || [];
      setProducts(prods);
      // Cache for offline
      try {
        await setCache({ key: `tablet-products-${unitId}`, type: 'products', data: prods, updatedAt: new Date().toISOString() });
      } catch {}
    } else {
      // Load from cache
      try {
        const cached = await getCache(`tablet-products-${unitId}`);
        if (cached?.data) {
          setProducts(cached.data as TabletProduct[]);
        }
      } catch {}
    }

    setLoading(false);
  }, [unitId, isConnected]);

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

  const createOrder = async (tableNumber: number, comandaNumber?: number | null) => {
    setLoading(true);

    const orderData = {
      unit_id: unitId,
      table_number: comandaNumber || tableNumber,
      comanda_number: comandaNumber || null,
      status: 'confirmed',
      total: cartTotal,
      source: 'mesa' as const,
    };

    const itemsData = cart.map(c => ({
      product_id: c.product.id,
      quantity: c.quantity,
      notes: c.notes || null,
      unit_price: c.product.price,
    }));

    // ---- Offline path ----
    if (!isConnected) {
      try {
        const offlineId = crypto.randomUUID();
        await enqueueOperation({
          id: offlineId,
          type: 'tablet_order',
          payload: { order: orderData, items: itemsData },
          createdAt: new Date().toISOString(),
          retries: 0,
          status: 'pending',
        });
        setCart([]);
        setOrderStatus('queued_offline');
        toast.success('Pedido salvo offline!', { description: 'Será enviado quando a conexão voltar.' });
        setLoading(false);
        return { orderId: offlineId };
      } catch {
        toast.error('Erro ao salvar pedido offline');
        setLoading(false);
        throw new Error('Falha ao salvar offline');
      }
    }

    // ---- Online path ----
    try {
      const { data: order, error: orderError } = await supabase
        .from('tablet_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError || !order) throw new Error(orderError?.message || 'Erro ao criar pedido');

      const items = itemsData.map(i => ({ ...i, order_id: (order as any).id }));

      const { error: itemsError } = await supabase
        .from('tablet_order_items')
        .insert(items);

      if (itemsError) throw new Error(itemsError.message);

      // Try to send to PDV
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=send-to-pdv`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ order_id: (order as any).id }),
          }
        );
      } catch (e) {
        console.warn('[useTabletOrder] send-to-pdv failed:', e);
      }

      setCart([]);
      setOrderStatus('confirmed');
      toast.success('Pedido enviado com sucesso!');
      return { orderId: (order as any).id };
    } catch (err: any) {
      // If network error, try offline queue
      if (!navigator.onLine || err.message?.includes('fetch')) {
        try {
          const offlineId = crypto.randomUUID();
          await enqueueOperation({
            id: offlineId,
            type: 'tablet_order',
            payload: { order: orderData, items: itemsData },
            createdAt: new Date().toISOString(),
            retries: 0,
            status: 'pending',
          });
          setCart([]);
          setOrderStatus('queued_offline');
          toast.success('Pedido salvo offline!', { description: 'Será enviado quando a conexão voltar.' });
          return { orderId: offlineId, token: offlineId };
        } catch {}
      }
      console.error('Error creating order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string, token: string) => {
    setLoading(true);
    try {
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
