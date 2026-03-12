import { useUnit } from '@/contexts/UnitContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function UnitRankingWidget() {
  const { units } = useUnit();

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['unit-ranking', units.map(u => u.id).join(',')],
    queryFn: async () => {
      if (units.length <= 1) return [];

      const results = await Promise.all(
        units.map(async (unit) => {
          // Get current month revenue
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: closings } = await supabase
            .from('cash_closings')
            .select('total_amount')
            .eq('unit_id', unit.id)
            .gte('date', startOfMonth.toISOString().slice(0, 10))
            .eq('status', 'approved');

          const revenue = (closings || []).reduce((sum, c) => sum + (c.total_amount || 0), 0);

          // Get checklist completion rate
          const { count: totalItems } = await supabase
            .from('checklist_items')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unit.id)
            .eq('is_active', true);

          const { count: completedItems } = await supabase
            .from('checklist_completions')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unit.id)
            .gte('date', startOfMonth.toISOString().slice(0, 10));

          const completionRate = totalItems ? Math.round(((completedItems || 0) / totalItems) * 100) : 0;

          return {
            unitId: unit.id,
            unitName: unit.name,
            revenue,
            completionRate: Math.min(completionRate, 100),
          };
        })
      );

      return results.sort((a, b) => b.revenue - a.revenue);
    },
    enabled: units.length > 1,
    staleTime: 5 * 60 * 1000,
  });

  if (units.length <= 1 || isLoading || rankings.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AppIcon name="Trophy" size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Ranking de Unidades</h3>
        </div>

        <div className="space-y-2">
          {rankings.map((r, i) => (
            <div key={r.unitId} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30">
              <span className="text-lg">{medals[i] || `${i + 1}º`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{r.unitName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    R$ {r.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium",
                    r.completionRate >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                    r.completionRate >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    {r.completionRate}% checklists
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default UnitRankingWidget;
