import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ChecklistType = 'abertura' | 'fechamento' | 'bonus';

function getCurrentChecklistType(): { type: ChecklistType; label: string; icon: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 14) return { type: 'abertura', label: 'Abertura', icon: 'Sun', emoji: '☀️' };
  return { type: 'fechamento', label: 'Fechamento', icon: 'Moon', emoji: '🌙' };
}

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = format(new Date(), 'yyyy-MM-dd');
  const current = getCurrentChecklistType();

  // Fetch sectors with items
  const { data: sectors = [] } = useQuery({
    queryKey: ['dashboard-checklist-sectors', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('checklist_sectors')
        .select(`*, subcategories:checklist_subcategories(*, items:checklist_items(*))`)
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

  // Fetch completions for today
  const { data: completions = [] } = useQuery({
    queryKey: ['dashboard-checklist-completions', today, current.type, activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('checklist_completions')
        .select('item_id')
        .eq('date', today)
        .eq('checklist_type', current.type);
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 30 * 1000,
  });

  const progress = useMemo(() => {
    let total = 0;
    const completedIds = new Set(completions.map((c: any) => c.item_id));
    sectors.forEach((s: any) => {
      s.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.is_active && item.checklist_type === current.type) {
            total++;
          }
        });
      });
    });
    const completed = total > 0
      ? [...completedIds].filter(id => {
          let found = false;
          sectors.forEach((s: any) => {
            s.subcategories?.forEach((sub: any) => {
              sub.items?.forEach((item: any) => {
                if (item.id === id && item.is_active && item.checklist_type === current.type) found = true;
              });
            });
          });
          return found;
        }).length
      : 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [sectors, completions, current.type]);

  const isComplete = progress.percent === 100;
  const dateLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <button
      onClick={() => navigate('/checklists')}
      className="col-span-2 text-left animate-slide-up stagger-3 group"
    >
      <div className="card-command p-4 space-y-3 transition-all duration-200 group-hover:scale-[1.01] group-active:scale-[0.98]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <AppIcon name={current.icon as any} size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{current.label}</h3>
              <p className="text-[10px] text-muted-foreground capitalize">{dateLabel}</p>
            </div>
          </div>

          {/* Percentage */}
          <div className="text-right">
            <span className={cn(
              "text-2xl font-black",
              isComplete ? "text-success" : progress.percent > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {progress.percent}%
            </span>
            <p className="text-[10px] text-muted-foreground">
              {progress.completed} de {progress.total}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              isComplete
                ? "bg-success"
                : progress.percent > 0
                  ? "bg-gradient-to-r from-primary to-primary/70"
                  : "bg-muted-foreground/20"
            )}
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Status indicator */}
        {isComplete && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <AppIcon name="CheckCircle2" size={14} className="text-success" />
            <span className="text-xs text-success font-semibold">Completo 🎉</span>
          </div>
        )}
      </div>
    </button>
  );
}
