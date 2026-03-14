import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useMemo } from 'react';

const UNIT_COLORS = [
  'hsl(var(--primary))',
  'hsl(45 93% 58%)',
  'hsl(200 80% 55%)',
  'hsl(280 65% 60%)',
  'hsl(15 80% 55%)',
  'hsl(170 65% 50%)',
];

function PieChart({ data, total, size = 160 }: { data: { value: number; color: string }[]; total: number; size?: number }) {
  const radius = size / 2;
  const innerRadius = radius * 0.62;
  const stroke = radius - innerRadius;
  const mid = (radius + innerRadius) / 2;

  const segments = useMemo(() => {
    if (total === 0) return [];
    const filtered = data.filter(d => d.value > 0);
    
    // Single segment = full circle
    if (filtered.length === 1) {
      return [{ type: 'circle' as const, color: filtered[0].color }];
    }

    let cumulative = 0;
    return filtered.map((d) => {
      const pct = d.value / total;
      const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      cumulative += pct;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const largeArc = pct > 0.5 ? 1 : 0;

      const x1 = radius + mid * Math.cos(startAngle);
      const y1 = radius + mid * Math.sin(startAngle);
      const x2 = radius + mid * Math.cos(endAngle);
      const y2 = radius + mid * Math.sin(endAngle);

      return {
        type: 'arc' as const,
        d: `M ${x1} ${y1} A ${mid} ${mid} 0 ${largeArc} 1 ${x2} ${y2}`,
        color: d.color,
      };
    });
  }, [data, total, mid, radius]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle cx={radius} cy={radius} r={mid} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      {total === 0 ? null : (
        segments.map((s, i) =>
          s.type === 'circle' ? (
            <circle key={i} cx={radius} cy={radius} r={mid} fill="none" stroke={s.color} strokeWidth={stroke} />
          ) : (
            <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={stroke} strokeLinecap="round" />
          )
        )
      )}
    </svg>
  );
}

export function MultiUnitOverview() {
  const { units } = useUnit();

  const { data } = useQuery({
    queryKey: ['multi-unit-overview', units.map(u => u.id)],
    queryFn: async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const results = await Promise.all(
        units.map(async (unit) => {
          const { data: closings } = await supabase
            .from('cash_closings')
            .select('total_amount')
            .eq('unit_id', unit.id)
            .gte('date', monthStart)
            .lte('date', monthEnd);

          const total = closings?.reduce((s, c) => s + Number(c.total_amount || 0), 0) || 0;

          return {
            unitId: unit.id,
            unitName: unit.name,
            monthlyRevenue: total,
          };
        })
      );

      return results.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
    },
    enabled: units.length > 1,
  });

  if (!data || units.length <= 1) return null;

  const totalRevenue = data.reduce((s, u) => s + u.monthlyRevenue, 0);

  const pieData = data.map((u, i) => ({
    value: u.monthlyRevenue,
    color: UNIT_COLORS[i % UNIT_COLORS.length],
  }));

  return (
    <Card className="card-surface">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visão Consolidada</h3>
          <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">{units.length} unidades</span>
        </div>

        {/* Pie + Total */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative shrink-0">
            <PieChart data={pieData} total={totalRevenue} size={120} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {data.map((unit, index) => {
              const pct = totalRevenue > 0 ? ((unit.monthlyRevenue / totalRevenue) * 100).toFixed(0) : '0';
              return (
                <div key={unit.unitId} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: UNIT_COLORS[index % UNIT_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{unit.unitName}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatCurrency(unit.monthlyRevenue)} · {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MultiUnitOverview;
