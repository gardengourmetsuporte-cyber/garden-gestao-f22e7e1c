import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/database';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setCategories((data as Category[]) || []);
    } catch (error) {
      // Silent fail - categories will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name: string, color: string, icon: string) => {
    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order ?? 0)) + 1 
      : 0;

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, icon, sort_order: maxOrder })
      .select()
      .single();

    if (error) throw error;
    setCategories(prev => [...prev, data as Category]);
    return data as Category;
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const reorderCategories = useCallback(async (reorderedCategories: Category[]) => {
    // Optimistic update
    setCategories(reorderedCategories);

    const promises = reorderedCategories.map((cat, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', cat.id)
    );

    const results = await Promise.all(promises);
    const error = results.find(r => r.error)?.error;
    if (error) {
      // Revert on error
      await fetchCategories();
    }
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: fetchCategories,
  };
}
