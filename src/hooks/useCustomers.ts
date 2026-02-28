import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { normalizePhone } from '@/lib/normalizePhone';
import type { Customer } from '@/types/customer';

export function useCustomers() {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const qc = useQueryClient();
  const unitId = activeUnit?.id;

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('unit_id', unitId)
        .order('name');
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!unitId,
  });

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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
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
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
      toast.success('Cliente atualizado!');
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
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
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
      toast.success(`${rows.length} clientes importados!`);
    },
  });

  return { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, importCSV };
}
