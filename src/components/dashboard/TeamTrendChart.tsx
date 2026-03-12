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
    <div className="rounded-2xl border border-border/40 bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <AppIcon name="trending_up" size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Rendimento (14 dias)</h3>
      </div>
      {data.every(d => d.points === 0) ? (
        <p className="text-xs text-muted-foreground text-center py-6">Sem dados disponíveis</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="teamTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={30} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v} pts`, 'Pontos']} />
            <Area type="monotone" dataKey="points" stroke="hsl(var(--primary))" fill="url(#teamTrendGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
