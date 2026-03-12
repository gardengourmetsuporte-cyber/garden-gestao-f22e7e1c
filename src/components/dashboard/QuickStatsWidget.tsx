import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useQuotations } from '@/hooks/useQuotations';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { getCurrentChecklistType, getTodayDateStr } from '@/lib/checklistTiming';
import { useChecklistDeadlines } from '@/hooks/useChecklistDeadlines';

function AnimatedValue({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

const items = [
  { key: 'criticalItems', title: 'Itens Críticos', icon: 'AlertTriangle', route: '/inventory', activeVariant: 'warning' },
  { key: 'pendingOrders', title: 'Pedidos', icon: 'ShoppingCart', route: '/orders', activeVariant: 'primary' },
  { key: 'pendingClosings', title: 'Fechamentos', icon: 'FileText', route: '/cash-closing', activeVariant: 'destructive' },
  { key: 'pendingRedemptions', title: 'Resgates', icon: 'Gift', route: '/rewards', activeVariant: 'success' },
  { key: 'pendingQuotations', title: 'Cotações', icon: 'Scale', route: '/orders', activeVariant: 'primary' },
] as const;

const variantIcon: Record<string, string> = {
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  destructive: 'bg-destructive/15 text-destructive',
  success: 'bg-success/15 text-success',
  default: 'bg-secondary text-secondary-foreground',
};

export function QuickStatsWidget() {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();
  const { quotations } = useQuotations();
  const { activeUnitId } = useUnit();
  const today = getTodayDateStr();
  const { settings: deadlineSettings } = useChecklistDeadlines();
  const activeType = getCurrentChecklistType(deadlineSettings);

  const pendingQuotations = quotations.filter(q => q.status !== 'resolved').length;

  const { data: sectors = [] } = useQuery({
    queryKey: ['qs-checklist-sectors', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('checklist_sectors')
        .select('*, subcategories:checklist_subcategories(*, items:checklist_items(*))')
        .eq('scope', 'standard')
        .order('sort_order');
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !isLoading,
    staleTime: 60000,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['qs-checklist-completions', today, activeType, activeUnitId],
    queryFn: async () => {
      let query = supabase.from('checklist_completions').select('item_id').eq('date', today).eq('checklist_type', activeType);
      if (activeUnitId) query = query.or(`unit_id.eq.${activeUnitId},unit_id.is.null`);
      const { data } = await query;
      return data || [];
    },
    enabled: !isLoading,
    staleTime: 30000,
  });

  const checklistProgress = useMemo(() => {
    const completedIds = new Set(completions.map((c: any) => c.item_id));
    let total = 0, completed = 0;
    sectors.forEach((s: any) => {
      s.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.is_active && item.checklist_type === activeType) {
            total++;
            if (completedIds.has(item.id)) completed++;
          }
        });
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [sectors, completions, activeType]);

  if (isLoading) return null;

  const allStats = { ...stats, pendingQuotations };

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const value = allStats[item.key as keyof typeof allStats] as number;
        const isActive = value > 0;
        const variant = isActive ? item.activeVariant : 'default';

        return (
          <button
            key={item.key}
            onClick={() => navigate(item.route)}
            className={cn(
              "card-stat-holo text-left transition-all duration-200 active:scale-[0.97]",
              isActive && "ring-1 ring-inset",
              isActive && variant === 'warning' && "ring-warning/20",
              isActive && variant === 'primary' && "ring-primary/20",
              isActive && variant === 'destructive' && "ring-destructive/20",
              isActive && variant === 'success' && "ring-success/20",
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("stat-holo-icon", variantIcon[variant])}>
                <AppIcon name={item.icon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{item.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>
                    <AnimatedValue value={value} />
                  </p>
                  {isActive && (
                    <span className={cn("text-[9px] font-bold uppercase tracking-wide", variantIcon[variant].split(' ')[1])}>
                      pendente{value !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50" />
            </div>
          </button>
        );
      })}

      {/* Checklist inline card */}
      <button
        onClick={() => navigate('/checklists')}
        className={cn(
          "card-stat-holo text-left transition-all duration-200 active:scale-[0.97]",
          checklistProgress.percent === 100 && "ring-1 ring-inset ring-success/20",
          checklistProgress.percent > 0 && checklistProgress.percent < 100 && "ring-1 ring-inset ring-primary/20",
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "stat-holo-icon",
            checklistProgress.percent === 100 ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
          )}>
            <AppIcon name="checklist" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {activeType === 'abertura' ? 'Abertura' : 'Fechamento'}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold font-display" style={{ letterSpacing: '-0.03em' }}>
                {checklistProgress.percent}%
              </p>
              <span className="text-[9px] font-bold text-muted-foreground/60">
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
            </div>
          </div>
          <AppIcon name="ChevronRight" size={14} className="text-muted-foreground/50" />
        </div>
      </button>
    </div>
  );
}
