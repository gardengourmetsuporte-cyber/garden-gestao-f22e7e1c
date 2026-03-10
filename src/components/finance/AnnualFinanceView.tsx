import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, CartesianGrid, AreaChart, Area,
  BarChart,
} from 'recharts';
import { AppIcon } from '@/components/ui/app-icon';
import { AnnualStats } from '@/hooks/useAnnualFinanceStats';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AnnualFinanceViewProps {
  stats: AnnualStats;
  onMonthClick?: (monthIndex: number) => void;
}

const formatCompact = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

function AnnualTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const inc = payload.find((p: any) => p.dataKey === 'income')?.value as number || 0;
  const exp = payload.find((p: any) => p.dataKey === 'expense')?.value as number || 0;
  const bal = inc - exp;
  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl space-y-1">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-xs" style={{ color: '#22c55e' }}>Receita: {formatCurrency(inc)}</p>
      <p className="text-xs" style={{ color: '#ef4444' }}>Despesa: {formatCurrency(exp)}</p>
      <p className={cn("text-xs font-bold", bal >= 0 ? "text-emerald-500" : "text-red-500")}>
        Saldo: {bal >= 0 ? '+' : ''}{formatCurrency(bal)}
      </p>
    </div>
  );
}

export function AnnualFinanceView({ stats, onMonthClick }: AnnualFinanceViewProps) {
  const { months, totalIncome, totalExpense, totalBalance, topCategories, bestMonth, worstMonth, isLoading } = stats;

  const chartData = useMemo(() => months.map(m => ({
    name: m.shortLabel,
    income: m.income,
    expense: m.expense,
    balance: m.balance,
  })), [months]);

  const cumulativeData = useMemo(() => {
    let cumIncome = 0, cumExpense = 0;
    return months.map(m => {
      cumIncome += m.income;
      cumExpense += m.expense;
      return {
        name: m.shortLabel,
        cumulativeIncome: cumIncome,
        cumulativeExpense: cumExpense,
        cumulativeBalance: cumIncome - cumExpense,
      };
    });
  }, [months]);

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 pb-32">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const maxExpense = Math.max(...months.map(m => m.expense), 1);

  return (
    <div className="space-y-4 px-4 pb-32">
      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-base p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Receita</p>
          </div>
          <p className="text-sm font-bold tabular-nums text-emerald-500">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card-base p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Despesa</p>
          </div>
          <p className="text-sm font-bold tabular-nums text-red-500">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="card-base p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: totalBalance >= 0 ? '#22c55e' : '#ef4444' }} />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Resultado</p>
          </div>
          <p className={cn("text-sm font-bold tabular-nums", totalBalance >= 0 ? "text-emerald-500" : "text-red-500")}>
            {totalBalance >= 0 ? '+' : ''}{formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* ═══ 12-MONTH BAR CHART ═══ */}
      <div className="card-base p-3">
        <p className="text-xs font-semibold text-foreground mb-3 px-1">Receita vs Despesa por mês</p>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="annualIncomeBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="annualExpenseBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={formatCompact} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} width={40} />
              <RechartsTooltip content={<AnnualTooltip />} />
              <Bar dataKey="income" fill="url(#annualIncomeBar)" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="expense" fill="url(#annualExpenseBar)" radius={[3, 3, 0, 0]} barSize={12} />
              <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ HEATMAP MENSAL ═══ */}
      <div className="card-base p-3">
        <p className="text-xs font-semibold text-foreground mb-3 px-1">Mapa de despesas</p>
        <div className="grid grid-cols-4 gap-1.5">
          {months.map((m, i) => {
            const intensity = maxExpense > 0 ? m.expense / maxExpense : 0;
            const hasData = m.expense > 0 || m.income > 0;
            return (
              <button
                key={i}
                onClick={() => onMonthClick?.(i)}
                disabled={!hasData}
                className={cn(
                  "rounded-xl p-2.5 text-center transition-all active:scale-95",
                  hasData ? "hover:ring-1 hover:ring-primary/30" : "opacity-40",
                )}
                style={{
                  background: hasData
                    ? `rgba(239, 68, 68, ${0.08 + intensity * 0.35})`
                    : 'hsl(var(--secondary) / 0.3)',
                }}
              >
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{m.shortLabel}</p>
                <p className={cn(
                  "text-xs font-bold tabular-nums mt-0.5",
                  hasData ? "text-foreground" : "text-muted-foreground/50"
                )}>
                  {hasData ? formatCompact(m.expense) : '—'}
                </p>
                {hasData && m.balance !== 0 && (
                  <p className={cn("text-[9px] tabular-nums font-medium", m.balance >= 0 ? "text-emerald-500" : "text-red-400")}>
                    {m.balance >= 0 ? '+' : ''}{formatCompact(m.balance)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ CUMULATIVE EVOLUTION ═══ */}
      <div className="card-base p-3">
        <p className="text-xs font-semibold text-foreground mb-3 px-1">Evolução acumulada</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="annCumIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="annCumExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={formatCompact} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} width={40} />
              <RechartsTooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const inc = payload.find((p: any) => p.dataKey === 'cumulativeIncome')?.value as number || 0;
                  const exp = payload.find((p: any) => p.dataKey === 'cumulativeExpense')?.value as number || 0;
                  const bal = inc - exp;
                  return (
                    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl space-y-1">
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-xs" style={{ color: '#22c55e' }}>Receita: {formatCurrency(inc)}</p>
                      <p className="text-xs" style={{ color: '#ef4444' }}>Despesa: {formatCurrency(exp)}</p>
                      <p className={cn("text-xs font-bold", bal >= 0 ? "text-emerald-500" : "text-red-500")}>
                        Saldo: {bal >= 0 ? '+' : ''}{formatCurrency(bal)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="cumulativeIncome" stroke="#22c55e" strokeWidth={2.5} fill="url(#annCumIncome)" dot={false} activeDot={{ r: 4, fill: '#22c55e', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="cumulativeExpense" stroke="#ef4444" strokeWidth={2.5} fill="url(#annCumExpense)" dot={false} activeDot={{ r: 4, fill: '#ef4444', stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ TOP CATEGORIES ═══ */}
      {topCategories.length > 0 && (
        <div className="card-base p-3">
          <p className="text-xs font-semibold text-foreground mb-3 px-1">Maiores despesas do ano</p>
          <div className="space-y-2.5">
            {topCategories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-muted-foreground w-4 text-right tabular-nums">{i + 1}</span>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-medium text-foreground flex-1 truncate">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{cat.percentage.toFixed(1)}%</span>
                <span className="text-xs font-bold tabular-nums text-foreground min-w-[80px] text-right">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BEST / WORST ═══ */}
      {(bestMonth || worstMonth) && (
        <div className="grid grid-cols-2 gap-2">
          {bestMonth && (
            <div className="card-base p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AppIcon name="TrendingUp" size={14} className="text-emerald-500" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Melhor mês</p>
              </div>
              <p className="text-sm font-bold text-foreground">{bestMonth.label}</p>
              <p className="text-xs tabular-nums text-emerald-500 font-semibold">+{formatCurrency(bestMonth.balance)}</p>
            </div>
          )}
          {worstMonth && (
            <div className="card-base p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AppIcon name="TrendingDown" size={14} className="text-red-500" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pior mês</p>
              </div>
              <p className="text-sm font-bold text-foreground">{worstMonth.label}</p>
              <p className="text-xs tabular-nums text-red-500 font-semibold">{formatCurrency(worstMonth.balance)}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ MONTHLY TABLE ═══ */}
      <div className="card-base overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border/30">
          <p className="text-xs font-semibold text-foreground">Resumo mensal</p>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_50px] gap-1 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/20">
          <span>Mês</span>
          <span className="text-right">Receita</span>
          <span className="text-right">Despesa</span>
          <span className="text-right">Saldo</span>
          <span className="text-right">Var%</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/10">
          {months.map((m, i) => {
            const hasData = m.income > 0 || m.expense > 0;
            return (
              <button
                key={i}
                onClick={() => onMonthClick?.(i)}
                disabled={!hasData}
                className={cn(
                  "grid grid-cols-[1fr_1fr_1fr_1fr_50px] gap-1 px-3 py-2.5 w-full text-left transition-colors",
                  hasData ? "hover:bg-secondary/30 active:bg-secondary/50" : "opacity-40"
                )}
              >
                <span className="text-xs font-medium text-foreground">{m.shortLabel}</span>
                <span className="text-xs tabular-nums text-right text-emerald-500">{hasData ? formatCurrency(m.income) : '—'}</span>
                <span className="text-xs tabular-nums text-right text-red-500">{hasData ? formatCurrency(m.expense) : '—'}</span>
                <span className={cn("text-xs tabular-nums text-right font-semibold", m.balance >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {hasData ? formatCurrency(m.balance) : '—'}
                </span>
                <span className="text-[10px] tabular-nums text-right flex items-center justify-end gap-0.5">
                  {m.variationPct !== null ? (
                    <>
                      <AppIcon
                        name={m.variationPct >= 0 ? 'TrendingUp' : 'TrendingDown'}
                        size={10}
                        className={m.variationPct >= 0 ? 'text-red-400' : 'text-emerald-400'}
                      />
                      <span className={m.variationPct >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {Math.abs(m.variationPct).toFixed(0)}%
                      </span>
                    </>
                  ) : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer totals */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_50px] gap-1 px-3 py-2.5 border-t border-border/40 bg-secondary/20">
          <span className="text-xs font-bold text-foreground">Total</span>
          <span className="text-xs font-bold tabular-nums text-right text-emerald-500">{formatCurrency(totalIncome)}</span>
          <span className="text-xs font-bold tabular-nums text-right text-red-500">{formatCurrency(totalExpense)}</span>
          <span className={cn("text-xs font-bold tabular-nums text-right", totalBalance >= 0 ? "text-emerald-500" : "text-red-500")}>
            {formatCurrency(totalBalance)}
          </span>
          <span />
        </div>
      </div>
    </div>
  );
}
