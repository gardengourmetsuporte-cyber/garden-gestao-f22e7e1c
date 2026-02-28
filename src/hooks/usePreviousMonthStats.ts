import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface PrevMonthStats {
  totalIncome: number;
  totalExpense: number;
}

export function usePreviousMonthStats(selectedMonth: Date) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const prevMonth = subMonths(selectedMonth, 1);
  const startDate = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(prevMonth), 'yyyy-MM-dd');

  const { data } = useQuery({
    queryKey: ['prev-month-stats', user?.id, activeUnitId, startDate],
    queryFn: async () => {
      const { data: txns } = await supabase
        .from('finance_transactions')
        .select('type, amount, is_paid')
        .eq('user_id', user!.id)
        .eq('unit_id', activeUnitId!)
        .eq('is_paid', true)
        .gte('date', startDate)
        .lte('date', endDate);

      const rows = txns || [];
      const totalIncome = rows.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = rows.filter(t => t.type === 'expense' || t.type === 'credit_card').reduce((s, t) => s + Number(t.amount), 0);
      return { totalIncome, totalExpense } as PrevMonthStats;
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 10 * 60 * 1000,
  });

  return data ?? null;
}
