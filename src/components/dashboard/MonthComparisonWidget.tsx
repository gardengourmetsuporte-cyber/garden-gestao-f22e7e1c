import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export function MonthComparisonWidget() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  const { data } = useQuery({
    queryKey: ['month-comparison', unitId],
    queryFn: async () => {
      const now = new Date();
      const thisStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const thisEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const lastStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

      const [thisMonth, lastMonth] = await Promise.all([
        supabase
          .from('cash_closings')
          .select('total_amount')
          .eq('unit_id', unitId!)
          .gte('date', thisStart)
          .lte('date', thisEnd),
        supabase
          .from('cash_closings')
          .select('total_amount')
          .eq('unit_id', unitId!)
          .gte('date', lastStart)
          .lte('date', lastEnd),
      ]);

      const thisTotal = thisMonth.data?.reduce((s, c) => s + Number(c.total_amount || 0), 0) || 0;
      const lastTotal = lastMonth.data?.reduce((s, c) => s + Number(c.total_amount || 0), 0) || 0;
      const variation = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

      return { thisTotal, lastTotal, variation };
    },
    enabled: !!unitId,
  });

  if (!data) return null;

  const isUp = data.variation >= 0;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3">
        <h3 className="text-sm font-semibold mb-3">Comparativo Mês a Mês</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
            <p className="text-lg font-bold">{formatCurrency(data.thisTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mês anterior</p>
            <p className="text-lg font-bold text-muted-foreground">{formatCurrency(data.lastTotal)}</p>
          </div>
        </div>
        {data.lastTotal > 0 && (
          <div className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${isUp ? 'text-primary' : 'text-destructive'}`}>
            <AppIcon name={isUp ? 'TrendingUp' : 'TrendingDown'} size={16} />
            {isUp ? '+' : ''}{data.variation.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MonthComparisonWidget;
