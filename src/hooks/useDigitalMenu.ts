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
  availability: { tablet: boolean; delivery: boolean } | null;
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

export function useDigitalMenu(unitId: string | undefined, channel: 'tablet' | 'delivery' = 'delivery') {
  const [unit, setUnit] = useState<DMUnit | null>(null);
  const [categories, setCategories] = useState<DMCategory[]>([]);
  const [groups, setGroups] = useState<DMGroup[]>([]);
  const [products, setProducts] = useState<DMProduct[]>([]);
  const [optionGroups, setOptionGroups] = useState<DMOptionGroup[]>([]);
  const [productOptionLinks, setProductOptionLinks] = useState<{ product_id: string; option_group_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVisibleProducts, setHasVisibleProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!unitId) {
      setUnit(null);
      setCategories([]);
      setGroups([]);
      setProducts([]);
      setOptionGroups([]);
      setProductOptionLinks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [unitRes, catRes, grpRes, prodRes] = await Promise.all([
        supabase.from('units').select('id, name, store_info, menu_published_at').eq('id', unitId).maybeSingle(),
        supabase.from('menu_categories').select('id, name, icon, color, sort_order').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
        supabase.from('menu_groups').select('id, category_id, name, description, sort_order, availability, updated_at').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
        supabase.from('tablet_products').select('id, name, price, image_url, description, group_id, category, is_highlighted, price_type, custom_prices, sort_order, availability, updated_at').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
      ]);

      const unitData = (unitRes.data as any) || null;
      setUnit(unitData);
      setCategories((catRes.data as DMCategory[]) || []);

      const menuPublishedAt = unitData?.menu_published_at ? new Date(unitData.menu_published_at).getTime() : null;

      const allGroups = (grpRes.data as any[]) || [];
      const filteredGroups = allGroups.filter(g => {
        const avail = g.availability || { tablet: true, delivery: true };
        if (avail[channel] === false) return false;
        if (menuPublishedAt && g.updated_at && new Date(g.updated_at).getTime() > menuPublishedAt) return false;
        return true;
      });
      setGroups(filteredGroups as DMGroup[]);

      const allProducts = (prodRes.data as any[]) || [];
      const filteredProducts = allProducts.filter(p => {
        const avail = p.availability || { tablet: true, delivery: true };
        if (avail[channel] === false) return false;
        if (menuPublishedAt && p.updated_at && new Date(p.updated_at).getTime() > menuPublishedAt) return false;
        return true;
      });
      setProducts(filteredProducts as DMProduct[]);

      const productIds = filteredProducts.map(p => p.id);

      const { data: ogData, error: ogError } = await supabase
        .from('menu_option_groups')
        .select('id, title, min_selections, max_selections, allow_repeat')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('sort_order');
      if (ogError) throw ogError;

      const ogs = (ogData as any[]) || [];
      const optionGroupIds = ogs.map(og => og.id);

      const [{ data: optData, error: optError }, { data: linkData, error: linkError }] = await Promise.all([
        optionGroupIds.length
          ? supabase.from('menu_options').select('id, option_group_id, name, price, image_url, sort_order').in('option_group_id', optionGroupIds).eq('is_active', true).order('sort_order')
          : Promise.resolve({ data: [] as DMOption[], error: null } as any),
        productIds.length
          ? supabase.from('menu_product_option_groups').select('product_id, option_group_id').in('product_id', productIds)
          : Promise.resolve({ data: [] as { product_id: string; option_group_id: string }[], error: null } as any),
      ]);

      if (optError) throw optError;
      if (linkError) throw linkError;

      const opts = (optData as DMOption[]) || [];
      ogs.forEach((og: any) => {
        og.options = opts.filter(o => o.option_group_id === og.id);
      });

      setOptionGroups(ogs);
      setProductOptionLinks((linkData as any[]) || []);
      
      // Check if we have visible products
      const hasProducts = filteredProducts.length > 0;
      setHasVisibleProducts(hasProducts);
    } catch (err) {
      console.error('[useDigitalMenu] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, [unitId, channel]);

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
    unit, categories, groups, products, loading, hasVisibleProducts,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  };
}
