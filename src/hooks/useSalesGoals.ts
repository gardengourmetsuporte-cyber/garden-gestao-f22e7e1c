import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';

export interface SalesGoal {
  id: string;
  unit_id: string;
  month: string;
  daily_goal: number;
  monthly_goal: number;
}

export function useSalesGoals() {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: goal, isLoading } = useQuery({
    queryKey: ['sales-goals', activeUnitId, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('unit_id', activeUnitId!)
        .eq('month', currentMonth)
        .maybeSingle();
      if (error) throw error;
      return data as SalesGoal | null;
    },
    enabled: !!user && !!activeUnitId,
  });

  const upsertGoal = useMutation({
    mutationFn: async ({ dailyGoal, monthlyGoal }: { dailyGoal: number; monthlyGoal: number }) => {
      const { error } = await supabase
        .from('sales_goals')
        .upsert({
          unit_id: activeUnitId!,
          month: currentMonth,
          daily_goal: dailyGoal,
          monthly_goal: monthlyGoal,
          created_by: user!.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'unit_id,month' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-goals'] });
      toast.success('Meta salva com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar meta'),
  });

  return { goal, isLoading, upsertGoal };
}
