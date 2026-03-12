import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface ABCProduct {
  product_id: string;
  product_name: string;
  qty_sold: number;
  revenue: number;
  cumulative_pct: number;
  classification: 'A' | 'B' | 'C';
}

interface ABCSummary {
  products: ABCProduct[];
  classA: number;
  classB: number;
  classC: number;
  totalRevenue: number;
}

export function useReportABC(startDate: string, endDate: string) {
  const { currentUnit } = useUnit();
  const unitId = currentUnit?.id;

  return useQuery({
    queryKey: ['report-abc', unitId, startDate, endDate],
    queryFn: async (): Promise<ABCSummary> => {
      if (!unitId) return { products: [], classA: 0, classB: 0, classC: 0, totalRevenue: 0 };

      const { data: sales } = await supabase
        .from('pos_sales')
        .select('id')
        .eq('unit_id', unitId)
        .eq('status', 'paid')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (!sales?.length) return { products: [], classA: 0, classB: 0, classC: 0, totalRevenue: 0 };

      const { data: items } = await supabase
        .from('pos_sale_items')
        .select('product_id, product_name, quantity, total_price')
        .in('sale_id', sales.map(s => s.id))
        .not('product_id', 'is', null);

      if (!items?.length) return { products: [], classA: 0, classB: 0, classC: 0, totalRevenue: 0 };

      const map = new Map<string, { name: string; qty: number; revenue: number }>();
      items.forEach(i => {
        const pid = i.product_id!;
        const e = map.get(pid);
        if (e) {
          e.qty += Number(i.quantity || 1);
          e.revenue += Number(i.total_price || 0);
        } else {
          map.set(pid, { name: i.product_name || 'Sem nome', qty: Number(i.quantity || 1), revenue: Number(i.total_price || 0) });
        }
      });

      const sorted = Array.from(map.entries())
        .map(([id, v]) => ({ product_id: id, product_name: v.name, qty_sold: v.qty, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = sorted.reduce((s, p) => s + p.revenue, 0);
      let cumulative = 0;

      const products: ABCProduct[] = sorted.map(p => {
        cumulative += p.revenue;
        const pct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
        return {
          ...p,
          cumulative_pct: pct,
          classification: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C',
        };
      });

      return {
        products,
        classA: products.filter(p => p.classification === 'A').length,
        classB: products.filter(p => p.classification === 'B').length,
        classC: products.filter(p => p.classification === 'C').length,
        totalRevenue,
      };
    },
    enabled: !!unitId,
  });
}
