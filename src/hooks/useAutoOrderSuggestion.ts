import { useMemo } from 'react';
import { useInventoryDB } from './useInventoryDB';
import { useOrders } from './useOrders';

export interface AutoOrderItem {
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  deficit: number;
}

export interface AutoOrderSuggestion {
  supplierId: string;
  supplierName: string;
  supplierPhone: string | null;
  deliveryDay: string; // 'daily' | day of week label
  items: AutoOrderItem[];
}

// Map supplier to typical delivery schedule
// This is a simple heuristic: suppliers with perishable items (categories like meats, produce, bread)
// deliver daily, while others deliver weekly on specific days
const PERISHABLE_CATEGORIES = ['carnes', 'hortifruti', 'pães', 'laticínios', 'frios'];
const WEEKLY_DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function inferDeliveryDay(items: AutoOrderItem[], allItems: any[]): string {
  // Check if any item in this supplier group belongs to a perishable category
  const supplierItemIds = new Set(items.map(i => i.itemId));
  const hasPerishable = allItems
    .filter(item => supplierItemIds.has(item.id))
    .some(item => {
      const catName = item.category?.name?.toLowerCase() || '';
      return PERISHABLE_CATEGORIES.some(p => catName.includes(p));
    });

  if (hasPerishable) return 'diário';

  // For non-perishable, suggest a weekly delivery
  // Simple hash based on supplier name to distribute across weekdays
  return 'semanal';
}

export function useAutoOrderSuggestion() {
  const { items } = useInventoryDB();
  const { orders, createOrder } = useOrders();

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

    // Group by supplier
    const bySupplier: Record<string, AutoOrderSuggestion> = {};
    lowStockItems.forEach(item => {
      const sid = item.supplier_id!;
      if (!bySupplier[sid]) {
        bySupplier[sid] = {
          supplierId: sid,
          supplierName: (item as any).supplier?.name || 'Fornecedor',
          supplierPhone: (item as any).supplier?.phone || null,
          deliveryDay: 'diário',
          items: [],
        };
      }
      bySupplier[sid].items.push({
        itemId: item.id,
        itemName: item.name,
        currentStock: item.current_stock,
        minStock: item.min_stock,
        deficit: Math.max(0, item.min_stock - item.current_stock),
      });
    });

    // Infer delivery day for each supplier
    Object.values(bySupplier).forEach(s => {
      s.deliveryDay = inferDeliveryDay(s.items, items);
    });

    return Object.values(bySupplier);
  }, [items, orders]);

  // Group suggestions by delivery schedule
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
      quantity: i.deficit > 0 ? i.deficit : i.minStock,
    }));
    await createOrder(suggestion.supplierId, orderItems);
  };

  return { suggestions, groupedSuggestions, createDraftOrder };
}
