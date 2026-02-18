import { useMemo } from 'react';
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { CashClosing, PAYMENT_METHODS } from '@/types/cashClosing';

interface Props {
  closings: CashClosing[];
}

export function WeeklySummary({ closings }: Props) {
  const summary = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const weekClosings = closings.filter(c => {
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    const total = weekClosings.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const count = weekClosings.length;

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

    return {
      total,
      count,
      topMethods,
      weekLabel: `${format(weekStart, "dd/MM", { locale: ptBR })} – ${format(weekEnd, "dd/MM", { locale: ptBR })}`,
    };
  }, [closings]);

  if (summary.count === 0) {
    return (
      <div className="card-command p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <AppIcon name="CalendarRange" size={16} />
          <span>Nenhum fechamento nesta semana ({summary.weekLabel})</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-command p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15">
            <AppIcon name="CalendarRange" size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Resumo da Semana</h3>
            <span className="text-[10px] text-muted-foreground">{summary.weekLabel} • {summary.count} fechamento{summary.count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="text-center py-2">
        <span className="text-2xl font-black text-foreground">
          R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
        <p className="text-[10px] text-muted-foreground mt-0.5">Total em vendas na semana</p>
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
                  R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
