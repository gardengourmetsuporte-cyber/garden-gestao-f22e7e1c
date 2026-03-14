import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useQuotations } from '@/hooks/useQuotations';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { getCurrentChecklistType, getTodayDateStr } from '@/lib/checklistTiming';
import { useChecklistDeadlines } from '@/hooks/useChecklistDeadlines';

import statAlert from '@/assets/icons/stat-alert.png';
import statOrders from '@/assets/icons/stat-orders.png';
import statReceipt from '@/assets/icons/stat-receipt.png';
import statGift from '@/assets/icons/stat-gift.png';
import statScale from '@/assets/icons/stat-scale.png';
import statChecklist from '@/assets/icons/stat-checklist.png';
import statBag from '@/assets/icons/stat-bag.png';

function AnimatedValue({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

const STAT_ICONS: Record<string, string> = {
  criticalItems: statAlert,
  pendingOrders: statOrders,
  pendingClosings: statReceipt,
  pendingRedemptions: statGift,
  pendingQuotations: statScale,
  checklist: statChecklist,
};

const items = [
  { key: 'criticalItems', title: 'itens críticos', route: '/inventory' },
  { key: 'pendingOrders', title: 'pedidos', route: '/orders' },
  { key: 'pendingClosings', title: 'fechamentos', route: '/cash-closing' },
  { key: 'pendingRedemptions', title: 'resgates', route: '/rewards' },
  { key: 'pendingQuotations', title: 'cotações', route: '/orders' },
] as const;

function getSmartColor(key: string, value: number) {
  if (value === 0) return { bg: 'bg-secondary/50', icon: 'text-muted-foreground', value: 'text-muted-foreground/60', iconBg: 'bg-muted/30' };

  switch (key) {
    case 'criticalItems':
      if (value >= 50) return { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15' };
      if (value >= 20) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' };
    case 'pendingOrders':
      if (value >= 10) return { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15' };
      if (value >= 3) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' };
    case 'pendingClosings':
      if (value >= 3) return { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15' };
      if (value >= 1) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' };
    case 'pendingRedemptions':
      if (value >= 5) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' };
    case 'pendingQuotations':
      if (value >= 5) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' };
    default:
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' };
  }
}

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
      return { ...item, value, isChecklist: false, checklistProgress: null as any };
    }),
    {
      key: 'checklist',
      title: activeType === 'abertura' ? 'abertura' : 'fechamento',
      icon: 'ClipboardCheck',
      route: '/checklists',
      value: checklistProgress.percent,
      isChecklist: true,
      checklistProgress,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
      {allCards.map((card, i) => {
        const checklistColor = card.isChecklist
          ? checklistProgress.percent === 100
            ? { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' }
            : checklistProgress.percent >= 70
              ? { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15' }
              : checklistProgress.percent >= 40
                ? { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15' }
                : { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15' }
          : null;

        const colors = checklistColor || getSmartColor(card.key, card.value);

        return (
          <button
            key={card.key}
            onClick={() => navigate(card.route)}
            className={cn(
              "flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-200",
              colors.bg,
              "hover:bg-secondary/70",
              "active:scale-[0.97] touch-manipulation",
              "animate-card-reveal",
              `dash-stagger-${i + 1}`,
            )}
          >
             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colors.iconBg)}>
              <AppIcon name={card.icon} size={17} className={colors.icon} />
            </div>
            <div className="text-left min-w-0">
              <p className={cn("text-xl font-extrabold leading-none tabular-nums tracking-tight", colors.value)}>
                {card.isChecklist ? `${card.value}%` : <AnimatedValue value={card.value} />}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                {card.isChecklist
                  ? `${card.checklistProgress.completed}/${card.checklistProgress.total}`
                  : card.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
