import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

async function fetchSuppliersData(activeUnitId: string | null) {
  let query = supabase
    .from('suppliers')
    .select('*')
    .order('name');

  if (activeUnitId) {
    query = query.eq('unit_id', activeUnitId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Supplier[]) || [];
}

export function useSuppliers() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['suppliers', activeUnitId];

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchSuppliersData(activeUnitId),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const addSupplierMut = useMutation({
    mutationFn: async (supplier: {
      name: string;
      phone?: string;
      email?: string;
      notes?: string;
    }) => {
      const insertData: any = { ...supplier };
      if (activeUnitId) {
        insertData.unit_id = activeUnitId;
      }
      const { data, error } = await supabase
        .from('suppliers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: (newSupplier) => {
      // Optimistic: append to cache immediately
      queryClient.setQueryData<Supplier[]>(queryKey, (old = []) => [...old, newSupplier]);
    },
  });

  const updateSupplierMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Supplier> }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Supplier[]>(queryKey, (old = []) =>
        old.map(s => s.id === updated.id ? updated : s)
      );
    },
  });

  const deleteSupplierMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Supplier[]>(queryKey, (old = []) =>
        old.filter(s => s.id !== deletedId)
      );
    },
  });

  return {
    suppliers,
    isLoading,
    addSupplier: async (supplier: { name: string; phone?: string; email?: string; notes?: string }) => {
      return addSupplierMut.mutateAsync(supplier);
    },
    updateSupplier: async (id: string, updates: Partial<Supplier>) => {
      return updateSupplierMut.mutateAsync({ id, updates });
    },
    deleteSupplier: async (id: string) => {
      await deleteSupplierMut.mutateAsync(id);
    },
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
