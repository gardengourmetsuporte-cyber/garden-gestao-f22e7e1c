import { useMemo } from 'react';
import { useInventoryDB } from './useInventoryDB';
import { useOrders } from './useOrders';

export interface AutoOrderSuggestion {
  supplierId: string;
  supplierName: string;
  items: {
    itemId: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    deficit: number;
  }[];
}

export function useAutoOrderSuggestion() {
  const { items } = useInventoryDB();
  const { orders, createOrder } = useOrders();

  // Find items below min_stock that have a supplier and don't already have a pending draft order
  const suggestions = useMemo(() => {
    // Items with draft/sent orders (already being handled)
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

    return Object.values(bySupplier);
  }, [items, orders]);

  const createDraftOrder = async (suggestion: AutoOrderSuggestion) => {
    const orderItems = suggestion.items.map(i => ({
      item_id: i.itemId,
      quantity: i.deficit > 0 ? i.deficit : i.minStock,
    }));
    await createOrder(suggestion.supplierId, orderItems);
  };

  return { suggestions, createDraftOrder };
}
