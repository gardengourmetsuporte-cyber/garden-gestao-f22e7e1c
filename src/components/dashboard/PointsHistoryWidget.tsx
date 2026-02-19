import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DayEntry {
  date: string;
  earned: number;
  completions: number;
  notAwarded: number;
}

function usePointsHistory() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();

  return useQuery({
    queryKey: ['points-history', user?.id, activeUnitId],
    queryFn: async () => {
      const today = new Date();
      const sevenDaysAgo = format(subDays(today, 6), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');

      let query = supabase
        .from('checklist_completions')
        .select('date, points_awarded, awarded_points')
        .eq('completed_by', user!.id)
        .gte('date', sevenDaysAgo)
        .lte('date', todayStr)
        .limit(10000);

      if (activeUnitId) query = query.eq('unit_id', activeUnitId);

      const { data } = await query;

      // Group by date
      const grouped = new Map<string, DayEntry>();

      // Pre-fill all 7 days
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(today, i), 'yyyy-MM-dd');
        grouped.set(d, { date: d, earned: 0, completions: 0, notAwarded: 0 });
      }

      (data || []).forEach(c => {
        const entry = grouped.get(c.date);
        if (!entry) return;
        entry.completions++;
        if (c.awarded_points !== false) {
          entry.earned += c.points_awarded || 0;
        } else {
          entry.notAwarded++;
        }
      });

      return Array.from(grouped.values());
    },
    enabled: !!user,
  });
}

export function PointsHistoryWidget() {
  const { data: history, isLoading } = usePointsHistory();

  if (isLoading) {
    return (
      <div className="card-surface p-4 animate-pulse">
        <div className="h-32 bg-secondary rounded-xl" />
      </div>
    );
  }

  if (!history || history.length === 0) return null;

  const maxEarned = Math.max(...history.map(d => d.earned), 1);
  const totalWeek = history.reduce((s, d) => s + d.earned, 0);

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AppIcon name="History" size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Histórico de Pontos</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{totalWeek}</span> pts na semana
        </span>
      </div>

      <div className="flex items-end gap-1.5 h-20">
        {history.map((day) => {
          const height = maxEarned > 0 ? Math.max(4, (day.earned / maxEarned) * 100) : 4;
          const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
          const dayLabel = format(parseISO(day.date), 'EEE', { locale: ptBR }).slice(0, 3);

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className={cn(
                "text-[10px] font-bold",
                day.earned > 0 ? "text-foreground" : "text-muted-foreground/50"
              )}>
                {day.earned > 0 ? day.earned : '—'}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all",
                  isToday
                    ? "bg-gradient-to-t from-primary to-[hsl(var(--neon-cyan))]"
                    : day.earned > 0
                      ? "bg-primary/60"
                      : "bg-secondary/60"
                )}
                style={{ height: `${height}%` }}
              />
              <span className={cn(
                "text-[10px] capitalize",
                isToday ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Pontos ganhos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-[10px] text-muted-foreground">Sem pontuação</span>
        </div>
      </div>
    </div>
  );
}
