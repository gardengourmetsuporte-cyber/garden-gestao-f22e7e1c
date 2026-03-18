import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface Freelancer {
  id: string;
  unit_id: string;
  name: string;
  phone: string;
  sector: string;
  notes: string | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type FreelancerInsert = Pick<Freelancer, 'name' | 'phone' | 'sector'> & {
  notes?: string | null;
  is_active?: boolean;
};

const SECTORS = [
  { value: 'cozinha', label: 'Cozinha', color: '#ef4444' },
  { value: 'salao', label: 'Salão', color: '#3b82f6' },
  { value: 'entregador', label: 'Entregador', color: '#f59e0b' },
  { value: 'bar', label: 'Bar', color: '#8b5cf6' },
  { value: 'outros', label: 'Outros', color: '#64748b' },
] as const;

export { SECTORS };

export function useFreelancers() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();
  const key = ['freelancers', unitId];

  const { data: freelancers = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('unit_id', unitId!)
        .order('name');
      if (error) throw error;
      return data as Freelancer[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: FreelancerInsert) => {
      const { error } = await supabase.from('freelancers').insert({ ...input, unit_id: unitId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Freelancer cadastrado!'); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Freelancer> & { id: string }) => {
      const { error } = await supabase.from('freelancers').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Freelancer atualizado!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('freelancers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Freelancer removido!'); },
  });

  return {
    freelancers,
    isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
