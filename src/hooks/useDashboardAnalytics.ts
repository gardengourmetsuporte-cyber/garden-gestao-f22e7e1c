import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfWeek, subWeeks, format, eachDayOfInterval, parseISO } from 'date-fns';

export interface AnalyticsData {
  dailyRevenue: { date: string; label: string; total: number }[];
  paymentBreakdown: { method: string; total: number; color: string }[];
  avgTicket: number;
  totalPeriod: number;
  daysWithData: number;
}

const METHOD_COLORS: Record<string, string> = {
  cash_amount: 'hsl(var(--success))',
  debit_amount: 'hsl(210, 90%, 55%)',
  credit_amount: 'hsl(270, 70%, 55%)',
  pix_amount: 'hsl(180, 80%, 45%)',
  delivery_amount: 'hsl(25, 90%, 55%)',
  meal_voucher_amount: 'hsl(45, 85%, 50%)',
};

const METHOD_LABELS: Record<string, string> = {
  cash_amount: 'Dinheiro',
  debit_amount: 'Débito',
  credit_amount: 'Crédito',
  pix_amount: 'Pix',
  delivery_amount: 'Delivery',
  meal_voucher_amount: 'V. Refeição',
};

export function useDashboardAnalytics(weeks = 4) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();

  return useQuery({
    queryKey: ['dashboard-analytics', activeUnitId, weeks],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 });
      const startStr = format(start, 'yyyy-MM-dd');

      const { data: closings, error } = await supabase
        .from('cash_closings')
        .select('date, cash_amount, debit_amount, credit_amount, pix_amount, delivery_amount, meal_voucher_amount, total_amount')
        .eq('unit_id', activeUnitId!)
        .gte('date', startStr)
        .order('date', { ascending: true });

      if (error) throw error;

      const days = eachDayOfInterval({ start, end: now });
      const closingMap = new Map<string, typeof closings[0]>();
      (closings || []).forEach(c => closingMap.set(c.date, c));

      const dailyRevenue = days.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const c = closingMap.get(dateStr);
        const total = c
          ? (c.total_amount ?? (c.cash_amount + c.debit_amount + c.credit_amount + c.pix_amount + c.delivery_amount + c.meal_voucher_amount))
          : 0;
        return {
          date: dateStr,
          label: format(d, 'dd/MM'),
          total,
        };
      });

      // Payment breakdown
      const methods = ['cash_amount', 'debit_amount', 'credit_amount', 'pix_amount', 'delivery_amount', 'meal_voucher_amount'] as const;
      const breakdown = methods.map(m => ({
        method: METHOD_LABELS[m],
        total: (closings || []).reduce((s, c) => s + ((c as any)[m] || 0), 0),
        color: METHOD_COLORS[m],
      })).filter(b => b.total > 0);

      const totalPeriod = dailyRevenue.reduce((s, d) => s + d.total, 0);
      const daysWithData = dailyRevenue.filter(d => d.total > 0).length;
      const avgTicket = daysWithData > 0 ? totalPeriod / daysWithData : 0;

      return { dailyRevenue, paymentBreakdown: breakdown, avgTicket, totalPeriod, daysWithData };
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });
}
