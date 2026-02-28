import { useMemo } from 'react';
import { useInventoryDB } from './useInventoryDB';
import { useOrders } from './useOrders';
import { useSuppliers } from './useSuppliers';
import { useStockPrediction } from './useStockPrediction';

export interface AutoOrderItem {
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  deficit: number;
  avgDailyConsumption: number;
  suggestedQuantity: number;
  daysUntilEmpty: number | null;
}

export interface AutoOrderSuggestion {
  supplierId: string;
  supplierName: string;
  supplierPhone: string | null;
  deliveryDay: string;
  items: AutoOrderItem[];
}

export function useAutoOrderSuggestion() {
  const { items } = useInventoryDB();
  const { orders, createOrder } = useOrders();
  const { suppliers } = useSuppliers();
  const { predictions } = useStockPrediction();

  // Map supplier id -> delivery_frequency from DB
  const supplierFreqMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach(s => {
      map[s.id] = (s as any).delivery_frequency || 'weekly';
    });
    return map;
  }, [suppliers]);

  // Map item id -> prediction data for smarter suggestions
  const predictionMap = useMemo(() => {
    const map: Record<string, { avgDaily: number; daysUntilEmpty: number | null }> = {};
    predictions.forEach(p => {
      map[p.itemId] = { avgDaily: p.avgDailyConsumption, daysUntilEmpty: p.daysUntilEmpty };
    });
    return map;
  }, [predictions]);

  const suggestions = useMemo(() => {
    const pendingOrderItemIds = new Set<string>();
    orders
      .filter(o => o.status === 'draft' || o.status === 'sent')
      .forEach(o => {
        (o.order_items || []).forEach(oi => pendingOrderItemIds.add(oi.item_id));
      });

    const lowStockItems = items.filter(
      item => item.current_stock <= item.min_stock && item.supplier_id && !pendingOrderItemIds.has(item.id)
    );

    // Also include items predicted to run out within 5 days (consumption-based)
    const predictedItems = items.filter(item => {
      if (!item.supplier_id || pendingOrderItemIds.has(item.id)) return false;
      if (item.current_stock <= item.min_stock) return false; // already in lowStock
      const pred = predictionMap[item.id];
      return pred && pred.daysUntilEmpty !== null && pred.daysUntilEmpty <= 5;
    });

    const allItems = [...lowStockItems, ...predictedItems];

    // Group by supplier
    const bySupplier: Record<string, AutoOrderSuggestion> = {};
    allItems.forEach(item => {
      const sid = item.supplier_id!;
      if (!bySupplier[sid]) {
        const freq = supplierFreqMap[sid] || 'weekly';
        bySupplier[sid] = {
          supplierId: sid,
          supplierName: (item as any).supplier?.name || 'Fornecedor',
          supplierPhone: (item as any).supplier?.phone || null,
          deliveryDay: freq === 'daily' ? 'diário' : 'semanal',
          items: [],
        };
      }

      const pred = predictionMap[item.id];
      const avgDaily = pred?.avgDaily || 0;
      const deficit = Math.max(0, item.min_stock - item.current_stock);
      // Smart suggestion: use 7-day consumption if available, otherwise use deficit
      const consumptionBased = avgDaily > 0 ? Math.ceil(avgDaily * 7) : 0;
      const suggestedQuantity = Math.max(deficit, consumptionBased);

      bySupplier[sid].items.push({
        itemId: item.id,
        itemName: item.name,
        currentStock: item.current_stock,
        minStock: item.min_stock,
        deficit,
        avgDailyConsumption: avgDaily,
        suggestedQuantity: suggestedQuantity > 0 ? suggestedQuantity : item.min_stock,
        daysUntilEmpty: pred?.daysUntilEmpty ?? null,
      });
    });

    return Object.values(bySupplier);
  }, [items, orders, supplierFreqMap, predictionMap]);

  // Only daily suggestions for the dashboard widget
  const dailySuggestions = useMemo(() => {
    return suggestions.filter(s => s.deliveryDay === 'diário');
  }, [suggestions]);

  // Grouped (all)
  const groupedSuggestions = useMemo(() => {
    const daily = suggestions.filter(s => s.deliveryDay === 'diário');
    const weekly = suggestions.filter(s => s.deliveryDay === 'semanal');

    const groups: { label: string; emoji: string; suggestions: AutoOrderSuggestion[] }[] = [];
    if (daily.length > 0) {
      groups.push({ label: 'Pedidos Diários', emoji: '📦', suggestions: daily });
    }
    if (weekly.length > 0) {
      groups.push({ label: 'Pedidos Semanais', emoji: '📋', suggestions: weekly });
    }
    return groups;
  }, [suggestions]);

  const createDraftOrder = async (suggestion: AutoOrderSuggestion) => {
    const orderItems = suggestion.items.map(i => ({
      item_id: i.itemId,
      quantity: i.suggestedQuantity > 0 ? i.suggestedQuantity : i.minStock,
    }));
    await createOrder(suggestion.supplierId, orderItems);
  };

  return { suggestions, dailySuggestions, groupedSuggestions, createDraftOrder };
}
