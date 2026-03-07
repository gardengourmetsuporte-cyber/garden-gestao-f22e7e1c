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

// Circular progress ring
function ProgressRing({ percent, size = 52, strokeWidth = 4, isComplete, isActive }: {
  percent: number; size?: number; strokeWidth?: number; isComplete: boolean; isActive: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isComplete ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <AppIcon name="check" size={22} fill={1} className="text-success animate-scale-in" />
        ) : (
          <span className={cn(
            "text-xs font-black",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {percent}%
          </span>
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

  // Countdown labels
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
      let total = 0;
      let completed = 0;
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
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, percent };
    };
  }, [sectors]);

  const abertura = getProgress('abertura', aberturaCompletions);
  const fechamento = getProgress('fechamento', fechamentoCompletions);

  const totalCompleted = abertura.completed + fechamento.completed;
  const totalItems = abertura.total + fechamento.total;
  const totalPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && totalCompleted === totalItems;

  const cards: { type: ChecklistType; label: string; iconName: string; progress: typeof abertura }[] = [
    { type: 'abertura', label: 'Abertura', iconName: 'light_mode', progress: abertura },
    { type: 'fechamento', label: 'Fechamento', iconName: 'dark_mode', progress: fechamento },
  ];

  return (
    <button
      onClick={() => navigate('/checklists')}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-all duration-300",
        "card-surface border border-white/5",
        allDone && "ring-1 ring-success/30"
      )}
    >
      {/* Top row: overall summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProgressRing
            percent={totalPercent}
            isComplete={allDone}
            isActive={true}
          />
          <div>
            <p className={cn(
              "text-sm font-bold",
              allDone ? "text-success" : "text-foreground"
            )}>
              {allDone ? 'Tudo concluído! 🎉' : `${totalCompleted} de ${totalItems} tarefas`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {allDone ? 'Excelente trabalho hoje' : 'Progresso de hoje'}
            </p>
          </div>
        </div>
        <AppIcon name="ChevronRight" size={18} className="text-muted-foreground/50" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-2 gap-2.5">
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
                isActive
                  ? "bg-primary/8 border border-primary/15"
                  : "bg-secondary/30 border border-transparent",
                isComplete && "bg-success/8 border-success/15"
              )}
            >
              {/* Active pulse */}
              {isActive && !isComplete && (
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}

              {/* Icon + Title */}
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  isComplete ? "bg-success/20" : isActive ? "bg-primary/15" : "bg-muted/60"
                )}>
                  <AppIcon
                    name={isComplete ? 'check_circle' : card.iconName}
                    size={16}
                    fill={isComplete ? 1 : 0}
                    className={cn(
                      isComplete ? "text-success" : isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  isComplete ? "text-success" : "text-foreground"
                )}>
                  {card.label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden mb-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    isComplete ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${card.progress.percent}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {card.progress.completed}/{card.progress.total}
                </span>
                {isComplete ? (
                  <span className="text-[10px] font-semibold text-success">✓ OK</span>
                ) : deadlineInfo && !deadlineInfo.passed ? (
                  <span className="text-[10px] font-medium text-muted-foreground/70">
                    ⏳ {countdowns[card.type] || deadlineInfo.label}
                  </span>
                ) : deadlineInfo?.passed ? (
                  <span className="text-[10px] font-semibold text-destructive">⏰ Encerrado</span>
                ) : pending > 0 ? (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {pending} restante{pending > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}
