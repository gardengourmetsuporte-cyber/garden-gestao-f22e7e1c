import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  coin_price: number | null;
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

type DigitalMenuData = {
  unit: DMUnit | null;
  categories: DMCategory[];
  groups: DMGroup[];
  products: DMProduct[];
  optionGroups: DMOptionGroup[];
  productOptionLinks: { product_id: string; option_group_id: string }[];
  hasVisibleProducts: boolean;
};

const EMPTY_DATA: DigitalMenuData = {
  unit: null,
  categories: [],
  groups: [],
  products: [],
  optionGroups: [],
  productOptionLinks: [],
  hasVisibleProducts: false,
};

async function fetchDigitalMenuData(unitId: string, channel: 'tablet' | 'delivery'): Promise<DigitalMenuData> {
  // Batch 1: core data in parallel
  const [unitRes, catRes, grpRes, prodRes, ogRes] = await Promise.all([
    supabase.from('units').select('id, name, store_info').eq('id', unitId).maybeSingle(),
    supabase.from('menu_categories').select('id, name, icon, color, sort_order').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
    supabase.from('menu_groups').select('id, category_id, name, description, sort_order, availability').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
    supabase.from('tablet_products').select('id, name, price, image_url, description, group_id, category, is_highlighted, price_type, custom_prices, sort_order, availability').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
    supabase.from('menu_option_groups').select('id, title, min_selections, max_selections, allow_repeat').eq('unit_id', unitId).eq('is_active', true).order('sort_order'),
  ]);

  if (unitRes.error) throw unitRes.error;
  if (catRes.error) throw catRes.error;
  if (grpRes.error) throw grpRes.error;
  if (prodRes.error) throw prodRes.error;
  if (ogRes.error) throw ogRes.error;

  const unit = (unitRes.data as DMUnit | null) ?? null;
  const categories = (catRes.data as DMCategory[]) ?? [];

  const allGroups = (grpRes.data as any[]) ?? [];
  const groups = allGroups.filter((g) => {
    const avail = g.availability || { tablet: true, delivery: true };
    return avail[channel] !== false;
  }) as DMGroup[];

  const allProducts = (prodRes.data as any[]) ?? [];
  const products = allProducts.filter((p) => {
    const avail = p.availability || { tablet: true, delivery: true };
    return avail[channel] !== false;
  }) as DMProduct[];

  const productIds = products.map((p) => p.id);
  const optionGroupsRaw = ((ogRes.data as any[]) ?? []) as DMOptionGroup[];
  const optionGroupIds = optionGroupsRaw.map((og) => og.id);

  // Batch 2: dependent lookups in parallel
  const [optRes, linksRes] = await Promise.all([
    optionGroupIds.length
      ? supabase
          .from('menu_options')
          .select('id, option_group_id, name, price, image_url, sort_order')
          .in('option_group_id', optionGroupIds)
          .eq('is_active', true)
          .order('sort_order')
      : Promise.resolve({ data: [] as DMOption[], error: null }),
    productIds.length
      ? supabase
          .from('menu_product_option_groups')
          .select('product_id, option_group_id')
          .in('product_id', productIds)
      : Promise.resolve({ data: [] as { product_id: string; option_group_id: string }[], error: null }),
  ]);

  if (optRes.error) throw optRes.error;
  if (linksRes.error) throw linksRes.error;

  const options = (optRes.data as DMOption[]) ?? [];
  const optionGroups = optionGroupsRaw.map((og) => ({
    ...og,
    options: options.filter((o) => o.option_group_id === og.id),
  }));

  return {
    unit,
    categories,
    groups,
    products,
    optionGroups,
    productOptionLinks: (linksRes.data as { product_id: string; option_group_id: string }[]) ?? [],
    hasVisibleProducts: products.length > 0,
  };
}

export function useDigitalMenu(unitId: string | undefined, channel: 'tablet' | 'delivery' = 'delivery') {
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['digital-menu', unitId, channel],
    queryFn: async () => {
      if (!unitId) return EMPTY_DATA;
      return Promise.race([
        fetchDigitalMenuData(unitId, channel),
        new Promise<DigitalMenuData>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout ao carregar cardápio')), 12000)
        ),
      ]);
    },
    enabled: !!unitId,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const menuData = data ?? EMPTY_DATA;

  const productOptionGroupIdsByProduct = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const link of menuData.productOptionLinks) {
      const current = map.get(link.product_id);
      if (current) current.push(link.option_group_id);
      else map.set(link.product_id, [link.option_group_id]);
    }
    return map;
  }, [menuData.productOptionLinks]);

  const optionGroupsById = useMemo(() => {
    return new Map(menuData.optionGroups.map((og) => [og.id, og]));
  }, [menuData.optionGroups]);

  const productsByGroup = useMemo(() => {
    const map = new Map<string, DMProduct[]>();
    for (const product of menuData.products) {
      if (!product.group_id) continue;
      const current = map.get(product.group_id) ?? [];
      current.push(product);
      map.set(product.group_id, current);
    }
    return map;
  }, [menuData.products]);

  const getProductOptionGroups = useCallback((productId: string) => {
    const linkedIds = productOptionGroupIdsByProduct.get(productId) ?? [];
    return linkedIds
      .map((id) => optionGroupsById.get(id))
      .filter((og): og is DMOptionGroup => Boolean(og));
  }, [productOptionGroupIdsByProduct, optionGroupsById]);

  const getGroupProducts = useCallback((groupId: string) => {
    return productsByGroup.get(groupId) ?? [];
  }, [productsByGroup]);

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
    unit: menuData.unit,
    categories: menuData.categories,
    groups: menuData.groups,
    products: menuData.products,
    loading: isLoading,
    hasVisibleProducts: menuData.hasVisibleProducts,
    getProductOptionGroups,
    getGroupProducts,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };
}

