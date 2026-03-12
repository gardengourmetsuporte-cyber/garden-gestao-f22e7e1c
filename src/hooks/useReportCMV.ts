import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface CMVFilters {
  startDate: string;
  endDate: string;
}

interface ProductCMV {
  product_id: string;
  product_name: string;
  qty_sold: number;
  revenue: number;
  unit_cost: number;
  total_cost: number;
  margin: number;
  margin_pct: number;
}

interface CMVSummary {
  totalRevenue: number;
  totalCost: number;
  grossMargin: number;
  cmvPercent: number;
  products: ProductCMV[];
}

export function useReportCMV(filters: CMVFilters) {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  return useQuery({
    queryKey: ['report-cmv', unitId, filters.startDate, filters.endDate],
    queryFn: async (): Promise<CMVSummary> => {
      if (!unitId) return { totalRevenue: 0, totalCost: 0, grossMargin: 0, cmvPercent: 0, products: [] };

      // Get paid sales in period
      const { data: sales } = await supabase
        .from('pos_sales')
        .select('id, total')
        .eq('unit_id', unitId)
        .eq('status', 'paid')
        .gte('created_at', filters.startDate)
        .lte('created_at', filters.endDate + 'T23:59:59');

      if (!sales?.length) return { totalRevenue: 0, totalCost: 0, grossMargin: 0, cmvPercent: 0, products: [] };

      const saleIds = sales.map(s => s.id);
      const totalRevenue = sales.reduce((s, v) => s + Number(v.total || 0), 0);

      // Get sale items
      const { data: items } = await supabase
        .from('pos_sale_items')
        .select('product_id, product_name, quantity, total_price')
        .in('sale_id', saleIds)
        .not('product_id', 'is', null);

      if (!items?.length) return { totalRevenue, totalCost: 0, grossMargin: totalRevenue, cmvPercent: 0, products: [] };

      // Get tablet products with recipe link
      const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))] as string[];
      const { data: tabletProducts } = await supabase
        .from('tablet_products')
        .select('id, recipe_id')
        .in('id', productIds)
        .not('recipe_id', 'is', null);

      const recipeIds = tabletProducts?.map(tp => tp.recipe_id).filter(Boolean) as string[] || [];
      const productRecipeMap = new Map<string, string>();
      tabletProducts?.forEach(tp => {
        if (tp.recipe_id) productRecipeMap.set(tp.id, tp.recipe_id);
      });

      // Get recipe costs
      const costMap = new Map<string, number>();
      if (recipeIds.length) {
        const { data: recipes } = await supabase
          .from('recipes')
          .select('id, cost_per_portion')
          .in('id', recipeIds);

        recipes?.forEach(r => costMap.set(r.id, Number(r.cost_per_portion || 0)));
      }

      // Aggregate by product
      const productMap = new Map<string, ProductCMV>();
      items.forEach(item => {
        const pid = item.product_id!;
        const recipeId = productRecipeMap.get(pid);
        const unitCost = recipeId ? (costMap.get(recipeId) || 0) : 0;
        const qty = Number(item.quantity || 1);
        const rev = Number(item.total_price || 0);
        const cost = unitCost * qty;
        const existing = productMap.get(pid);

        if (existing) {
          existing.qty_sold += qty;
          existing.revenue += rev;
          existing.total_cost += cost;
        } else {
          productMap.set(pid, {
            product_id: pid,
            product_name: item.product_name || 'Sem nome',
            qty_sold: qty,
            revenue: rev,
            unit_cost: unitCost,
            total_cost: cost,
            margin: 0,
            margin_pct: 0,
          });
        }
      });

      const products = Array.from(productMap.values()).map(p => ({
        ...p,
        margin: p.revenue - p.total_cost,
        margin_pct: p.revenue > 0 ? ((p.revenue - p.total_cost) / p.revenue) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);

      const totalCost = products.reduce((s, p) => s + p.total_cost, 0);
      const grossMargin = totalRevenue - totalCost;
      const cmvPercent = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

      return { totalRevenue, totalCost, grossMargin, cmvPercent, products };
    },
    enabled: !!unitId,
  });
}
