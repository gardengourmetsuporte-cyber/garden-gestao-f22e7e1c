import { useMemo } from 'react';
import { useInventoryDB } from './useInventoryDB';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';

export interface ConsumptionSuggestion {
  itemId: string;
  itemName: string;
  currentStock: number;
  avgDailyConsumption: number;
  daysUntilEmpty: number | null;
  suggestedQuantity: number;
  categoryName: string;
}

export function useStockConsumption() {
  const { items } = useInventoryDB();
  const { activeUnitId } = useUnit();

  // Fetch last 30 days of exit movements for consumption calculation
  const { data: movements = [] } = useQuery({
    queryKey: ['stock-consumption-movements', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('stock_movements')
        .select('item_id, quantity')
        .eq('unit_id', activeUnitId)
        .eq('type', 'saida')
        .gte('created_at', thirtyDaysAgo);
      return data || [];
    },
    enabled: !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = useMemo(() => {
    // Calculate total consumption per item in 30 days
    const consumptionMap: Record<string, number> = {};
    movements.forEach(m => {
      consumptionMap[m.item_id] = (consumptionMap[m.item_id] || 0) + Number(m.quantity);
    });

    return items
      .filter(item => consumptionMap[item.id] && consumptionMap[item.id] > 0)
      .map(item => {
        const totalConsumed = consumptionMap[item.id] || 0;
        const avgDaily = totalConsumed / 30;
        const daysUntilEmpty = avgDaily > 0 ? Math.floor(item.current_stock / avgDaily) : null;
        // Suggest enough for 7 days based on avg consumption
        const suggestedQuantity = Math.ceil(avgDaily * 7) - item.current_stock;

        return {
          itemId: item.id,
          itemName: item.name,
          currentStock: item.current_stock,
          avgDailyConsumption: Math.round(avgDaily * 100) / 100,
          daysUntilEmpty,
          suggestedQuantity: Math.max(0, suggestedQuantity),
          categoryName: (item as any).category?.name || 'Sem categoria',
        } as ConsumptionSuggestion;
      })
      .filter(s => s.daysUntilEmpty !== null && s.daysUntilEmpty <= 5 && s.suggestedQuantity > 0)
      .sort((a, b) => (a.daysUntilEmpty ?? 999) - (b.daysUntilEmpty ?? 999));
  }, [items, movements]);

  return { suggestions };
}
