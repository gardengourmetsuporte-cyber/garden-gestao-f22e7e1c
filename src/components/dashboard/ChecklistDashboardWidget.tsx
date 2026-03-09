import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { getCurrentChecklistType, getDeadlineInfo, getTodayDateStr } from '@/lib/checklistTiming';
import { useChecklistDeadlines } from '@/hooks/useChecklistDeadlines';

type ChecklistType = 'abertura' | 'fechamento';

function RingProgress({ percent, size = 44, stroke = 3, isComplete }: {
  percent: number; size?: number; stroke?: number; isComplete: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="hsl(var(--muted) / 0.2)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={isComplete ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <AppIcon name="check" size={18} fill={1} className="text-success" />
        ) : (
          <span className="text-[11px] font-bold text-foreground tabular-nums">{percent}%</span>
        )}
      </div>
    </div>
  );
}

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = getTodayDateStr();
  const { settings: deadlineSettings } = useChecklistDeadlines();
  const activeType = getCurrentChecklistType(deadlineSettings);

  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  useEffect(() => {
    const update = () => {
      const ab = getDeadlineInfo(today, 'abertura', deadlineSettings);
      const fe = getDeadlineInfo(today, 'fechamento', deadlineSettings);
      setCountdowns({ abertura: ab?.label || '', fechamento: fe?.label || '' });
    };
    update();
    const iv = setInterval(update, 30_000);
    return () => clearInterval(iv);
  }, [today, deadlineSettings]);

  const { data: sectors = [] } = useQuery({
    queryKey: ['dashboard-checklist-sectors', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('checklist_sectors')
        .select(`*, subcategories:checklist_subcategories(*, items:checklist_items(*))`)
        .eq('scope', 'standard')
        .order('sort_order');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return (data || []).map((s: any) => ({
        ...s,
        subcategories: (s.subcategories || []).map((sub: any) => ({
          ...sub,
          items: (sub.items || []).filter((i: any) => i.deleted_at === null),
        })),
      }));
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: aberturaCompletions = [] } = useQuery({
    queryKey: ['dashboard-checklist-completions', today, 'abertura', activeUnitId],
    queryFn: async () => {
      let query = supabase.from('checklist_completions').select('item_id').eq('date', today).eq('checklist_type', 'abertura');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30 * 1000,
  });

  const { data: fechamentoCompletions = [] } = useQuery({
    queryKey: ['dashboard-checklist-completions', today, 'fechamento', activeUnitId],
    queryFn: async () => {
      let query = supabase.from('checklist_completions').select('item_id').eq('date', today).eq('checklist_type', 'fechamento');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30 * 1000,
  });

  const getProgress = useMemo(() => {
    return (type: ChecklistType, completions: any[]) => {
      const completedIds = new Set(completions.map((c: any) => c.item_id));
      let total = 0, completed = 0;
      sectors.forEach((s: any) => {
        s.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            if (item.is_active && item.checklist_type === type) {
              total++;
              if (completedIds.has(item.id)) completed++;
            }
          });
        });
      });
      return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };
  }, [sectors]);

  const abertura = getProgress('abertura', aberturaCompletions);
  const fechamento = getProgress('fechamento', fechamentoCompletions);
  const totalCompleted = abertura.completed + fechamento.completed;
  const totalItems = abertura.total + fechamento.total;
  const totalPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && totalCompleted === totalItems;

  const cards: { type: ChecklistType; label: string; icon: string; progress: typeof abertura }[] = [
    { type: 'abertura', label: 'Abertura', icon: 'light_mode', progress: abertura },
    { type: 'fechamento', label: 'Fechamento', icon: 'dark_mode', progress: fechamento },
  ];

  return (
    <button
      onClick={() => navigate('/checklists')}
      className="w-full text-left card-unified p-4 group transition-all duration-300 hover:shadow-card-hover"
    >
      <div className="space-y-3">
        {/* Header: compact single line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppIcon name="checklist" size={16} className="text-primary" />
            <span className="text-xs font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
              Checklists
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-bold tabular-nums",
              allDone ? "text-success" : "text-foreground"
            )}>
              {totalPercent}%
            </span>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>

        {/* Shift cards — clean minimal */}
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card) => {
            const isActive = card.type === activeType;
            const isComplete = card.progress.percent === 100;
            const pending = card.progress.total - card.progress.completed;
            const deadlineInfo = getDeadlineInfo(today, card.type, deadlineSettings);

            return (
              <div
                key={card.type}
                className={cn(
                  "relative rounded-xl p-3 transition-all duration-300",
                  isComplete
                    ? "bg-success/[0.06] border border-success/10"
                    : isActive
                    ? "bg-primary/[0.06] border border-primary/10"
                    : "bg-muted/[0.06] border border-border/10"
                )}
              >
                {/* Active pulse dot */}
                {isActive && !isComplete && (
                  <div className="absolute top-2.5 right-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-primary animate-ping opacity-30" />
                  </div>
                )}

                {/* Ring + Label row */}
                <div className="flex items-center gap-2.5">
                  <RingProgress
                    percent={card.progress.percent}
                    isComplete={isComplete}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[13px] font-semibold leading-tight",
                      isComplete ? "text-success" : "text-foreground"
                    )}>
                      {card.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">
                      {card.progress.completed}/{card.progress.total} itens
                    </p>
                  </div>
                </div>

                {/* Status line */}
                <div className="mt-2 pt-2 border-t border-border/5">
                  {isComplete ? (
                    <span className="text-[10px] font-semibold text-success flex items-center gap-1">
                      <AppIcon name="check_circle" size={12} fill={1} />
                      Concluído
                    </span>
                  ) : deadlineInfo && !deadlineInfo.passed ? (
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                      {countdowns[card.type] || deadlineInfo.label}
                    </span>
                  ) : deadlineInfo?.passed ? (
                    <span className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                      <AppIcon name="error" size={12} fill={1} />
                      Encerrado
                    </span>
                  ) : pending > 0 ? (
                    <span className="text-[10px] text-muted-foreground/50">
                      {pending} restante{pending > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}
