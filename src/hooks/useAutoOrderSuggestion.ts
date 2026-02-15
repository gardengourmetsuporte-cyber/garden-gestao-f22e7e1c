import { useMemo } from 'react';
import { useInventoryDB } from './useInventoryDB';
import { useOrders } from './useOrders';
import { useSuppliers } from './useSuppliers';

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
  deliveryDay: string;
  items: AutoOrderItem[];
}

export function useAutoOrderSuggestion() {
  const { items } = useInventoryDB();
  const { orders, createOrder } = useOrders();
  const { suppliers } = useSuppliers();

  // Map supplier id -> delivery_frequency from DB
  const supplierFreqMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach(s => {
      map[s.id] = (s as any).delivery_frequency || 'weekly';
    });
    return map;
  }, [suppliers]);

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
        const freq = supplierFreqMap[sid] || 'weekly';
        bySupplier[sid] = {
          supplierId: sid,
          supplierName: (item as any).supplier?.name || 'Fornecedor',
          supplierPhone: (item as any).supplier?.phone || null,
          deliveryDay: freq === 'daily' ? 'diário' : 'semanal',
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
  }, [items, orders, supplierFreqMap]);

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
      quantity: i.deficit > 0 ? i.deficit : i.minStock,
    }));
    await createOrder(suggestion.supplierId, orderItems);
  };

  return { suggestions, dailySuggestions, groupedSuggestions, createDraftOrder };
}
