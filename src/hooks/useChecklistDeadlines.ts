import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeadlineSetting } from '@/lib/checklistTiming';
import { toast } from 'sonner';

const EMPTY_DEADLINE_SETTINGS: DeadlineSetting[] = [];

export function useChecklistDeadlines() {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = EMPTY_DEADLINE_SETTINGS, isLoading } = useQuery({
    queryKey: ['checklist-deadline-settings', activeUnitId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('checklist_deadline_settings')
        .select('checklist_type, deadline_hour, deadline_minute, is_next_day, is_active')
        .eq('unit_id', activeUnitId!);
      if (error) throw error;
      return (data || []) as DeadlineSetting[];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (setting: DeadlineSetting) => {
      const { error } = await (supabase as any)
        .from('checklist_deadline_settings')
        .upsert({
          unit_id: activeUnitId,
          checklist_type: setting.checklist_type,
          deadline_hour: setting.deadline_hour,
          deadline_minute: setting.deadline_minute,
          is_next_day: setting.is_next_day,
          is_active: setting.is_active ?? true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'unit_id,checklist_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-deadline-settings', activeUnitId] });
      toast.success('Horário limite atualizado');
    },
    onError: () => {
      toast.error('Erro ao salvar horário limite');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (checklistType: string) => {
      const { error } = await (supabase as any)
        .from('checklist_deadline_settings')
        .delete()
        .eq('unit_id', activeUnitId!)
        .eq('checklist_type', checklistType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-deadline-settings', activeUnitId] });
      toast.success('Horário limite removido');
    },
  });

  return {
    settings,
    isLoading,
    updateDeadline: updateMutation.mutate,
    removeDeadline: removeMutation.mutate,
    isSaving: updateMutation.isPending,
  };
}
