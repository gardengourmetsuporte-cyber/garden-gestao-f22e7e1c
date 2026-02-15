import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { FinanceBudget } from '@/types/finance';
import { toast } from 'sonner';

export function useBudgets(month: number, year: number) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['finance-budgets', userId, activeUnitId, month, year],
    queryFn: async () => {
      let query = supabase
        .from('finance_budgets')
        .select('*, category:finance_categories(*)')
        .eq('user_id', userId!)
        .eq('month', month)
        .eq('year', year);
      if (activeUnitId) query = query.eq('unit_id', activeUnitId);
      const { data } = await query;
      return (data || []) as FinanceBudget[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const upsertBudget = useMutation({
    mutationFn: async ({ categoryId, amount }: { categoryId: string; amount: number }) => {
      const existing = budgets.find(b => b.category_id === categoryId);
      if (existing) {
        const { error } = await supabase
          .from('finance_budgets')
          .update({ planned_amount: amount })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('finance_budgets')
          .insert({
            user_id: userId!,
            category_id: categoryId,
            month,
            year,
            planned_amount: amount,
            unit_id: activeUnitId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-budgets', userId, activeUnitId, month, year] });
      toast.success('Orçamento salvo');
    },
    onError: () => toast.error('Erro ao salvar orçamento'),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-budgets', userId, activeUnitId, month, year] });
      toast.success('Orçamento removido');
    },
    onError: () => toast.error('Erro ao remover orçamento'),
  });

  return {
    budgets,
    isLoading,
    upsertBudget: (categoryId: string, amount: number) => upsertBudget.mutateAsync({ categoryId, amount }),
    deleteBudget: (id: string) => deleteBudget.mutateAsync(id),
  };
}
