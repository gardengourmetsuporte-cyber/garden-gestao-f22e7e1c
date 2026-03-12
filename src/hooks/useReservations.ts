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
  const { currentUnit } = useUnit();
  const { user } = useAuth();
  const unitId = currentUnit?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['reservations', unitId, date],
    queryFn: async () => {
      let q = supabase
        .from('reservations')
        .select('*')
        .eq('unit_id', unitId!)
        .order('reservation_time');

      if (date) q = q.eq('reservation_date', date);

      const { data, error } = await q;
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!unitId,
  });

  const create = useMutation({
    mutationFn: async (data: Partial<Reservation>) => {
      const { error } = await supabase.from('reservations').insert({
        ...data,
        unit_id: unitId!,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reserva criada');
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Erro ao criar reserva'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Reservation> & { id: string }) => {
      const { error } = await supabase.from('reservations').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
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
