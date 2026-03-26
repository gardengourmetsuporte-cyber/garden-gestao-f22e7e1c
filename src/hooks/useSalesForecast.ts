import { useMemo } from 'react';
import { format, subDays, startOfDay, endOfMonth, getDay, isBefore, isAfter, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { MonthlyStats } from '@/types/finance';

export interface DailyForecast {
  dateStr: string;
  forecastIncome: number;
  pendingExpense: number;
  projectedBalance: number;
}

export interface SalesForecastData {
  dailyForecasts: Record<string, DailyForecast>;
  totalForecastIncome: number;
  totalPendingExpenses: number;
  projectedEndBalance: number;
  avgByDow: Record<number, number>;
  points: { day: number; label: string; real?: number; forecast?: number; balance: number }[];
}

interface UseSalesForecastParams {
  selectedMonth: Date;
  totalBalance: number;
  monthStats: MonthlyStats;
  unitId?: string | null;
  isPersonal?: boolean;
  enabled?: boolean;
}

export function useSalesForecast({ selectedMonth, totalBalance, monthStats, unitId, isPersonal, enabled = true }: UseSalesForecastParams): SalesForecastData {
  const { user } = useAuth();

  const { data: historicalIncome = [] } = useQuery({
    queryKey: ['forecast-history', user?.id, unitId, isPersonal],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const past = format(subDays(new Date(), 90), 'yyyy-MM-dd');

      let query = supabase
        .from('finance_transactions')
        .select('date, amount')
        .eq('user_id', user!.id)
        .eq('type', 'income')
        .eq('is_paid', true)
        .gte('date', past)
        .lte('date', today);

      if (isPersonal) {
        query = query.is('unit_id', null);
      } else if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user && enabled,
    staleTime: 10 * 60 * 1000,
  });

  const { data: pendingExpenses = [] } = useQuery({
    queryKey: ['forecast-pending', user?.id, unitId, isPersonal, format(selectedMonth, 'yyyy-MM')],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('finance_transactions')
        .select('date, amount')
        .eq('user_id', user!.id)
        .in('type', ['expense', 'credit_card'])
        .eq('is_paid', false)
        .gte('date', today)
        .lte('date', monthEnd);

      if (isPersonal) {
        query = query.is('unit_id', null);
      } else if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user && enabled,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const today = startOfDay(new Date());
    const monthEndDate = endOfMonth(selectedMonth);

    // Calculate average income by day of week
    const avgByDow: Record<number, number> = {};
    for (let i = 0; i < 7; i++) {
      const dailyTotals: Record<string, number> = {};
      historicalIncome.forEach(t => {
        const d = parseISO(t.date);
        if (getDay(d) === i) {
          dailyTotals[t.date] = (dailyTotals[t.date] || 0) + Number(t.amount);
        }
      });
      const totals = Object.values(dailyTotals);
      avgByDow[i] = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
    }

    // Pending expenses by date
    const pendingByDate: Record<string, number> = {};
    pendingExpenses.forEach(t => {
      pendingByDate[t.date] = (pendingByDate[t.date] || 0) + Number(t.amount);
    });

    // Build daily forecasts
    const dailyForecasts: Record<string, DailyForecast> = {};
    const points: { day: number; label: string; real?: number; forecast?: number; balance: number }[] = [];
    let balanceTracker = totalBalance;
    const daysInMonth = monthEndDate.getDate();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayNum);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dow = getDay(d);
      const isToday = dateStr === format(today, 'yyyy-MM-dd');
      const isFuture = isAfter(d, today);

      if (isToday) {
        points.push({
          day: dayNum,
          label: format(d, 'dd/MM'),
          real: 0,
          balance: Math.round(balanceTracker * 100) / 100,
        });
        dailyForecasts[dateStr] = {
          dateStr,
          forecastIncome: 0,
          pendingExpense: 0,
          projectedBalance: Math.round(balanceTracker * 100) / 100,
        };
      } else if (isFuture) {
        const forecastIncome = avgByDow[dow] || 0;
        const pendingExp = pendingByDate[dateStr] || 0;
        balanceTracker += forecastIncome - pendingExp;
        const projectedBalance = Math.round(balanceTracker * 100) / 100;

        points.push({
          day: dayNum,
          label: format(d, 'dd/MM'),
          forecast: Math.round(forecastIncome),
          balance: projectedBalance,
        });

        dailyForecasts[dateStr] = {
          dateStr,
          forecastIncome: Math.round(forecastIncome),
          pendingExpense: Math.round(pendingExp),
          projectedBalance,
        };
      }
    }

    const totalForecastIncome = points.reduce((sum, p) => sum + (p.forecast || 0), 0);
    const totalPendingExpenses = pendingExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const projectedEndBalance = totalBalance + totalForecastIncome - totalPendingExpenses;

    return { dailyForecasts, totalForecastIncome, totalPendingExpenses, projectedEndBalance, avgByDow, points };
  }, [historicalIncome, pendingExpenses, selectedMonth, totalBalance, monthStats]);
}
