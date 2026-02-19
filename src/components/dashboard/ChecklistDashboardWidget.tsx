import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChecklistType = 'abertura' | 'fechamento';

function getCurrentChecklistType(): ChecklistType {
  const h = new Date().getHours();
  if (h >= 17 && h < 23) return 'abertura';
  return 'fechamento';
}

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = new Date().toISOString().slice(0, 10);
  const activeType = getCurrentChecklistType();

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

  const cards: { type: ChecklistType; label: string; icon: typeof Sun; progress: typeof abertura; accentColor: string; accentBg: string; textColor: string }[] = [
    {
      type: 'abertura',
      label: 'Abertura',
      icon: Sun,
      progress: abertura,
      accentColor: 'text-amber-400',
      accentBg: 'bg-amber-600/80',
      textColor: 'text-amber-400',
    },
    {
      type: 'fechamento',
      label: 'Fechamento',
      icon: Moon,
      progress: fechamento,
      accentColor: 'text-violet-400',
      accentBg: 'bg-violet-600/40',
      textColor: 'text-violet-400',
    },
  ];

  return (
    <div className="col-span-2 grid grid-cols-2 gap-3 animate-slide-up stagger-3">
      {cards.map((card) => {
        const isActive = card.type === activeType;
        const Icon = card.icon;
        const isComplete = card.progress.percent === 100;

        return (
          <button
            key={card.type}
            onClick={() => navigate('/checklists')}
            className={cn(
              "relative text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.97]",
              "bg-card border",
              isActive
                ? "border-primary/50 ring-1 ring-primary/30 shadow-lg shadow-primary/10"
                : "border-border/40"
            )}
          >
            {/* Active dot indicator */}
            {isActive && (
              <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full", card.accentBg, "animate-pulse")} />
            )}

            {/* Icon + Label */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isComplete ? "bg-success/20" : card.accentBg
              )}>
                <Icon className={cn("w-5 h-5", isComplete ? "text-success" : "text-white")} />
              </div>
              <span className={cn(
                "text-base font-bold",
                isComplete ? "text-success" : "text-foreground"
              )}>
                {card.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden mb-3">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  isComplete
                    ? "bg-success"
                    : card.type === 'abertura'
                      ? "bg-amber-500"
                      : "bg-violet-500"
                )}
                style={{ width: `${card.progress.percent}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {card.progress.completed}/{card.progress.total}
              </span>
              <span className={cn(
                "text-lg font-black",
                isComplete ? "text-success" : card.textColor
              )}>
                {card.progress.percent}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
