import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface PersonalFinanceStats {
  totalBalance: number;
  monthIncome: number;
  monthExpenses: number;
  pendingExpenses: number;
  isLoading: boolean;
}

export function usePersonalFinanceStats(): PersonalFinanceStats {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['personal-finance-stats', user?.id, monthStart],
    queryFn: async () => {
      if (!user?.id) return null;

      const [accountsRes, incomeRes, expensesRes] = await Promise.all([
        // 1. Total balance from personal accounts
        supabase
          .from('finance_accounts')
          .select('balance')
          .eq('user_id', user.id)
          .is('unit_id', null)
          .eq('is_active', true),

        // 2. Paid income this month
        supabase
          .from('finance_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .is('unit_id', null)
          .eq('type', 'income')
          .eq('is_paid', true)
          .gte('date', monthStart)
          .lte('date', monthEnd),

        // 3. All expenses this month (paid + pending)
        supabase
          .from('finance_transactions')
          .select('amount, is_paid')
          .eq('user_id', user.id)
          .is('unit_id', null)
          .in('type', ['expense', 'credit_card'])
          .gte('date', monthStart)
          .lte('date', monthEnd),
      ]);

      const totalBalance = (accountsRes.data || []).reduce((sum, a) => sum + (a.balance || 0), 0);
      const monthIncome = (incomeRes.data || []).reduce((sum, t) => sum + (t.amount || 0), 0);
      
      let monthExpenses = 0;
      let pendingExpenses = 0;
      for (const t of expensesRes.data || []) {
        monthExpenses += t.amount || 0;
        if (!t.is_paid) pendingExpenses += t.amount || 0;
      }

      return { totalBalance, monthIncome, monthExpenses, pendingExpenses };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    totalBalance: data?.totalBalance ?? 0,
    monthIncome: data?.monthIncome ?? 0,
    monthExpenses: data?.monthExpenses ?? 0,
    pendingExpenses: data?.pendingExpenses ?? 0,
    isLoading,
  };
}
