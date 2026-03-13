import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function BreakEvenWidget() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  const { data } = useQuery({
    queryKey: ['break-even', unitId],
    queryFn: async () => {
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');

      // Get revenue from cash_closings
      const { data: closings } = await supabase
        .from('cash_closings')
        .select('total_amount')
        .eq('unit_id', unitId!)
        .gte('date', start)
        .lte('date', end);

      const revenue = closings?.reduce((s, c) => s + Number(c.total_amount || 0), 0) || 0;

      // Get expenses for the month
      const { data: expenses } = await supabase
        .from('finance_transactions')
        .select('amount, type')
        .eq('unit_id', unitId!)
        .eq('type', 'expense')
        .eq('is_paid', true)
        .gte('date', start)
        .lte('date', end);

      const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount || 0), 0) || 0;

      // Estimate CMV % (simplified: 30% default if no data)
      const cmvPercent = revenue > 0 ? Math.min((totalExpenses / revenue) * 0.5, 0.6) : 0.3;
      const fixedCosts = totalExpenses * 0.7; // rough estimate
      const breakEven = cmvPercent < 1 ? fixedCosts / (1 - cmvPercent) : 0;

      return { revenue, totalExpenses, breakEven, reachedPct: breakEven > 0 ? (revenue / breakEven) * 100 : 0 };
    },
    enabled: !!unitId,
  });

  if (!data || data.breakEven === 0) return null;

  const reached = data.reachedPct >= 100;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3">
        <h3 className="text-sm font-semibold mb-3">Ponto de Equilíbrio (Estimativa)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Break-even</p>
            <p className="text-lg font-bold">{formatCurrency(data.breakEven)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita Atual</p>
            <p className="text-lg font-bold">{formatCurrency(data.revenue)}</p>
          </div>
        </div>
        <div className="mt-3 w-full bg-muted/50 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${reached ? 'bg-primary' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(data.reachedPct, 100)}%` }}
          />
        </div>
        <p className={`text-xs font-medium mt-1 ${reached ? 'text-primary' : 'text-amber-500'}`}>
          {reached ? '✅ Meta atingida!' : `${data.reachedPct.toFixed(0)}% do break-even`}
        </p>
      </CardContent>
    </Card>
  );
}

export default BreakEvenWidget;
