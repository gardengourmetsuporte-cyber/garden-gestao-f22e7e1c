import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useInventoryDB } from './useInventoryDB';
import { subDays, format } from 'date-fns';

export interface StockPrediction {
  itemId: string;
  itemName: string;
  currentStock: number;
  avgDailyConsumption: number;
  daysUntilEmpty: number | null; // null = no consumption data
  supplierName: string | null;
  supplierId: string | null;
}

export function useStockPrediction() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const { items } = useInventoryDB();

  // Fetch last 30 days of exit movements
  const { data: exitMovements = [] } = useQuery({
    queryKey: ['stock-exit-movements-30d', activeUnitId],
    queryFn: async () => {
      const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('stock_movements')
        .select('item_id, quantity, created_at')
        .eq('unit_id', activeUnitId!)
        .eq('type', 'saida')
        .gte('created_at', since);
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });

  const predictions: StockPrediction[] = useMemo(() => {
    // Group exit quantities by item
    const consumptionMap: Record<string, number> = {};
    exitMovements.forEach(m => {
      consumptionMap[m.item_id] = (consumptionMap[m.item_id] || 0) + Number(m.quantity);
    });

    return items
      .filter(item => item.current_stock > 0)
      .map(item => {
        const totalConsumed = consumptionMap[item.id] || 0;
        const avgDaily = totalConsumed / 30;
        const daysUntilEmpty = avgDaily > 0 ? Math.round(item.current_stock / avgDaily) : null;

        return {
          itemId: item.id,
          itemName: item.name,
          currentStock: item.current_stock,
          avgDailyConsumption: Math.round(avgDaily * 100) / 100,
          daysUntilEmpty,
          supplierName: (item as any).supplier?.name || null,
          supplierId: item.supplier_id || null,
        };
      })
      .filter(p => p.daysUntilEmpty !== null && p.daysUntilEmpty <= 7)
      .sort((a, b) => (a.daysUntilEmpty ?? 999) - (b.daysUntilEmpty ?? 999));
  }, [items, exitMovements]);

  return { predictions };
}
