import { useState, useCallback } from 'react';
import type { POSProduct, CartItem, PendingOrder } from './types';

export function usePOSCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [saleSource, setSaleSource] = useState<'balcao' | 'mesa' | 'delivery'>('balcao');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

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

  const subtotal = cart.reduce((sum, i) => sum + (i.quantity * i.unit_price - i.discount), 0);
  const total = Math.max(0, subtotal - discount);

  return {
    cart, subtotal, total,
    customerName, setCustomerName,
    customerDocument, setCustomerDocument,
    tableNumber, setTableNumber,
    discount, setDiscount,
    saleNotes, setSaleNotes,
    saleSource, setSaleSource,
    deliveryPhone, setDeliveryPhone,
    deliveryAddress, setDeliveryAddress,
    addToCart, updateCartItem, removeFromCart, clearCart, loadOrderIntoCart,
  };
}
