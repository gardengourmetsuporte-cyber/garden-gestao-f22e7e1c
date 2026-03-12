import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TeamMemberStats } from '@/hooks/useTeamDashboard';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  members: TeamMemberStats[];
}

export function TeamUtilizationChart({ members }: Props) {
  const raw = members.slice(0, 8).map(m => {
    const parts = m.full_name.split(' ');
    return { firstName: parts[0], lastInitial: parts[1]?.[0] ?? '', pct: m.utilizationPct, fullName: m.full_name };
  });

  // Deduplicate first names
  const firstNameCount = raw.reduce<Record<string, number>>((acc, r) => {
    acc[r.firstName] = (acc[r.firstName] || 0) + 1;
    return acc;
  }, {});

  const data = raw.map(r => ({
    name: firstNameCount[r.firstName] > 1 && r.lastInitial ? `${r.firstName} ${r.lastInitial}.` : r.firstName,
    pct: r.pct,
    fullName: r.fullName,
  }));

  const chartHeight = Math.max(120, data.length * 32 + 20);

  const getColor = (pct: number) => {
    if (pct >= 80) return 'hsl(var(--primary))';
    if (pct >= 50) return 'hsl(45 93% 47%)';
    if (pct > 0) return 'hsl(var(--destructive))';
    return 'hsl(var(--muted-foreground) / 0.3)';
  };

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <AppIcon name="bar_chart" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Aproveitamento por membro</h3>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
            <AppIcon name="bar_chart" size={20} className="text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number) => [`${v}%`, 'Aproveitamento']}
              labelFormatter={(_label: string, payload: any[]) => payload?.[0]?.payload?.fullName ?? _label}
              contentStyle={{
                fontSize: 12, borderRadius: 12, border: 'none',
                background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))',
                boxShadow: '0 8px 24px -4px hsl(0 0% 0% / 0.3)',
              }}
            />
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
