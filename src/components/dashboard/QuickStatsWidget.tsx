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
  { key: 'criticalItems', title: 'itens críticos', icon: 'AlertTriangle', iconBg: 'bg-warning/15', iconColor: 'text-warning', route: '/inventory' },
  { key: 'pendingOrders', title: 'pedidos', icon: 'ShoppingCart', iconBg: 'bg-primary/15', iconColor: 'text-primary', route: '/orders' },
  { key: 'pendingClosings', title: 'fechamentos', icon: 'FileText', iconBg: 'bg-destructive/15', iconColor: 'text-destructive', route: '/cash-closing' },
  { key: 'pendingRedemptions', title: 'resgates', icon: 'Gift', iconBg: 'bg-success/15', iconColor: 'text-success', route: '/rewards' },
  { key: 'pendingQuotations', title: 'cotações', icon: 'Scale', iconBg: 'bg-primary/15', iconColor: 'text-primary', route: '/orders' },
] as const;

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
      return { ...item, value, isChecklist: false };
    }),
    {
      key: 'checklist',
      title: activeType === 'abertura' ? 'abertura' : 'fechamento',
      icon: 'checklist',
      iconBg: checklistProgress.percent === 100 ? 'bg-success/15' : 'bg-primary/15',
      iconColor: checklistProgress.percent === 100 ? 'text-success' : 'text-primary',
      route: '/checklists',
      value: checklistProgress.percent,
      isChecklist: true,
      checklistProgress,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
      {allCards.map((card, i) => (
        <button
          key={card.key}
          onClick={() => navigate(card.route)}
          className={cn(
            "flex flex-col items-start gap-3 rounded-2xl p-3.5 pb-4 transition-all duration-200",
            "bg-card border border-border/40 hover:border-border/60",
            "active:scale-[0.96] touch-manipulation",
            "animate-card-reveal",
            `dash-stagger-${i + 1}`,
          )}
        >
          <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", card.iconBg)}>
            <AppIcon name={card.icon} size={18} className={card.iconColor} />
          </div>
          <div className="text-left min-w-0 w-full">
            <p className="text-2xl font-extrabold leading-none tabular-nums tracking-tight">
              {card.isChecklist ? `${card.value}%` : <AnimatedValue value={card.value} />}
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-1 truncate">
              {card.isChecklist
                ? `${(card as any).checklistProgress.completed}/${(card as any).checklistProgress.total}`
                : card.title}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
