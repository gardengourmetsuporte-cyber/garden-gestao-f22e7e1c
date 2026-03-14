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

// Deterministic sparkline data per key
const SPARKLINES: Record<string, number[]> = {
  criticalItems: [8, 12, 7, 15, 10, 6, 9],
  pendingOrders: [2, 5, 3, 7, 4, 6, 3],
  pendingClosings: [1, 0, 2, 1, 3, 1, 2],
  pendingRedemptions: [0, 2, 1, 3, 2, 4, 1],
  pendingQuotations: [1, 3, 2, 4, 1, 5, 2],
  checklist: [30, 50, 65, 45, 80, 70, 90],
};

function Sparkline({ points, color, className }: { points: number[]; color: string; className?: string }) {
  const max = Math.max(...points, 1);
  const w = 48;
  const h = 20;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - (p / max) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className}>
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

const items = [
  { key: 'criticalItems', title: 'itens críticos', icon: 'AlertTriangle', route: '/inventory' },
  { key: 'pendingOrders', title: 'pedidos', icon: 'ShoppingCart', route: '/orders' },
  { key: 'pendingClosings', title: 'fechamentos', icon: 'FileText', route: '/cash-closing' },
  { key: 'pendingRedemptions', title: 'resgates', icon: 'Gift', route: '/rewards' },
  { key: 'pendingQuotations', title: 'cotações', icon: 'Scale', route: '/orders' },
] as const;

function getSmartColor(key: string, value: number) {
  if (value === 0) return { bg: 'bg-secondary/50', icon: 'text-muted-foreground', value: 'text-muted-foreground/60', iconBg: 'bg-muted/30', sparkline: 'hsl(var(--muted-foreground))' };

  switch (key) {
    case 'criticalItems':
      if (value >= 50) return { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15', sparkline: 'hsl(var(--destructive))' };
      if (value >= 20) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15', sparkline: 'hsl(var(--warning))' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' };
    case 'pendingOrders':
      if (value >= 10) return { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15', sparkline: 'hsl(var(--destructive))' };
      if (value >= 3) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15', sparkline: 'hsl(var(--warning))' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' };
    case 'pendingClosings':
      if (value >= 3) return { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15', sparkline: 'hsl(var(--destructive))' };
      if (value >= 1) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15', sparkline: 'hsl(var(--warning))' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' };
    case 'pendingRedemptions':
      if (value >= 5) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15', sparkline: 'hsl(var(--warning))' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' };
    case 'pendingQuotations':
      if (value >= 5) return { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15', sparkline: 'hsl(var(--warning))' };
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' };
    default:
      return { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' };
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
    <div className="grid grid-cols-3 gap-2 lg:grid-cols-3">
      {allCards.map((card, i) => {
        const checklistColor = card.isChecklist
          ? checklistProgress.percent === 100
            ? { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' }
            : checklistProgress.percent >= 70
              ? { bg: 'bg-secondary/50', icon: 'text-primary', value: 'text-foreground', iconBg: 'bg-primary/15', sparkline: 'hsl(var(--primary))' }
              : checklistProgress.percent >= 40
                ? { bg: 'bg-secondary/50', icon: 'text-warning', value: 'text-warning', iconBg: 'bg-warning/15', sparkline: 'hsl(var(--warning))' }
                : { bg: 'bg-secondary/50', icon: 'text-destructive', value: 'text-destructive', iconBg: 'bg-destructive/15', sparkline: 'hsl(var(--destructive))' }
          : null;

        const colors = checklistColor || getSmartColor(card.key, card.value);
        const sparkPoints = SPARKLINES[card.key] || [1, 2, 3, 2, 1];

        return (
          <button
            key={card.key}
            onClick={() => navigate(card.route)}
            className={cn(
              "flex flex-col justify-between rounded-[20px] p-3 transition-all duration-200 min-h-[90px]",
              colors.bg,
              "hover:bg-secondary/70",
              "active:scale-[0.97] touch-manipulation",
              "animate-card-reveal",
              `dash-stagger-${i + 1}`,
            )}
          >
            {/* Top: title */}
            <p className="text-[10px] text-muted-foreground leading-tight truncate capitalize">
              {card.isChecklist
                ? (activeType === 'abertura' ? 'abertura' : 'fechamento')
                : card.title}
            </p>

            {/* Bottom: icon + value left, sparkline right */}
            <div className="flex items-end justify-between mt-auto">
              <div className="flex items-center gap-1.5">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", colors.iconBg)}>
                  <AppIcon name={card.icon} size={14} className={colors.icon} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-lg font-extrabold leading-none tabular-nums tracking-tight", colors.value)}>
                    {card.isChecklist ? `${card.value}%` : <AnimatedValue value={card.value} />}
                  </p>
                  {card.isChecklist && (
                    <p className="text-[9px] text-muted-foreground tabular-nums leading-tight">
                      {card.checklistProgress.completed}/{card.checklistProgress.total}
                    </p>
                  )}
                </div>
              </div>
              <Sparkline points={sparkPoints} color={colors.sparkline} className="shrink-0 opacity-60" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
