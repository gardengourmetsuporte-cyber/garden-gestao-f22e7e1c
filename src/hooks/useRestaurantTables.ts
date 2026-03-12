import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface RestaurantTable {
  id: string;
  unit_id: string;
  table_number: string;
  capacity: number;
  status: string;
  zone: string;
  pos_x: number;
  pos_y: number;
  shape: string;
  is_active: boolean;
  current_order_id: string | null;
  occupied_at: string | null;
  created_at: string;
}

export function useRestaurantTables() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['restaurant-tables', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('is_active', true)
        .order('table_number');
      if (error) throw error;
      return (data || []) as unknown as RestaurantTable[];
    },
    enabled: !!unitId,
    refetchInterval: 15000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<RestaurantTable>) => {
      const { error } = await supabase.from('restaurant_tables').insert({
        unit_id: unitId!,
        table_number: input.table_number!,
        capacity: input.capacity || 4,
        zone: input.zone || 'Salão',
        shape: input.shape || 'square',
        status: 'free',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mesa criada');
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
    },
    onError: () => toast.error('Erro ao criar mesa'),
  });

  const updateTable = useMutation({
    mutationFn: async ({ id, ...data }: Partial<RestaurantTable> & { id: string }) => {
      const { error } = await supabase.from('restaurant_tables')
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
    },
    onError: () => toast.error('Erro ao atualizar mesa'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('restaurant_tables')
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mesa removida');
      qc.invalidateQueries({ queryKey: ['restaurant-tables'] });
    },
  });

  return { tables: query.data || [], isLoading: query.isLoading, create, updateTable, remove };
}
