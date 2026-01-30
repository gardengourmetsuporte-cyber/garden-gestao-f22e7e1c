import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, StockMovement, MovementType, UnitType } from '@/types/inventory';

const ITEMS_KEY = 'inventory_items';
const MOVEMENTS_KEY = 'inventory_movements';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem(ITEMS_KEY);
    const savedMovements = localStorage.getItem(MOVEMENTS_KEY);
    
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (savedMovements) {
      setMovements(JSON.parse(savedMovements));
    }
    setIsLoading(false);
  }, []);

  // Save items to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    }
  }, [items, isLoading]);

  // Save movements to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
    }
  }, [movements, isLoading]);

  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setMovements(prev => prev.filter(m => m.itemId !== id));
  }, []);

  const registerMovement = useCallback((
    itemId: string, 
    type: MovementType, 
    quantity: number,
    notes?: string
  ) => {
    const movement: StockMovement = {
      id: crypto.randomUUID(),
      itemId,
      type,
      quantity,
      notes,
      createdAt: new Date().toISOString(),
    };

    setMovements(prev => [movement, ...prev]);

    // Update item stock
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStock = type === 'entrada' 
          ? item.currentStock + quantity 
          : Math.max(0, item.currentStock - quantity);
        return { 
          ...item, 
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));

    return movement;
  }, []);

  const getItemMovements = useCallback((itemId: string) => {
    return movements.filter(m => m.itemId === itemId);
  }, [movements]);

  const getItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getLowStockItems = useCallback(() => {
    return items.filter(item => item.currentStock <= item.minStock && item.currentStock > 0);
  }, [items]);

  const getOutOfStockItems = useCallback(() => {
    return items.filter(item => item.currentStock === 0);
  }, [items]);

  const getRecentMovements = useCallback((days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return movements.filter(m => new Date(m.createdAt) >= cutoff);
  }, [movements]);

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
  };
}
