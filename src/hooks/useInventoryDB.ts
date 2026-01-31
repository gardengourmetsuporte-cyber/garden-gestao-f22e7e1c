import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem, StockMovement, MovementType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useInventoryDB() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:categories(*),
          supplier:suppliers(*)
        `)
        .order('name');

      if (error) throw error;
      setItems((data as InventoryItem[]) || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          item:inventory_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovements((data as StockMovement[]) || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await Promise.all([fetchItems(), fetchMovements()]);
      setIsLoading(false);
    }
    
    if (user) {
      loadData();
    }
  }, [user, fetchItems, fetchMovements]);

  const addItem = useCallback(async (item: {
    name: string;
    category_id: string | null;
    supplier_id?: string | null;
    unit_type: 'unidade' | 'kg' | 'litro';
    current_stock: number;
    min_stock: number;
  }) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select(`*, category:categories(*), supplier:suppliers(*)`)
      .single();

    if (error) throw error;
    setItems(prev => [...prev, data as InventoryItem]);
    return data as InventoryItem;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    const { category, supplier, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select(`*, category:categories(*), supplier:suppliers(*)`)
      .single();

    if (error) throw error;
    setItems(prev => prev.map(item => item.id === id ? (data as InventoryItem) : item));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setItems(prev => prev.filter(item => item.id !== id));
    setMovements(prev => prev.filter(m => m.item_id !== id));
  }, []);

  const registerMovement = useCallback(async (
    itemId: string,
    type: MovementType,
    quantity: number,
    notes?: string
  ) => {
    // Insert movement
    const { data: movementData, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        item_id: itemId,
        type,
        quantity,
        notes,
        user_id: user?.id,
      })
      .select(`*, item:inventory_items(*)`)
      .single();

    if (movementError) throw movementError;

    // Update item stock
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newStock = type === 'entrada'
        ? item.current_stock + quantity
        : Math.max(0, item.current_stock - quantity);

      await updateItem(itemId, { current_stock: newStock });
    }

    setMovements(prev => [movementData as StockMovement, ...prev]);
    return movementData as StockMovement;
  }, [user?.id, items, updateItem]);

  const getItemMovements = useCallback((itemId: string) => {
    return movements.filter(m => m.item_id === itemId);
  }, [movements]);

  const getItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getLowStockItems = useCallback(() => {
    return items.filter(item => item.current_stock <= item.min_stock && item.current_stock > 0);
  }, [items]);

  const getOutOfStockItems = useCallback(() => {
    return items.filter(item => item.current_stock === 0);
  }, [items]);

  const getRecentMovements = useCallback((days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return movements.filter(m => new Date(m.created_at) >= cutoff);
  }, [movements]);

  const getItemsByCategory = useCallback(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    
    items.forEach(item => {
      const categoryName = item.category?.name || 'Sem Categoria';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });

    return grouped;
  }, [items]);

  return {
    items,
    movements,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    registerMovement,
    getItemMovements,
    getItem,
    getLowStockItems,
    getOutOfStockItems,
    getRecentMovements,
    getItemsByCategory,
    refetch: async () => {
      await Promise.all([fetchItems(), fetchMovements()]);
    },
  };
}
