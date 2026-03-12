import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Reservation {
  id: string;
  unit_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  status: string;
  table_number: string | null;
  notes: string | null;
  created_at: string;
}

export function useReservations(date?: string) {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['reservations', unitId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('unit_id', unitId!);
      if (error) throw error;
      let filtered = (data || []) as unknown as Reservation[];
      if (date) filtered = filtered.filter(r => r.reservation_date === date);
      filtered.sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));
      return filtered;
    },
    enabled: !!unitId,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<Reservation>) => {
      const { error } = await supabase.from('reservations').insert({
        unit_id: unitId!,
        created_by: user?.id,
        customer_name: input.customer_name!,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email,
        party_size: input.party_size || 2,
        reservation_date: input.reservation_date!,
        reservation_time: input.reservation_time!,
        duration_minutes: input.duration_minutes || 120,
        table_number: input.table_number,
        notes: input.notes,
        status: 'confirmed',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reserva criada');
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Erro ao criar reserva'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Reservation> & { id: string }) => {
      const { error } = await supabase.from('reservations').update({ ...rest, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reserva atualizada');
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Erro ao atualizar reserva'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reserva removida');
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  return { reservations: query.data || [], isLoading: query.isLoading, create, update, remove };
}
