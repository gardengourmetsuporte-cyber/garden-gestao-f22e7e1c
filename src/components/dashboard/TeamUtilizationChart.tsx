import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TeamMemberStats } from '@/hooks/useTeamDashboard';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  members: TeamMemberStats[];
}

export function TeamUtilizationChart({ members }: Props) {
  const data = members.slice(0, 8).map(m => ({
    name: m.full_name.split(' ')[0],
    pct: m.utilizationPct,
  }));

  const getColor = (pct: number) => {
    if (pct >= 80) return 'hsl(var(--primary))';
    if (pct >= 50) return 'hsl(var(--warning, 45 93% 47%))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <AppIcon name="bar_chart" size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Aproveitamento por membro</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Sem dados disponíveis</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} stroke="hsl(var(--muted-foreground))" />
            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.pct)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
