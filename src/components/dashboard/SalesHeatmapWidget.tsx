import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8h-21h

export function SalesHeatmapWidget() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  const { data } = useQuery({
    queryKey: ['sales-heatmap', unitId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sales } = await supabase
        .from('pos_sales')
        .select('created_at, total')
        .eq('unit_id', unitId!)
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Build grid: day_of_week (0-6) x hour (8-21)
      const grid = Array.from({ length: 7 }, () => Array(14).fill(0));
      let maxVal = 0;

      sales?.forEach(s => {
        const d = new Date(s.created_at);
        const dow = d.getDay();
        const hour = d.getHours();
        if (hour >= 8 && hour <= 21) {
          grid[dow][hour - 8] += Number(s.total || 0);
          maxVal = Math.max(maxVal, grid[dow][hour - 8]);
        }
      });

      return { grid, maxVal };
    },
    enabled: !!unitId,
  });

  if (!data || data.maxVal === 0) return null;

  const getIntensity = (val: number) => {
    if (val === 0) return 'bg-muted/30';
    const pct = val / data.maxVal;
    if (pct < 0.25) return 'bg-emerald-500/20';
    if (pct < 0.5) return 'bg-emerald-500/40';
    if (pct < 0.75) return 'bg-emerald-500/60';
    return 'bg-emerald-500/90';
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3">
        <h3 className="text-sm font-semibold mb-3">Mapa de Calor de Vendas (30 dias)</h3>
        <div className="overflow-x-auto">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
            {/* Header */}
            <div />
            {HOURS.map(h => (
              <div key={h} className="text-[9px] text-muted-foreground text-center">{h}h</div>
            ))}
            {/* Grid rows */}
            {DAYS.map((day, dow) => (
              <>
                <div key={`label-${dow}`} className="text-[10px] text-muted-foreground flex items-center">{day}</div>
                {HOURS.map((_, hi) => (
                  <div
                    key={`${dow}-${hi}`}
                    className={cn('rounded-sm aspect-square min-w-[16px]', getIntensity(data.grid[dow][hi]))}
                    title={`${day} ${HOURS[hi]}h: R$ ${data.grid[dow][hi].toFixed(0)}`}
                  />
                ))}
              </>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SalesHeatmapWidget;
