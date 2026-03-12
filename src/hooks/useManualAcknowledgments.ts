import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

const CURRENT_VERSION = '1.0';

export function useManualAcknowledgments() {
  const queryClient = useQueryClient();
  const { activeUnitId } = useUnit();

  const { data: acknowledgments = [], isLoading } = useQuery({
    queryKey: ['manual-acknowledgments', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await (supabase as any)
        .from('manual_acknowledgments')
        .select('*, employee:employees(id, full_name, user_id)')
        .eq('unit_id', activeUnitId)
        .eq('version', CURRENT_VERSION)
        .order('acknowledged_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeUnitId,
  });

  const acknowledge = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!activeUnitId) throw new Error('Unidade não selecionada');
      const { error } = await (supabase as any)
        .from('manual_acknowledgments')
        .insert({
          unit_id: activeUnitId,
          employee_id: employeeId,
          version: CURRENT_VERSION,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-acknowledgments'] });
      toast.success('Manual assinado com sucesso!');
    },
    onError: () => toast.error('Erro ao assinar manual'),
  });

  const hasAcknowledged = (employeeId: string) => {
    return acknowledgments.some((a: any) => a.employee_id === employeeId);
  };

  return {
    acknowledgments,
    isLoading,
    acknowledge: acknowledge.mutateAsync,
    hasAcknowledged,
    currentVersion: CURRENT_VERSION,
  };
}
