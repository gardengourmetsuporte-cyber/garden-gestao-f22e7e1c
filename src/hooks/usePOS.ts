import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  codigo_pdv: string | null;
  is_active: boolean;
}

export interface CartItem {
  id: string; // unique cart line id
  product: POSProduct;
  quantity: number;
  unit_price: number;
  discount: number;
  notes: string;
}

export interface PendingOrder {
  id: string;
  source: string;
  customer_name: string | null;
  table_number: number | null;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; quantity: number; unit_price: number }[];
}

export interface PaymentLine {
  method: string;
  amount: number;
  change_amount: number;
}

export function usePOS() {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [savingSale, setSavingSale] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [saleSource, setSaleSource] = useState<'balcao' | 'mesa' | 'delivery'>('balcao');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!activeUnitId) return;
    setLoadingProducts(true);
    const { data } = await supabase
      .from('tablet_products')
      .select('id, name, price, image_url, category, codigo_pdv, is_active')
      .eq('unit_id', activeUnitId)
      .eq('is_active', true)
      .order('category')
      .order('name');
    const prods = (data || []) as POSProduct[];
    setProducts(prods);
    const cats = [...new Set(prods.map(p => p.category).filter(Boolean))];
    setCategories(cats);
    setLoadingProducts(false);
  }, [activeUnitId]);

  // Fetch pending orders (tablet + delivery hub)
  const fetchPendingOrders = useCallback(async () => {
    if (!activeUnitId) return;
    setLoadingOrders(true);
    
    // Tablet orders
    const { data: tabletData } = await supabase
      .from('tablet_orders')
      .select('id, source, customer_name, table_number, total, status, created_at, tablet_order_items(quantity, unit_price, tablet_products(name))')
      .eq('unit_id', activeUnitId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    // Delivery hub orders
    const { data: deliveryData } = await supabase
      .from('delivery_hub_orders')
      .select('id, customer_name, customer_phone, total, status, created_at, platform')
      .eq('unit_id', activeUnitId)
      .in('status', ['new', 'accepted', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    const orders: PendingOrder[] = [];

    (tabletData || []).forEach((o: any) => {
      orders.push({
        id: o.id,
        source: o.source || 'mesa',
        customer_name: o.customer_name,
        table_number: o.table_number,
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
        table_number: null,
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
    fetchProducts();
    fetchPendingOrders();
  }, [fetchProducts, fetchPendingOrders]);

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

  // Cart operations
  const addToCart = useCallback((product: POSProduct, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.notes);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, {
        id: crypto.randomUUID(),
        product,
        quantity: qty,
        unit_price: product.price,
        discount: 0,
        notes: '',
      }];
    });
  }, []);

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setCustomerDocument('');
    setTableNumber(null);
    setDiscount(0);
    setSaleNotes('');
    setSaleSource('balcao');
    setDeliveryPhone('');
    setDeliveryAddress('');
  }, []);

  // Load order into cart
  const loadOrderIntoCart = useCallback((order: PendingOrder) => {
    const normalizeSource = (source: string): 'balcao' | 'mesa' | 'delivery' => {
      const s = (source || '').toLowerCase();
      if (s === 'balcao') return 'balcao';
      if (s === 'delivery' || s === 'ifood' || s === 'aiqfome' || s === 'anota_ai') return 'delivery';
      return 'mesa';
    };

    setCart(order.items.map(item => ({
      id: crypto.randomUUID(),
      product: { id: '', name: item.name, price: item.unit_price, image_url: null, category: '', codigo_pdv: null, is_active: true },
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: 0,
      notes: '',
    })));
    setSaleSource(normalizeSource(order.source));
    setCustomerName(order.customer_name || '');
    setTableNumber(order.table_number);
  }, []);

  // Totals
  const subtotal = cart.reduce((sum, i) => sum + (i.quantity * i.unit_price - i.discount), 0);
  const total = Math.max(0, subtotal - discount);

  // Finalize sale
  const finalizeSale = useCallback(async (payments: PaymentLine[], sourceOrderId?: string) => {
    if (!activeUnitId || !user?.id) return null;
    const paymentTotal = payments.reduce((s, p) => s + p.amount, 0);
    if (paymentTotal < total) {
      toast.error('Valor dos pagamentos insuficiente');
      return null;
    }

    setSavingSale(true);
    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('pos_sales')
        .insert({
          unit_id: activeUnitId,
          user_id: user.id,
          source: sourceOrderId ? 'pedido' : saleSource,
          source_order_id: sourceOrderId || null,
          customer_name: customerName || null,
          customer_document: customerDocument || null,
          table_number: tableNumber,
          subtotal,
          discount,
          total,
          status: 'paid',
          notes: saleNotes || null,
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (saleError) throw saleError;

      // Insert items
      if (cart.length > 0) {
        const { error: itemsError } = await supabase
          .from('pos_sale_items')
          .insert(cart.map(i => ({
            sale_id: sale.id,
            product_id: i.product.id || null,
            product_name: i.product.name,
            product_code: i.product.codigo_pdv || null,
            quantity: i.quantity,
            unit_price: i.unit_price,
            discount: i.discount,
            total_price: i.quantity * i.unit_price - i.discount,
            notes: i.notes || null,
          })));
        if (itemsError) throw itemsError;
      }

      // Insert payments
      const { error: payError } = await supabase
        .from('pos_sale_payments')
        .insert(payments.map(p => ({
          sale_id: sale.id,
          method: p.method,
          amount: p.amount,
          change_amount: p.change_amount,
        })));
      if (payError) throw payError;

      // If came from tablet order, mark as delivered
      if (sourceOrderId) {
        await supabase.from('tablet_orders').update({ status: 'delivered' }).eq('id', sourceOrderId);
      }

      toast.success('Venda finalizada!');
      clearCart();
      fetchPendingOrders();
      return sale.id;
    } catch (err: any) {
      toast.error('Erro ao finalizar venda: ' + err.message);
      return null;
    } finally {
      setSavingSale(false);
    }
  }, [activeUnitId, user, cart, customerName, customerDocument, tableNumber, subtotal, discount, total, saleNotes, saleSource, clearCart, fetchPendingOrders]);

  // Send order (mesa/delivery) — creates a tablet_order instead of a sale
  const sendOrder = useCallback(async () => {
    if (!activeUnitId || !user?.id) return null;
    if (cart.length === 0) { toast.error('Carrinho vazio'); return null; }

    if (saleSource === 'mesa' && !tableNumber) {
      toast.error('Informe o número da mesa');
      return null;
    }
    if (saleSource === 'balcao' && !customerName.trim()) {
      toast.error('Informe o nome do cliente');
      return null;
    }
    if (saleSource === 'delivery') {
      if (!customerName.trim()) { toast.error('Informe o nome do cliente'); return null; }
      if (!deliveryPhone.trim()) { toast.error('Informe o telefone'); return null; }
      if (!deliveryAddress.trim()) { toast.error('Informe o endereço'); return null; }
    }

    setSavingSale(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('tablet_orders')
        .insert({
          unit_id: activeUnitId,
          table_number: tableNumber || 0,
          status: 'pending',
          total,
          source: saleSource,
          customer_name: customerName.trim() || null,
          customer_phone: saleSource === 'delivery' ? deliveryPhone.replace(/\D/g, '') : null,
          customer_address: saleSource === 'delivery' ? deliveryAddress.trim() : null,
        })
        .select('id')
        .single();

      if (orderError || !order) throw new Error(orderError?.message || 'Erro ao criar pedido');

      const items = cart.map(c => ({
        order_id: order.id,
        product_id: c.product.id || null,
        quantity: c.quantity,
        notes: c.notes || null,
        unit_price: c.unit_price,
      }));

      const { error: itemsError } = await supabase.from('tablet_order_items').insert(items);
      if (itemsError) throw new Error(itemsError.message);

      toast.success('Pedido enviado!');
      clearCart();
      fetchPendingOrders();
      return order.id;
    } catch (err: any) {
      toast.error('Erro ao enviar pedido: ' + (err.message || 'erro desconhecido'));
      return null;
    } finally {
      setSavingSale(false);
    }
  }, [activeUnitId, user, cart, saleSource, customerName, deliveryPhone, deliveryAddress, tableNumber, total, clearCart, fetchPendingOrders]);

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string) => {
    if (!activeUnitId) return false;
    try {
      // Cancel the tablet order
      const { error: orderErr } = await supabase
        .from('tablet_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (orderErr) throw orderErr;

      // Cancel linked pos_sale if exists
      await supabase
        .from('pos_sales')
        .update({ status: 'cancelled' })
        .eq('source_order_id', orderId)
        .eq('unit_id', activeUnitId);

      toast.success('Pedido cancelado!');
      clearCart();
      fetchPendingOrders();
      return true;
    } catch (err: any) {
      toast.error('Erro ao cancelar: ' + err.message);
      return false;
    }
  }, [activeUnitId, clearCart, fetchPendingOrders]);

  // Validate PIN and check permission
  const validatePinWithPermission = useCallback(async (pin: string, requiredModule: string): Promise<{ authorized: boolean; userName: string }> => {
    if (!activeUnitId) return { authorized: false, userName: '' };

    // Find employee by PIN
    const { data: emp } = await supabase
      .from('employees')
      .select('user_id, full_name')
      .eq('unit_id', activeUnitId)
      .eq('quick_pin', pin)
      .eq('is_active', true)
      .not('user_id', 'is', null)
      .maybeSingle();

    if (!emp?.user_id) return { authorized: false, userName: '' };

    // Check access level
    const { data: uu } = await supabase
      .from('user_units')
      .select('access_level_id, role')
      .eq('user_id', emp.user_id)
      .eq('unit_id', activeUnitId)
      .maybeSingle();

    // Owner/admin always authorized
    if (uu?.role === 'owner' || uu?.role === 'admin') {
      return { authorized: true, userName: emp.full_name };
    }

    if (!uu?.access_level_id) return { authorized: false, userName: emp.full_name };

    const { data: al } = await supabase
      .from('access_levels')
      .select('modules')
      .eq('id', uu.access_level_id)
      .maybeSingle();

    const hasPermission = al?.modules?.includes(requiredModule) ?? false;
    return { authorized: hasPermission, userName: emp.full_name };
  }, [activeUnitId]);

  return {
    products, categories, cart, pendingOrders,
    loadingProducts, loadingOrders, savingSale,
    customerName, setCustomerName,
    customerDocument, setCustomerDocument,
    tableNumber, setTableNumber,
    discount, setDiscount,
    saleNotes, setSaleNotes,
    saleSource, setSaleSource,
    deliveryPhone, setDeliveryPhone,
    deliveryAddress, setDeliveryAddress,
    subtotal, total,
    addToCart, updateCartItem, removeFromCart, clearCart,
    loadOrderIntoCart, finalizeSale, sendOrder, fetchPendingOrders,
    cancelOrder, validatePinWithPermission,
  };
}
