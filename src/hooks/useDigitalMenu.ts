import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DMCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
}

export interface DMGroup {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface DMProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
  group_id: string | null;
  category: string;
  is_highlighted: boolean;
  price_type: string;
  custom_prices: any[] | null;
  sort_order: number;
}

export interface DMOptionGroup {
  id: string;
  title: string;
  min_selections: number;
  max_selections: number;
  allow_repeat: boolean;
  options: DMOption[];
}

export interface DMOption {
  id: string;
  option_group_id: string;
  name: string;
  price: number;
  image_url: string | null;
  sort_order: number;
}

export interface DMUnit {
  id: string;
  name: string;
  store_info: {
    logo_url?: string;
    banner_url?: string;
    cuisine_type?: string;
    city?: string;
    address?: string;
    delivery_time?: string;
    opening_hours?: { open: string; close: string }[];
  } | null;
}

export interface CartItem {
  product: DMProduct;
  quantity: number;
  notes: string;
  selectedOptions: { groupId: string; optionId: string; name: string; price: number }[];
}

export function useDigitalMenu(unitId: string | undefined) {
  const [unit, setUnit] = useState<DMUnit | null>(null);
  const [categories, setCategories] = useState<DMCategory[]>([]);
  const [groups, setGroups] = useState<DMGroup[]>([]);
  const [products, setProducts] = useState<DMProduct[]>([]);
  const [optionGroups, setOptionGroups] = useState<DMOptionGroup[]>([]);
  const [productOptionLinks, setProductOptionLinks] = useState<{ product_id: string; option_group_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    try {
      const [unitRes, catRes, grpRes, prodRes, ogRes, optRes, linkRes] = await Promise.all([
        supabase.from('units').select('id, name, store_info').eq('id', unitId).single(),
        supabase.from('menu_categories').select('id, name, icon, color, sort_order').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
        supabase.from('menu_groups').select('id, category_id, name, description, sort_order').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
        supabase.from('tablet_products').select('id, name, price, image_url, description, group_id, category, is_highlighted, price_type, custom_prices, sort_order').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
        supabase.from('menu_option_groups').select('id, title, min_selections, max_selections, allow_repeat').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
        supabase.from('menu_options').select('id, option_group_id, name, price, image_url, sort_order').eq('is_active', true).order('sort_order'),
        supabase.from('menu_product_option_groups').select('product_id, option_group_id'),
      ]);

      setUnit((unitRes.data as any) || null);
      setCategories((catRes.data as DMCategory[]) || []);
      setGroups((grpRes.data as DMGroup[]) || []);
      setProducts((prodRes.data as DMProduct[]) || []);

      const ogs = (ogRes.data as any[]) || [];
      const opts = (optRes.data as DMOption[]) || [];
      ogs.forEach((og: any) => {
        og.options = opts.filter(o => o.option_group_id === og.id);
      });
      setOptionGroups(ogs);
      setProductOptionLinks((linkRes.data as any[]) || []);
    } catch (err) {
      console.error('[useDigitalMenu] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getProductOptionGroups = useCallback((productId: string) => {
    const linkedIds = productOptionLinks.filter(l => l.product_id === productId).map(l => l.option_group_id);
    return optionGroups.filter(og => linkedIds.includes(og.id));
  }, [productOptionLinks, optionGroups]);

  const getGroupProducts = useCallback((groupId: string) => {
    return products.filter(p => p.group_id === groupId);
  }, [products]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const key = item.product.id + JSON.stringify(item.selectedOptions);
      const existing = prev.findIndex(c => c.product.id + JSON.stringify(c.selectedOptions) === key);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + item.quantity };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateCartQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(index); return; }
    setCart(prev => prev.map((c, i) => i === index ? { ...c, quantity } : c));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => {
    const optionsTotal = item.selectedOptions.reduce((s, o) => s + o.price, 0);
    return sum + (item.product.price + optionsTotal) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    unit, categories, groups, products, loading,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  };
}
