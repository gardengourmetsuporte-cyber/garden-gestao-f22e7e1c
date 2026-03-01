import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { normalizePhone } from '@/lib/normalizePhone';
import type { Customer } from '@/types/customer';

const PAGE_SIZE = 100;

export function useCustomers() {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const qc = useQueryClient();
  const unitId = activeUnit?.id;
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['customers', unitId, searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      if (!unitId) return { data: [], nextPage: null };
      let query = supabase
        .from('customers')
        .select('*')
        .eq('unit_id', unitId)
        .order('name')
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return {
        data: data as Customer[],
        nextPage: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!unitId,
  });

  const customers = data?.pages.flatMap(p => p.data) ?? [];

  const invalidateCustomers = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['customers', unitId] });
  }, [qc, unitId]);

  const createCustomer = useMutation({
    mutationFn: async (input: Partial<Customer>) => {
      if (!unitId || !user) throw new Error('Sem unidade/usuário');
      const { error } = await supabase.from('customers').insert({
        unit_id: unitId,
        created_by: user.id,
        name: input.name!,
        phone: normalizePhone(input.phone),
        email: input.email || null,
        origin: input.origin || 'manual',
        notes: input.notes || null,
        birthday: input.birthday || null,
        tags: input.tags || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateCustomers();
      toast.success('Cliente cadastrado!');
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Customer> & { id: string }) => {
      const normalized = { ...input };
      if ('phone' in normalized) {
        normalized.phone = normalizePhone(normalized.phone);
      }
      const { error } = await supabase.from('customers').update(normalized).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateCustomers();
      toast.success('Cliente atualizado!');
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateCustomers();
      toast.success('Cliente excluído!');
    },
  });

  const importCSV = useMutation({
    mutationFn: async (rows: { name: string; phone?: string; email?: string }[]) => {
      if (!unitId || !user) throw new Error('Sem unidade/usuário');
      const records = rows.map(r => ({
        unit_id: unitId,
        created_by: user.id,
        name: r.name,
        phone: r.phone || null,
        email: r.email || null,
        origin: 'csv' as const,
      }));
      // Batch in chunks of 100
      for (let i = 0; i < records.length; i += 100) {
        const chunk = records.slice(i, i + 100);
        const { error } = await supabase.from('customers').insert(chunk);
        if (error) throw error;
      }
    },
    onSuccess: (_, rows) => {
      invalidateCustomers();
      toast.success(`${rows.length} clientes importados!`);
    },
  });

  return {
    customers,
    isLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    importCSV,
    // Pagination & search
    searchTerm,
    setSearchTerm,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
