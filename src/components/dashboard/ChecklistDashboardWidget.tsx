import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

type ChecklistType = 'abertura' | 'fechamento' | 'bonus';

const iconMap: Record<string, string> = {
  ChefHat: 'ChefHat',
  UtensilsCrossed: 'UtensilsCrossed',
  Wallet: 'Wallet',
  Bath: 'Bath',
  Folder: 'Folder',
};

function getCurrentChecklistType(): { type: ChecklistType; label: string; icon: string; emoji: string } {
  const h = new Date().getHours();
  // Empresa abre às 19h, funcionários chegam às 17h
  // Abertura: 17h até hora de fechar (~23h), Fechamento: 23h até 17h do dia seguinte
  if (h >= 17 && h < 23) return { type: 'abertura', label: 'Abertura', icon: 'Sun', emoji: '☀️' };
  return { type: 'fechamento', label: 'Fechamento', icon: 'Moon', emoji: '🌙' };
}

export function ChecklistDashboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const today = new Date().toISOString().slice(0, 10);
  const current = getCurrentChecklistType();

  const { data: sectors = [] } = useQuery({
    queryKey: ['dashboard-checklist-sectors', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('checklist_sectors')
        .select(`*, subcategories:checklist_subcategories(*, items:checklist_items(*))`)
        .eq('scope', 'standard')
        .order('sort_order')
        .order('sort_order', { referencedTable: 'subcategories' })
        .order('sort_order', { referencedTable: 'subcategories.items' });
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

  const completedIds = useMemo(() => new Set(completions.map((c: any) => c.item_id)), [completions]);

  // Build sector progress data
  const sectorData = useMemo(() => {
    return sectors
      .filter((sector: any) =>
        sector.subcategories?.some((sub: any) =>
          sub.items?.some((i: any) => i.is_active && i.checklist_type === current.type)
        )
      )
      .map((sector: any) => {
        let total = 0;
        let completed = 0;
        sector.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            if (item.is_active && item.checklist_type === current.type) {
              total++;
              if (completedIds.has(item.id)) completed++;
            }
          });
        });
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { id: sector.id, name: sector.name, icon: sector.icon, color: sector.color, completed, total, percent };
      });
  }, [sectors, completedIds, current.type]);

  const globalTotal = sectorData.reduce((acc, s) => acc + s.total, 0);
  const globalCompleted = sectorData.reduce((acc, s) => acc + s.completed, 0);
  const globalPercent = globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0;
  const isComplete = globalPercent === 100;

  return (
    <button
      onClick={() => navigate('/checklists')}
      className="col-span-2 text-left animate-slide-up stagger-3 group"
    >
      <div className={cn(
        "rounded-xl border p-4 space-y-3 transition-all duration-200 group-hover:scale-[1.01] group-active:scale-[0.98]",
        isComplete
          ? "bg-success/5 border-success/30"
          : "bg-card border-border/50"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isComplete ? "bg-success/20" : "bg-primary/15"
            )}>
              {isComplete
                ? <Check className="w-5 h-5 text-success" />
                : <AppIcon name={current.icon as any} size={18} className="text-primary" />
              }
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{current.label}</h3>
              <p className="text-[10px] text-muted-foreground">
                {isComplete ? 'Tudo concluído! 🎉' : `${globalCompleted} de ${globalTotal} tarefas`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xl font-black",
              isComplete ? "text-success" : globalPercent > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {globalPercent}%
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Global progress bar */}
        <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              isComplete
                ? "bg-success"
                : globalPercent > 0
                  ? "bg-gradient-to-r from-primary to-primary/70"
                  : "bg-muted-foreground/20"
            )}
            style={{ width: `${globalPercent}%` }}
          />
        </div>

        {/* Sector list — compact like the checklist module */}
        {sectorData.length > 0 && (
          <div className="space-y-2 pt-1">
            {sectorData.map((sector) => {
              const sectorComplete = sector.percent === 100;
              return (
                <div key={sector.id} className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                      sectorComplete ? "bg-success/20" : ""
                    )}
                    style={{ backgroundColor: sectorComplete ? undefined : sector.color }}
                  >
                    {sectorComplete ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <AppIcon name={(iconMap[sector.icon] || 'Folder') as any} size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-xs font-medium truncate",
                        sectorComplete ? "text-success" : "text-foreground"
                      )}>
                        {sector.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                        {sector.completed}/{sector.total}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          sectorComplete ? "bg-success" : "bg-primary"
                        )}
                        style={{ width: `${sector.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}
