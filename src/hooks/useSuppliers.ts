import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useSuppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers((data as Supplier[]) || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchSuppliers().finally(() => setIsLoading(false));
    }
  }, [user, fetchSuppliers]);

  const addSupplier = useCallback(async (supplier: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    setSuppliers(prev => [...prev, data as Supplier]);
    return data as Supplier;
  }, []);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setSuppliers(prev => prev.map(s => s.id === id ? (data as Supplier) : s));
    return data as Supplier;
  }, []);

  const deleteSupplier = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    suppliers,
    isLoading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
}
