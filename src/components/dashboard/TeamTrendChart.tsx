import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendPoint } from '@/hooks/useTeamDashboard';
import { AppIcon } from '@/components/ui/app-icon';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  trend: TrendPoint[];
}

export function TeamTrendChart({ trend }: Props) {
  const data = trend.map(t => ({
    ...t,
    label: format(parseISO(t.date), 'dd/MM', { locale: ptBR }),
  }));

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <AppIcon name="trending_up" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Rendimento (14 dias)</h3>
      </div>
      {data.every(d => d.points === 0) ? (
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
            <AppIcon name="trending_up" size={20} className="text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="teamTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={30}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12, borderRadius: 12, border: 'none',
                background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))',
                boxShadow: '0 8px 24px -4px hsl(0 0% 0% / 0.3)',
              }}
              formatter={(v: number) => [`${v} pts`, 'Rendimento']}
            />
            <Area type="monotone" dataKey="points" stroke="hsl(var(--primary))" fill="url(#teamTrendGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
