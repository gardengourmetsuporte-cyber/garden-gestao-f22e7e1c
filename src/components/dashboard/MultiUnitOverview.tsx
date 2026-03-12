import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Visão Consolidada</h3>
          <span className="text-xs text-muted-foreground">{units.length} unidades</span>
        </div>

        <div className="mb-3 p-3 rounded-xl bg-primary/5">
          <p className="text-xs text-muted-foreground">Receita Total do Mês</p>
          <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="space-y-2">
          {data.map((unit, index) => {
            const pct = totalRevenue > 0 ? (unit.monthlyRevenue / totalRevenue) * 100 : 0;
            return (
              <div key={unit.unitId} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}º</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{unit.unitName}</span>
                    <span className="text-xs font-bold">{formatCurrency(unit.monthlyRevenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default MultiUnitOverview;
