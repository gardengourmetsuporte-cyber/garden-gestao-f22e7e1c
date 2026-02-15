import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useFinance } from '@/hooks/useFinance';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CashFlowProjectionProps {
  totalBalance: number;
}

export function CashFlowProjection({ totalBalance }: CashFlowProjectionProps) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);

  // Fetch future unpaid transactions (next 90 days)
  const { data: futureTransactions = [] } = useQuery({
    queryKey: ['cash-flow-future', user?.id, activeUnitId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const futureDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('finance_transactions')
        .select('type, amount, date, is_paid')
        .eq('user_id', user!.id)
        .eq('unit_id', activeUnitId!)
        .gte('date', today)
        .lte('date', futureDate)
        .eq('is_paid', false);

      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const points: { date: string; label: string; balance: number }[] = [];
    let runningBalance = totalBalance;

    // Group transactions by date
    const byDate: Record<string, number> = {};
    futureTransactions.forEach(t => {
      const delta = t.type === 'income' ? Number(t.amount) : -Number(t.amount);
      byDate[t.date] = (byDate[t.date] || 0) + delta;
    });

    for (let i = 0; i <= horizon; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const label = format(d, 'dd/MM');
      runningBalance += (byDate[dateStr] || 0);
      // Show fewer points for readability
      if (i === 0 || i === horizon || i % Math.max(1, Math.floor(horizon / 15)) === 0) {
        points.push({ date: dateStr, label, balance: Math.round(runningBalance * 100) / 100 });
      }
    }

    return points;
  }, [futureTransactions, totalBalance, horizon]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  const minBalance = Math.min(...chartData.map(d => d.balance));
  const endBalance = chartData[chartData.length - 1]?.balance ?? totalBalance;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <AppIcon name="TrendingUp" size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Fluxo de Caixa Projetado</h3>
            <span className="text-[10px] text-muted-foreground">Baseado em contas pendentes</span>
          </div>
        </div>
        <div className="flex gap-1">
          {([30, 60, 90] as const).map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-full transition-colors",
                horizon === h
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {h}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="mx-4 card-command p-4">
        <div className="flex justify-between mb-3">
          <div>
            <span className="text-[10px] text-muted-foreground block">Saldo Atual</span>
            <span className="text-sm font-bold text-foreground">{formatCurrency(totalBalance)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">Projeção {horizon}d</span>
            <span className={cn("text-sm font-bold", endBalance >= 0 ? "text-success" : "text-destructive")}>
              {formatCurrency(endBalance)}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => formatCurrency(v)}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                'Saldo'
              ]}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--destructive) / 0.3)" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {minBalance < 0 && (
          <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg bg-destructive/8">
            <AppIcon name="AlertTriangle" size={14} className="text-destructive" />
            <span className="text-[11px] text-destructive font-medium">
              Saldo negativo previsto de {formatCurrency(minBalance)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
