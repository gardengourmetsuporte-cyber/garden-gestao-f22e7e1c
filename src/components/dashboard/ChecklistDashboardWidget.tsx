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

/** Animated arc progress */
function ArcProgress({ percent, size = 56, stroke = 3.5, isComplete }: {
  percent: number; size?: number; stroke?: number; isComplete: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="hsl(var(--muted) / 0.25)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={isComplete ? 'hsl(var(--success))' : 'url(#arcGrad)'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--neon-cyan))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <AppIcon name="check" size={24} fill={1} className="text-success animate-scale-in" />
        ) : (
          <span className="text-sm font-black text-foreground tabular-nums">{percent}%</span>
        )}
      </div>
    </div>
  );
}

/** Mini inline bar */
function MiniBar({ percent, isComplete }: { percent: number; isComplete: boolean }) {
  return (
    <div className="h-1 rounded-full bg-muted/20 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          isComplete ? "bg-success" : "bg-gradient-to-r from-primary to-[hsl(var(--neon-cyan))]"
        )}
        style={{ width: `${Math.max(percent, 2)}%` }}
      />
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
      className={cn(
        "w-full text-left rounded-2xl overflow-hidden transition-all duration-300",
        "relative group"
      )}
      style={{
        background: 'linear-gradient(145deg, hsl(var(--card) / 0.95), hsl(var(--card) / 0.7))',
        border: allDone
          ? '1px solid hsl(var(--success) / 0.3)'
          : '1px solid hsl(var(--border) / 0.15)',
        boxShadow: allDone
          ? '0 0 30px hsl(var(--success) / 0.08)'
          : '0 4px 24px hsl(var(--background) / 0.3)',
      }}
    >
      {/* Subtle glow overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: allDone
            ? 'radial-gradient(ellipse at 30% 20%, hsl(var(--success) / 0.08), transparent 60%)'
            : 'radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.06), transparent 60%)',
        }}
      />

      <div className="relative p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center gap-3.5">
          <ArcProgress percent={totalPercent} isComplete={allDone} />
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-[15px] font-bold tracking-tight",
              allDone ? "text-success" : "text-foreground"
            )}>
              {allDone ? 'Tudo concluído! 🎉' : (
                <>
                  <span className="tabular-nums">{totalCompleted}</span>
                  <span className="text-muted-foreground font-medium"> de </span>
                  <span className="tabular-nums">{totalItems}</span>
                  <span className="text-muted-foreground font-medium"> tarefas</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              {allDone ? 'Excelente trabalho hoje' : 'Progresso de hoje'}
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-muted/20 flex items-center justify-center group-hover:bg-muted/40 transition-colors">
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/60" />
          </div>
        </div>

        {/* Shift cards */}
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card) => {
            const isActive = card.type === activeType;
            const isComplete = card.progress.percent === 100;
            const pending = card.progress.total - card.progress.completed;
            const deadlineInfo = getDeadlineInfo(today, card.type, deadlineSettings);

            return (
              <div
                key={card.type}
                className="relative rounded-xl p-3 transition-all duration-300"
                style={{
                  background: isComplete
                    ? 'linear-gradient(135deg, hsl(var(--success) / 0.08), hsl(var(--success) / 0.03))'
                    : isActive
                    ? 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))'
                    : 'hsl(var(--muted) / 0.08)',
                  border: isComplete
                    ? '1px solid hsl(var(--success) / 0.15)'
                    : isActive
                    ? '1px solid hsl(var(--primary) / 0.12)'
                    : '1px solid hsl(var(--border) / 0.08)',
                }}
              >
                {/* Active dot */}
                {isActive && !isComplete && (
                  <div className="absolute top-2 right-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-primary animate-ping opacity-40" />
                  </div>
                )}

                {/* Icon + Label */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isComplete
                      ? "bg-success/15"
                      : isActive
                      ? "bg-primary/10"
                      : "bg-muted/15"
                  )}>
                    <AppIcon
                      name={isComplete ? 'check_circle' : card.icon}
                      size={18}
                      fill={isComplete ? 1 : 0}
                      className={cn(
                        isComplete ? "text-success" : isActive ? "text-primary" : "text-muted-foreground/60"
                      )}
                    />
                  </div>
                  <span className={cn(
                    "text-[13px] font-semibold",
                    isComplete ? "text-success" : "text-foreground"
                  )}>
                    {card.label}
                  </span>
                </div>

                {/* Bar */}
                <MiniBar percent={card.progress.percent} isComplete={isComplete} />

                {/* Stats row */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] tabular-nums font-semibold text-muted-foreground">
                    {card.progress.completed}/{card.progress.total}
                  </span>
                  {isComplete ? (
                    <span className="text-[10px] font-bold text-success">Concluído</span>
                  ) : deadlineInfo && !deadlineInfo.passed ? (
                    <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums">
                      {countdowns[card.type] || deadlineInfo.label}
                    </span>
                  ) : deadlineInfo?.passed ? (
                    <span className="text-[10px] font-bold text-destructive">Encerrado</span>
                  ) : pending > 0 ? (
                    <span className="text-[10px] font-medium text-muted-foreground/60">
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
