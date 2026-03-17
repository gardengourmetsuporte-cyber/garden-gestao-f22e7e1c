import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

export interface PriceTrackingItem {
  id: string;
  name: string;
  category: string;
  unit_type: string;
  current_price: number;
  previous_price: number | null;
  variation_pct: number | null;
  supplier_name: string | null;
  history: { price: number; date: string; supplier_name?: string }[];
}

export type PriceFilter = 'all' | 'up' | 'down';

export function usePriceTracking() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  return useQuery({
    queryKey: ['price-tracking', unitId],
    enabled: !!unitId,
    queryFn: async (): Promise<PriceTrackingItem[]> => {
      // Fetch items with price > 0, join category name
      const { data: items, error: itemsErr } = await supabase
        .from('inventory_items')
        .select('id, name, category_id, unit_type, unit_price, supplier_id, categories!inventory_items_category_id_fkey(name)')
        .eq('unit_id', unitId!)
        .gt('unit_price', 0)
        .is('deleted_at', null)
        .order('name');

      if (itemsErr) throw itemsErr;
      if (!items?.length) return [];

      const itemIds = items.map(i => i.id);
      const supplierIds = [...new Set(items.map(i => i.supplier_id).filter(Boolean))] as string[];

      // Fetch price history + suppliers in parallel
      const [historyRes, suppliersRes] = await Promise.all([
        supabase
          .from('supplier_price_history')
          .select('item_id, unit_price, recorded_at, supplier_id')
          .in('item_id', itemIds)
          .order('recorded_at', { ascending: true }),
        supplierIds.length > 0
          ? supabase.from('suppliers').select('id, name').in('id', supplierIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
      ]);

      if (historyRes.error) throw historyRes.error;

      const supplierMap = new Map<string, string>();
      (suppliersRes.data || []).forEach(s => supplierMap.set(s.id, s.name));

      // Also map supplier names from history
      const historySupplierIds = [...new Set((historyRes.data || []).map(h => h.supplier_id).filter(Boolean))] as string[];
      const missingSupplierIds = historySupplierIds.filter(id => !supplierMap.has(id));
      if (missingSupplierIds.length > 0) {
        const { data: extraSuppliers } = await supabase
          .from('suppliers')
          .select('id, name')
          .in('id', missingSupplierIds);
        (extraSuppliers || []).forEach(s => supplierMap.set(s.id, s.name));
      }

      // Group history by item
      const historyMap = new Map<string, typeof historyRes.data>();
      (historyRes.data || []).forEach(h => {
        if (!historyMap.has(h.item_id)) historyMap.set(h.item_id, []);
        historyMap.get(h.item_id)!.push(h);
      });

      return items.map(item => {
        const history = historyMap.get(item.id) || [];
        const lastEntries = history.slice(-10);
        const previous = history.length >= 2 ? history[history.length - 2] : null;
        const previousPrice = previous?.unit_price ?? null;
        const currentPrice = item.unit_price ?? 0;
        const variationPct = previousPrice && previousPrice > 0
          ? ((currentPrice - previousPrice) / previousPrice) * 100
          : null;

        const categoryName = (item.categories as any)?.name || '';

        return {
          id: item.id,
          name: item.name,
          category: categoryName,
          unit_type: item.unit_type || '',
          current_price: currentPrice,
          previous_price: previousPrice,
          variation_pct: variationPct,
          supplier_name: item.supplier_id ? supplierMap.get(item.supplier_id) || null : null,
          history: lastEntries.map(h => ({
            price: h.unit_price,
            date: h.recorded_at,
            supplier_name: h.supplier_id ? supplierMap.get(h.supplier_id) : undefined,
          })),
        };
      });
    },
  });
}
