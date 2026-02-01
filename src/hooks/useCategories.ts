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
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, icon })
      .select()
      .single();

    if (error) throw error;
    setCategories(prev => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
    return data as Category;
  }, []);

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

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
