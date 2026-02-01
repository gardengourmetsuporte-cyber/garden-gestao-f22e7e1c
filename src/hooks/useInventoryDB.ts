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
    } catch {
      // Error handled silently - user sees empty state
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      // Fetch movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          item:inventory_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (movementsError) throw movementsError;

      // Fetch profiles for user_ids
      const userIds = [...new Set((movementsData || []).map(m => m.user_id).filter(Boolean))];
      
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Merge profile names into movements
      const movementsWithProfiles = (movementsData || []).map(m => ({
        ...m,
        user_name: m.user_id ? profilesMap[m.user_id] || null : null,
      }));

      setMovements(movementsWithProfiles as StockMovement[]);
    } catch {
      // Error handled silently - user sees empty state
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
    // Insert movement - stock is updated automatically by database trigger
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

    // Update local state to reflect new stock (calculated by trigger)
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newStock = type === 'entrada'
        ? item.current_stock + quantity
        : Math.max(0, item.current_stock - quantity);

      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, current_stock: newStock } : i
      ));
    }

    setMovements(prev => [movementData as StockMovement, ...prev]);
    return movementData as StockMovement;
  }, [user?.id, items]);

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
