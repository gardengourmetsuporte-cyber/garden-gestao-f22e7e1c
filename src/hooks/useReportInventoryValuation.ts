import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface ValuationItem {
  id: string;
  name: string;
  category_id: string | null;
  current_stock: number;
  unit_price: number;
  unit_type: string;
  total_value: number;
  is_below_min: boolean;
}

interface CategorySummary {
  category_id: string | null;
  category_name: string;
  total_value: number;
  item_count: number;
}

interface ValuationSummary {
  totalValue: number;
  totalItems: number;
  belowMinCount: number;
  items: ValuationItem[];
  categories: CategorySummary[];
}

export function useReportInventoryValuation() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  return useQuery({
    queryKey: ['report-inventory-valuation', unitId],
    queryFn: async (): Promise<ValuationSummary> => {
      if (!unitId) return { totalValue: 0, totalItems: 0, belowMinCount: 0, items: [], categories: [] };

      const { data } = await supabase
        .from('inventory_items')
        .select('id, name, category_id, current_stock, unit_price, unit_type, min_stock')
        .eq('unit_id', unitId)
        .is('deleted_at', null);

      if (!data?.length) return { totalValue: 0, totalItems: 0, belowMinCount: 0, items: [], categories: [] };

      // Get category names
      const catIds = [...new Set(data.map(i => i.category_id).filter(Boolean))] as string[];
      const catNameMap = new Map<string, string>();
      if (catIds.length) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', catIds);
        cats?.forEach(c => catNameMap.set(c.id, c.name));
      }

      const items: ValuationItem[] = data.map(i => ({
        id: i.id,
        name: i.name,
        category_id: i.category_id,
        current_stock: Number(i.current_stock || 0),
        unit_price: Number(i.unit_price || 0),
        unit_type: String(i.unit_type || 'unidade'),
        total_value: Number(i.current_stock || 0) * Number(i.unit_price || 0),
        is_below_min: Number(i.current_stock || 0) < Number(i.min_stock || 0),
      }));

      const catMap = new Map<string | null, CategorySummary>();
      items.forEach(i => {
        const key = i.category_id;
        const existing = catMap.get(key);
        if (existing) {
          existing.total_value += i.total_value;
          existing.item_count++;
        } else {
          catMap.set(key, {
            category_id: key,
            category_name: key ? (catNameMap.get(key) || 'Sem categoria') : 'Sem categoria',
            total_value: i.total_value,
            item_count: 1,
          });
        }
      });

      return {
        totalValue: items.reduce((s, i) => s + i.total_value, 0),
        totalItems: items.length,
        belowMinCount: items.filter(i => i.is_below_min).length,
        items: items.sort((a, b) => b.total_value - a.total_value),
        categories: Array.from(catMap.values()).sort((a, b) => b.total_value - a.total_value),
      };
    },
    enabled: !!unitId,
  });
}
