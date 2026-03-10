import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FinanceTransaction, FinanceCategory } from '@/types/finance';

export interface MonthData {
  month: number; // 0-11
  label: string;
  shortLabel: string;
  income: number;
  expense: number;
  balance: number;
  variationPct: number | null; // vs previous month expense
}

export interface AnnualCategoryData {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface AnnualStats {
  year: number;
  months: MonthData[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  avgMonthlyExpense: number;
  avgMonthlyIncome: number;
  bestMonth: MonthData | null;
  worstMonth: MonthData | null;
  topCategories: AnnualCategoryData[];
  isLoading: boolean;
}

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

async function fetchYearTransactions(
  userId: string,
  year: number,
  unitId: string | null,
  isPersonal: boolean,
): Promise<FinanceTransaction[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const selectStr = isPersonal
    ? `*, category:finance_categories(*), account:finance_accounts!finance_transactions_account_id_fkey(*)`
    : `*, category:finance_categories(*), account:finance_accounts!finance_transactions_account_id_fkey(*), supplier:suppliers!finance_transactions_supplier_id_fkey(id, name), employee:employees!finance_transactions_employee_id_fkey(id, full_name)`;

  let query = supabase
    .from('finance_transactions')
    .select(selectStr)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (isPersonal) query = query.is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);

  const { data } = await query;
  return (data || []) as unknown as FinanceTransaction[];
}

export function useAnnualFinanceStats(
  year: number,
  categories: FinanceCategory[],
  unitId: string | null = null,
  isPersonal: boolean = true,
): AnnualStats {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['annual-finance', userId, unitId, year, isPersonal],
    queryFn: () => fetchYearTransactions(userId!, year, unitId, isPersonal),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  return useMemo(() => {
    // Aggregate by month
    const monthAgg = Array.from({ length: 12 }, (_, i) => ({
      income: 0,
      expense: 0,
    }));

    const catAgg: Record<string, { name: string; color: string; icon: string; amount: number }> = {};

    // Build parent lookup
    const parentById: Record<string, FinanceCategory> = {};
    categories.forEach(c => {
      parentById[c.id] = c;
      c.subcategories?.forEach(sub => {
        parentById[sub.id] = c;
      });
    });

    transactions.forEach(t => {
      if (!t.is_paid) return;
      const m = new Date(t.date + 'T12:00:00').getMonth();
      const amount = Number(t.amount);

      if (t.type === 'income') {
        monthAgg[m].income += amount;
      } else if (t.type === 'expense' || t.type === 'credit_card') {
        monthAgg[m].expense += amount;

        // Category aggregation for top categories
        const parent = t.category ? (parentById[t.category.id] || t.category) : null;
        if (parent) {
          if (!catAgg[parent.id]) {
            catAgg[parent.id] = { name: parent.name, color: parent.color, icon: parent.icon, amount: 0 };
          }
          catAgg[parent.id].amount += amount;
        }
      }
    });

    const months: MonthData[] = monthAgg.map((m, i) => {
      const balance = m.income - m.expense;
      const prevExpense = i > 0 ? monthAgg[i - 1].expense : null;
      const variationPct = prevExpense && prevExpense > 0
        ? ((m.expense - prevExpense) / prevExpense) * 100
        : null;

      return {
        month: i,
        label: MONTH_LABELS[i],
        shortLabel: MONTH_SHORT[i],
        income: m.income,
        expense: m.expense,
        balance,
        variationPct,
      };
    });

    const totalIncome = months.reduce((s, m) => s + m.income, 0);
    const totalExpense = months.reduce((s, m) => s + m.expense, 0);
    const activeMonths = months.filter(m => m.income > 0 || m.expense > 0);
    const count = activeMonths.length || 1;

    // Top categories
    const totalCatAmount = Object.values(catAgg).reduce((s, c) => s + c.amount, 0);
    const topCategories: AnnualCategoryData[] = Object.entries(catAgg)
      .map(([id, c]) => ({
        id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        amount: c.amount,
        percentage: totalCatAmount > 0 ? (c.amount / totalCatAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Best/worst by balance
    const monthsWithData = months.filter(m => m.income > 0 || m.expense > 0);
    const bestMonth = monthsWithData.length > 0
      ? monthsWithData.reduce((best, m) => m.balance > best.balance ? m : best)
      : null;
    const worstMonth = monthsWithData.length > 0
      ? monthsWithData.reduce((worst, m) => m.balance < worst.balance ? m : worst)
      : null;

    return {
      year,
      months,
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense,
      avgMonthlyExpense: totalExpense / count,
      avgMonthlyIncome: totalIncome / count,
      bestMonth,
      worstMonth,
      topCategories,
      isLoading,
    };
  }, [transactions, categories, year, isLoading]);
}
