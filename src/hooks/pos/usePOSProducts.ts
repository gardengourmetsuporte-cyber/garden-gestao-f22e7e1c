import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { setCache, getCache } from '@/lib/offlineDb';
import type { POSProduct } from './types';

export function usePOSProducts(activeUnitId: string | null) {
  const { isConnected } = useOnlineStatus();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!activeUnitId) return;
    setLoadingProducts(true);

    if (isConnected) {
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
      try {
        await setCache({ key: `products-${activeUnitId}`, type: 'products', data: prods, updatedAt: new Date().toISOString() });
      } catch {}
    } else {
      try {
        const cached = await getCache(`products-${activeUnitId}`);
        if (cached?.data) {
          const prods = cached.data as POSProduct[];
          setProducts(prods);
          setCategories([...new Set(prods.map(p => p.category).filter(Boolean))]);
        }
      } catch {}
    }

    setLoadingProducts(false);
  }, [activeUnitId, isConnected]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, categories, loadingProducts, fetchProducts };
}
