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

  const allCards = [
    ...items.map((item) => {
      const value = allStats[item.key as keyof typeof allStats] as number;
      const isActive = value > 0;
      const variant = isActive ? item.activeVariant : 'default';
      return { ...item, value, isActive, variant, isChecklist: false };
    }),
    {
      key: 'checklist',
      title: activeType === 'abertura' ? 'Abertura' : 'Fechamento',
      icon: 'checklist',
      route: '/checklists',
      value: checklistProgress.percent,
      isActive: checklistProgress.percent > 0,
      variant: checklistProgress.percent === 100 ? 'success' : checklistProgress.percent > 0 ? 'primary' : 'default',
      isChecklist: true,
      checklistProgress,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 lg:-mx-8 lg:px-8 snap-x snap-mandatory">
      {allCards.map((card) => (
        <button
          key={card.key}
          onClick={() => navigate(card.route)}
          className={cn(
            "flex items-center gap-2.5 shrink-0 snap-start rounded-xl px-3.5 py-2.5 transition-all duration-200 active:scale-[0.97]",
            "bg-card/70 border border-border/30",
          )}
        >
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", variantIcon[card.variant])}>
            <AppIcon name={card.icon} size={16} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-lg font-extrabold font-display leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {card.isChecklist ? `${card.value}%` : <AnimatedValue value={card.value} />}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {card.isChecklist
                ? `${(card as any).checklistProgress.completed}/${(card as any).checklistProgress.total} itens`
                : card.title.toLowerCase()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
