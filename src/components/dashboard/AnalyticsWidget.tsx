import { useMemo } from 'react';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { AppIcon } from '@/components/ui/app-icon';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { ShimmerSkeleton } from '@/components/ui/shimmer-skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <ShimmerSkeleton className="h-4 w-32" />
      <ShimmerSkeleton className="h-[140px] w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <ShimmerSkeleton className="h-16 rounded-xl" />
        <ShimmerSkeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function AnalyticsWidget() {
  const { data, isLoading } = useDashboardAnalytics(4);

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data || data.daysWithData === 0) return null;

  // Show last 14 days for chart readability
  const chartData = data.dailyRevenue.slice(-14);

  return (
    <div className="card-surface p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
            <AppIcon name="TrendingUp" size={16} className="text-primary" />
          </div>
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Analytics</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Últimos 28 dias</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Faturamento</p>
          <p className="text-base font-bold text-foreground mt-0.5">{formatCurrencyCompact(data.totalPeriod)}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ticket Médio</p>
          <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(data.avgTicket)}</p>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Receita Diária</p>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval={Math.ceil(chartData.length / 7)}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
              <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.total > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                    fillOpacity={entry.total > 0 ? 0.85 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Breakdown */}
      {data.paymentBreakdown.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meios de Pagamento</p>
          <div className="space-y-1.5">
            {data.paymentBreakdown
              .sort((a, b) => b.total - a.total)
              .map((pm, i) => {
                const pct = data.totalPeriod > 0 ? (pm.total / data.totalPeriod) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pm.color }} />
                    <span className="text-foreground flex-1 truncate">{pm.method}</span>
                    <span className="text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                    <span className="text-foreground font-medium tabular-nums w-20 text-right">{formatCurrencyCompact(pm.total)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
