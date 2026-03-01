import { useMemo, useState } from 'react';
import { formatCurrencySimple as formatCurrency } from '@/lib/format';
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addWeeks, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { CashClosing, PAYMENT_METHODS } from '@/types/cashClosing';
import { useCountUpCurrency } from '@/hooks/useCountUp';

interface Props {
  closings: CashClosing[];
}

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUpCurrency(value);
  return <>{`R$ ${animated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</>;
}

export function WeeklySummary({ closings }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const summary = useMemo(() => {
    const target = addWeeks(new Date(), weekOffset);
    const weekStart = startOfWeek(target, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(target, { weekStartsOn: 1 });

    // Previous week for comparison
    const prevWeekStart = startOfWeek(addWeeks(target, -1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(addWeeks(target, -1), { weekStartsOn: 1 });

    const weekClosings = closings.filter(c => {
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    const prevWeekClosings = closings.filter(c => {
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: prevWeekStart, end: prevWeekEnd });
    });

    const total = weekClosings.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const prevTotal = prevWeekClosings.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const count = weekClosings.length;

    // Calculate variation percentage
    const variation = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

    const byMethod: Record<string, number> = {};
    PAYMENT_METHODS.forEach(m => { byMethod[m.key] = 0; });
    weekClosings.forEach(c => {
      PAYMENT_METHODS.forEach(m => {
        byMethod[m.key] += Number((c as any)[m.key]) || 0;
      });
    });

    const topMethods = PAYMENT_METHODS
      .map(m => ({ ...m, value: byMethod[m.key] }))
      .filter(m => m.value > 0)
      .sort((a, b) => b.value - a.value);

    const isCurrentWeek = isSameWeek(target, new Date(), { weekStartsOn: 1 });

    return {
      total,
      prevTotal,
      variation,
      count,
      topMethods,
      weekLabel: `${format(weekStart, "dd/MM", { locale: ptBR })} – ${format(weekEnd, "dd/MM", { locale: ptBR })}`,
      isCurrentWeek,
    };
  }, [closings, weekOffset]);

  

  return (
    <div className="card-command p-4 space-y-3">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <AppIcon name="ChevronLeft" size={16} className="text-muted-foreground" />
        </button>

        <div className="text-center flex-1">
          <h3 className="text-sm font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Resumo da Semana</h3>
          <span className="text-[10px] text-muted-foreground">
            {summary.weekLabel} • {summary.count} fechamento{summary.count !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={summary.isCurrentWeek}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/60 hover:bg-secondary transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
        </button>
      </div>

      {summary.count === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Nenhum fechamento nesta semana</p>
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="text-center py-2">
            <span className="text-2xl font-black text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
              <AnimatedCurrency value={summary.total} />
            </span>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <p className="text-[10px] text-muted-foreground">Total em vendas na semana</p>
              {summary.variation !== null && (
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${summary.variation >= 0 ? 'text-success' : 'text-destructive'}`}>
                  <AppIcon name={summary.variation >= 0 ? 'TrendingUp' : 'TrendingDown'} size={10} />
                  {summary.variation >= 0 ? '+' : ''}{summary.variation.toFixed(1)}%
                </span>
              )}
            </div>
            {summary.prevTotal > 0 && (
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                Semana anterior: {formatCurrency(summary.prevTotal)}
              </p>
            )}
          </div>

          {/* Breakdown by method */}
          {summary.topMethods.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {summary.topMethods.map(m => (
                <div key={m.key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: m.color + '20' }}>
                    <AppIcon name={m.icon} size={12} style={{ color: m.color }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block truncate">{m.label}</span>
                    <span className="text-xs font-bold text-foreground">
                      {formatCurrency(m.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
