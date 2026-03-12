import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePOSCart } from '../usePOSCart';
import type { POSProduct, PendingOrder } from '../types';

const makeProduct = (overrides: Partial<POSProduct> = {}): POSProduct => ({
  id: 'prod-1',
  name: 'Hamburguer',
  price: 25,
  image_url: null,
  category: 'Lanches',
  codigo_pdv: null,
  is_active: true,
  ...overrides,
});

describe('usePOSCart', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => usePOSCart());
    expect(result.current.cart).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('adds product to cart', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(makeProduct()));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.subtotal).toBe(25);
  });

  it('merges quantity for same product', () => {
    const { result } = renderHook(() => usePOSCart());
    const p = makeProduct();
    act(() => result.current.addToCart(p));
    act(() => result.current.addToCart(p, 2));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(3);
    expect(result.current.subtotal).toBe(75);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(makeProduct()));
    const itemId = result.current.cart[0].id;
    act(() => result.current.removeFromCart(itemId));
    expect(result.current.cart).toHaveLength(0);
  });

  it('updates cart item', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(makeProduct()));
    const itemId = result.current.cart[0].id;
    act(() => result.current.updateCartItem(itemId, { quantity: 5 }));
    expect(result.current.cart[0].quantity).toBe(5);
  });

  it('applies global discount', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(makeProduct({ price: 100 })));
    act(() => result.current.setDiscount(20));
    expect(result.current.subtotal).toBe(100);
    expect(result.current.total).toBe(80);
  });

  it('total never goes below 0', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => result.current.addToCart(makeProduct({ price: 10 })));
    act(() => result.current.setDiscount(999));
    expect(result.current.total).toBe(0);
  });

  it('clears cart and resets all fields', () => {
    const { result } = renderHook(() => usePOSCart());
    act(() => {
      result.current.addToCart(makeProduct());
      result.current.setCustomerName('João');
      result.current.setDiscount(5);
      result.current.setSaleSource('delivery');
    });
    act(() => result.current.clearCart());
    expect(result.current.cart).toEqual([]);
    expect(result.current.customerName).toBe('');
    expect(result.current.discount).toBe(0);
    expect(result.current.saleSource).toBe('balcao');
  });

  it('loads order into cart', () => {
    const { result } = renderHook(() => usePOSCart());
    const order: PendingOrder = {
      id: 'ord-1',
      source: 'delivery',
      customer_name: 'Maria',
      customer_phone: null,
      customer_address: null,
      table_number: null,
      order_number: null,
      total: 80,
      status: 'pending',
      created_at: '2026-03-12T00:00:00Z',
      items: [
        { name: 'Pizza', quantity: 2, unit_price: 40 },
      ],
    };
    act(() => result.current.loadOrderIntoCart(order));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.saleSource).toBe('delivery');
    expect(result.current.customerName).toBe('Maria');
  });
});
