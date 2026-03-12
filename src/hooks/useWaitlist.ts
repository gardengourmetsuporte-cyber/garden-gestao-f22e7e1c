import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface WaitlistEntry {
  id: string;
  unit_id: string;
  customer_name: string;
  customer_phone: string | null;
  party_size: number;
  status: string;
  estimated_wait_minutes: number | null;
  called_at: string | null;
  seated_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useWaitlist() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['waitlist', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('unit_id', unitId!)
        .in('status', ['waiting', 'called'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as WaitlistEntry[];
    },
    enabled: !!unitId,
    refetchInterval: 30000,
  });

  const add = useMutation({
    mutationFn: async (input: Partial<WaitlistEntry>) => {
      const { error } = await supabase.from('waitlist').insert({
        unit_id: unitId!,
        customer_name: input.customer_name!,
        customer_phone: input.customer_phone,
        party_size: input.party_size || 2,
        estimated_wait_minutes: input.estimated_wait_minutes,
        notes: input.notes,
        status: 'waiting',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cliente adicionado à fila');
      qc.invalidateQueries({ queryKey: ['waitlist'] });
    },
    onError: () => toast.error('Erro ao adicionar à fila'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'called') updates.called_at = new Date().toISOString();
      if (status === 'seated') updates.seated_at = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from('waitlist').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waitlist'] });
    },
    onError: () => toast.error('Erro ao atualizar fila'),
  });

  return { entries: query.data || [], isLoading: query.isLoading, add, updateStatus };
}
