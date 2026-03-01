import { useState, useCallback, lazy, Suspense } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardWidgets, DashboardWidget } from '@/hooks/useDashboardWidgets';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { FinanceChartWidget } from './FinanceChartWidget';
import { PendingOrdersWidget } from './PendingOrdersWidget';
import { AIInsightsWidget } from './AIInsightsWidget';
import { BillsDueWidget } from './BillsDueWidget';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyChecklist = lazy(() => import('./ChecklistDashboardWidget').then(m => ({ default: m.ChecklistDashboardWidget })));
const LazyAgenda = lazy(() => import('./AgendaDashboardWidget').then(m => ({ default: m.AgendaDashboardWidget })));
const LazyWeeklySummary = lazy(() => import('./LazyWeeklySummaryWidget'));
const LazyAutoOrder = lazy(() => import('./AutoOrderWidget').then(m => ({ default: m.AutoOrderWidget })));
const LazyCashFlow = lazy(() => import('../finance/CashFlowProjection').then(m => ({ default: m.CashFlowProjection })));

function WidgetSkeleton() {
  return <Skeleton className="h-32 w-full rounded-2xl" />;
}

function LazySection({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useLazyVisible('300px');
  return (
    <div ref={ref}>
      {visible ? (
        <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
      ) : (
        <WidgetSkeleton />
      )}
    </div>
  );
}

// Icon color map for themed accordion headers
const ICON_COLORS: Record<string, string> = {
  'finance': 'text-emerald-400',
  'finance-chart': 'text-emerald-400',
  'bills-due': 'text-amber-400',
  'weekly-summary': 'text-blue-400',
  'pending-orders': 'text-orange-400',
  'auto-order': 'text-cyan-400',
  'checklist': 'text-green-400',
  'calendar': 'text-indigo-400',
  'agenda': 'text-violet-400',
  'pending-actions': 'text-rose-400',
  'leaderboard': 'text-yellow-400',
  'ai-insights': 'text-purple-400',
  'cash-flow': 'text-teal-400',
};

const OPEN_STORAGE_KEY = 'dashboard-accordion-open';

function loadOpenState(widgets: DashboardWidget[]): string[] {
  try {
    const raw = localStorage.getItem(OPEN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return widgets.filter(w => w.defaultOpen).map(w => w.key);
}

interface WidgetContext {
  hasAccess: (m: string) => boolean;
  stats: any;
  statsLoading: boolean;
  navigate: (p: string) => void;
  userId?: string;
}

// Summary data shown inline in the accordion trigger
function getWidgetSummary(key: string, ctx: WidgetContext): string | null {
  const { stats, statsLoading } = ctx;
  if (statsLoading) return '...';
  switch (key) {
    case 'finance': return formatCurrency(stats.monthBalance);
    case 'bills-due': {
      const count = stats.billsDueSoon?.length ?? 0;
      return count > 0 ? `${count}` : '0';
    }
    case 'pending-orders': return stats.pendingOrders > 0 ? `${stats.pendingOrders}` : '0';
    case 'pending-actions': return stats.pendingRedemptions > 0 ? `${stats.pendingRedemptions}` : '0';
    default: return null;
  }
}

// Content renderers (extracted from AdminDashboard)
function renderWidgetContent(key: string, ctx: WidgetContext): React.ReactNode | null {
  const { hasAccess, stats, statsLoading, navigate, userId } = ctx;

  switch (key) {
    case 'ai-insights': return <AIInsightsWidget />;
    case 'finance':
      if (!hasAccess('finance')) return null;
      return (
        <button onClick={() => navigate('/finance')} className="finance-hero-card w-full text-left">
          <div className="finance-hero-inner p-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--gp-label)' }}>Saldo da empresa</span>
              <AppIcon name="ChevronRight" size={18} style={{ color: 'var(--gp-icon)' }} />
            </div>
            <p className="text-[2rem] font-extrabold tracking-tight leading-tight" style={{ color: stats.monthBalance >= 0 ? 'var(--gp-value)' : 'var(--gp-negative)' }}>
              {statsLoading ? <Skeleton className="h-9 w-40 bg-white/10" /> : formatCurrency(stats.monthBalance)}
            </p>
            {stats.pendingExpenses > 0 && (
              <div className="flex gap-2 mt-3">
                <div className="rounded-lg px-3 py-1.5" style={{ background: 'hsl(38 92% 50% / 0.1)', border: '1px solid hsl(38 92% 50% / 0.2)' }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gp-sublabel)' }}>Pendências</span>
                  <span className="text-sm font-bold ml-2" style={{ color: 'hsl(38 80% 55%)' }}>{statsLoading ? '...' : formatCurrency(stats.pendingExpenses)}</span>
                </div>
              </div>
            )}
          </div>
        </button>
      );
    case 'finance-chart':
      if (!hasAccess('finance')) return null;
      return <FinanceChartWidget />;
    case 'bills-due':
      if (!hasAccess('finance')) return null;
      return <BillsDueWidget bills={stats.billsDueSoon || []} />;
    case 'weekly-summary':
      if (!hasAccess('cash-closing')) return null;
      return <LazySection><LazyWeeklySummary /></LazySection>;
    case 'checklist':
      if (!hasAccess('checklists')) return null;
      return <LazySection><LazyChecklist /></LazySection>;
    case 'calendar':
      if (!hasAccess('agenda')) return null;
      return <LazySection><LazyCalendar /></LazySection>;
    case 'agenda':
      if (!hasAccess('agenda')) return null;
      return <LazySection><LazyAgenda /></LazySection>;
    case 'pending-orders':
      if (!hasAccess('orders')) return null;
      return <PendingOrdersWidget />;
    case 'auto-order':
      if (!hasAccess('inventory')) return null;
      return <LazySection><LazyAutoOrder /></LazySection>;
    case 'pending-actions':
      if (!hasAccess('rewards')) return null;
      return (
        <button onClick={() => navigate('/rewards')} className="flex items-center justify-between w-full py-1.5 hover:bg-muted/30 rounded-lg px-2 transition-colors">
          <span className="text-xs text-foreground">{stats.pendingRedemptions > 0 ? 'Resgates aguardando' : 'Nenhuma ação pendente'}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{stats.pendingRedemptions}</span>
        </button>
      );
    case 'leaderboard':
      if (!hasAccess('ranking')) return null;
      return <LazySection><LazyLeaderboard currentUserId={userId} /></LazySection>;
    case 'cash-flow':
      if (!hasAccess('finance')) return null;
      return <LazySection><LazyCashFlow totalBalance={stats.monthBalance ?? 0} /></LazySection>;
    default:
      return null;
  }
}

interface DashboardAccordionProps {
  widgets: DashboardWidget[];
  ctx: WidgetContext;
}

export function DashboardAccordion({ widgets, ctx }: DashboardAccordionProps) {
  const visibleWidgets = widgets.filter(w => w.visible);
  const [openItems, setOpenItems] = useState<string[]>(() => loadOpenState(widgets));

  const handleValueChange = useCallback((value: string[]) => {
    setOpenItems(value);
    localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(value));
  }, []);

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={handleValueChange}
      className="dash-accordion space-y-2"
    >
      {visibleWidgets.map(w => {
        const content = renderWidgetContent(w.key, ctx);
        if (content === null) return null;
        const summary = getWidgetSummary(w.key, ctx);
        const iconColor = ICON_COLORS[w.key] || 'text-primary';

        return (
          <AccordionItem key={w.key} value={w.key} className="dash-accordion-item">
            <AccordionTrigger className="dash-accordion-trigger">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`dash-accordion-icon ${iconColor}`}>
                  <AppIcon name={w.icon} size={18} />
                </div>
                <span className="text-sm font-semibold text-foreground truncate">{w.label}</span>
              </div>
              {summary && (
                <span className="dash-accordion-badge">{summary}</span>
              )}
            </AccordionTrigger>
            <AccordionContent className="dash-accordion-content">
              <AccordionPrimitive.Trigger asChild>
                <button className="dash-accordion-miniheader w-full">
                  <div className={`dash-accordion-icon ${iconColor}`}>
                    <AppIcon name={w.icon} size={16} />
                  </div>
                  <span className="text-xs font-semibold text-foreground flex-1 text-left truncate">{w.label}</span>
                  {summary && <span className="dash-accordion-badge">{summary}</span>}
                  <AppIcon name="KeyboardArrowUp" size={18} className="text-muted-foreground" />
                </button>
              </AccordionPrimitive.Trigger>
              {content}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
