import { useMemo } from 'react';
import { format, subDays, startOfDay, endOfMonth, addDays, getDay, startOfMonth, isBefore, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact as formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { MonthlyStats } from '@/types/finance';

interface SalesForecastPanelProps {
  selectedMonth: Date;
  totalBalance: number;
  monthStats: MonthlyStats;
  unitId?: string | null;
  isPersonal?: boolean;
}

export function SalesForecastPanel({ selectedMonth, totalBalance, monthStats, unitId, isPersonal }: SalesForecastPanelProps) {
  const { user } = useAuth();

  // Fetch last 90 days of paid income transactions for average calculation
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
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch pending expenses for the rest of the month
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
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const forecast = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(selectedMonth);
    const monthEndDate = endOfMonth(selectedMonth);

    // Calculate average income by day of week (0=Sun, 6=Sat)
    const byDow: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    historicalIncome.forEach(t => {
      const d = parseISO(t.date);
      const dow = getDay(d);
      byDow[dow].push(Number(t.amount));
    });

    const avgByDow: Record<number, number> = {};
    for (let i = 0; i < 7; i++) {
      const vals = byDow[i];
      // Group by date to get daily totals, then average
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

    // Build chart data day by day for the month
    const points: { day: number; label: string; real?: number; forecast?: number; balance: number }[] = [];
    let runningBalance = totalBalance - monthStats.totalIncome + monthStats.totalExpense; // Start of month balance estimate

    // Pending expenses by date
    const pendingByDate: Record<string, number> = {};
    pendingExpenses.forEach(t => {
      pendingByDate[t.date] = (pendingByDate[t.date] || 0) + Number(t.amount);
    });

    // Actual daily income/expense from monthStats context isn't granular, so we use a simpler approach
    // Just show from today forward with forecast
    let balanceTracker = totalBalance;
    const daysInMonth = monthEndDate.getDate();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayNum);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dow = getDay(d);
      const isPast = isBefore(d, today);
      const isToday = dateStr === format(today, 'yyyy-MM-dd');
      const isFuture = isAfter(d, today);

      if (isToday) {
        // Today's sales already happened, just mark the current balance
        points.push({
          day: dayNum,
          label: format(d, 'dd/MM'),
          real: 0,
          balance: Math.round(balanceTracker * 100) / 100,
        });
      } else if (isFuture) {
        const forecastIncome = avgByDow[dow] || 0;
        const pendingExp = pendingByDate[dateStr] || 0;
        balanceTracker += forecastIncome - pendingExp;
        points.push({
          day: dayNum,
          label: format(d, 'dd/MM'),
          forecast: Math.round(forecastIncome),
          balance: Math.round(balanceTracker * 100) / 100,
        });
      }
    }

    // Totals
    const totalForecastIncome = points.reduce((sum, p) => sum + (p.forecast || 0), 0);
    const totalPendingExpenses = pendingExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const projectedEndBalance = totalBalance + totalForecastIncome - totalPendingExpenses;

    return { points, totalForecastIncome, totalPendingExpenses, projectedEndBalance, avgByDow };
  }, [historicalIncome, pendingExpenses, selectedMonth, totalBalance, monthStats]);

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="mx-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-command p-3 text-center">
          <span className="text-[10px] text-muted-foreground block">Vendas Previstas</span>
          <span className="text-sm font-bold text-success">{formatCurrency(forecast.totalForecastIncome)}</span>
        </div>
        <div className="card-command p-3 text-center">
          <span className="text-[10px] text-muted-foreground block">Despesas Pendentes</span>
          <span className="text-sm font-bold text-destructive">{formatCurrency(forecast.totalPendingExpenses)}</span>
        </div>
        <div className="card-command p-3 text-center">
          <span className="text-[10px] text-muted-foreground block">Saldo Final</span>
          <span className={cn("text-sm font-bold", forecast.projectedEndBalance >= 0 ? "text-success" : "text-destructive")}>
            {formatCurrency(forecast.projectedEndBalance)}
          </span>
        </div>
      </div>

      {/* Daily Average by Day of Week */}
      <div className="card-command p-3">
        <div className="flex items-center gap-2 mb-2">
          <AppIcon name="Calendar" size={14} className="text-primary" />
          <span className="text-[11px] font-bold text-foreground">Média diária por dia da semana</span>
        </div>
        <div className="flex gap-1">
          {dayNames.map((name, i) => {
            const avg = forecast.avgByDow[i] || 0;
            const maxAvg = Math.max(...Object.values(forecast.avgByDow), 1);
            const heightPercent = (avg / maxAvg) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-12 flex items-end justify-center">
                  <div
                    className="w-full max-w-[20px] rounded-t bg-primary/20 transition-all"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{name}</span>
                <span className="text-[9px] font-medium text-foreground">{formatCurrency(avg)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projected Balance Chart */}
      {forecast.points.length > 0 && (
        <div className="card-command p-3">
          <div className="flex items-center gap-2 mb-2">
            <AppIcon name="TrendingUp" size={14} className="text-primary" />
            <span className="text-[11px] font-bold text-foreground">Saldo projetado até fim do mês</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={forecast.points}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={v => formatCurrency(v)}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                  name === 'balance' ? 'Saldo' : 'Previsão'
                ]}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--destructive) / 0.3)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--success))"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {forecast.projectedEndBalance < 0 && (
            <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg bg-destructive/8">
              <AppIcon name="AlertTriangle" size={14} className="text-destructive" />
              <span className="text-[11px] text-destructive font-medium">
                Saldo negativo previsto no final do mês
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center px-4">
        Previsão baseada na média de receitas dos últimos 90 dias, agrupadas por dia da semana
      </p>
    </div>
  );
}
