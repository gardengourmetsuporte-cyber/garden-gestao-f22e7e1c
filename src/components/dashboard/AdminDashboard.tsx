import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { DashboardWidgetManager } from './DashboardWidgetManager';
import { SetupChecklistWidget } from './SetupChecklistWidget';
import { DashboardContextBar } from './DashboardContextBar';
import { DashboardHeroFinance } from './DashboardHeroFinance';
import { DashboardKPIGrid } from './DashboardKPIGrid';
import { DashboardSection } from './DashboardSection';

const BillsDueWidget = lazy(() => import('./BillsDueWidget').then(m => ({ default: m.BillsDueWidget })));
const AIInsightsWidget = lazy(() => import('./AIInsightsWidget').then(m => ({ default: m.AIInsightsWidget })));
const PendingOrdersWidget = lazy(() => import('./PendingOrdersWidget').then(m => ({ default: m.PendingOrdersWidget })));
import { SmartScannerWidget } from './SmartScannerWidget';
import { UpgradeBanner } from './UpgradeBanner';
import { AppIcon } from '@/components/ui/app-icon';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { FinanceSkeleton, QuickStatsSkeleton, LeaderboardSkeleton, CalendarSkeleton, GenericWidgetSkeleton } from '@/components/ui/widget-skeleton';
import { cn } from '@/lib/utils';
import { cn } from '@/lib/utils';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyChecklist = lazy(() => import('./ChecklistDashboardWidget').then(m => ({ default: m.ChecklistDashboardWidget })));

const LazyWeeklySummary = lazy(() => import('./LazyWeeklySummaryWidget'));
const LazyAutoOrder = lazy(() => import('./AutoOrderWidget').then(m => ({ default: m.AutoOrderWidget })));
const LazyCashFlow = lazy(() => import('../finance/CashFlowProjection').then(m => ({ default: m.CashFlowProjection })));
const LazyQuickStats = lazy(() => import('./QuickStatsWidget').then(m => ({ default: m.QuickStatsWidget })));
const LazyAnalytics = lazy(() => import('./AnalyticsWidget'));
const LazyHeatmap = lazy(() => import('./SalesHeatmapWidget'));
const LazyMonthComparison = lazy(() => import('./MonthComparisonWidget'));
const LazyBreakEven = lazy(() => import('./BreakEvenWidget'));
const LazyMultiUnit = lazy(() => import('./MultiUnitOverview'));
import { SalesGoalWidget } from './SalesGoalWidget';
import { GuidedTour } from '@/components/onboarding/GuidedTour';

function LazyWidget({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { ref, visible } = useLazyVisible('300px');
  const skeleton = fallback || <GenericWidgetSkeleton />;
  return (
    <div ref={ref}>
      {visible ? (
        <Suspense fallback={skeleton}>{children}</Suspense>
      ) : (
        skeleton
      )}
    </div>
  );
}

type DashboardView = 'operational' | 'financial';

const OPERATIONAL_WIDGETS = new Set(['checklist', 'quick-stats', 'leaderboard', 'calendar', 'multi-unit']);
const FINANCIAL_WIDGETS = new Set(['finance', 'bills-due', 'analytics', 'heatmap', 'month-comparison', 'break-even', 'weekly-summary']);

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { widgets, setWidgets, resetDefaults } = useDashboardWidgets();
  const [managerOpen, setManagerOpen] = useState(false);
  const [view, setView] = useState<DashboardView>(() => {
    try {
      return (localStorage.getItem('dashboard-view') as DashboardView) || 'operational';
    } catch { return 'operational'; }
  });
  

  const isReady = !statsLoading && !modulesLoading && !!profile;
  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  const handleViewChange = (v: DashboardView) => {
    setView(v);
    try { localStorage.setItem('dashboard-view', v); } catch {}
  };

  if (!isReady) {
    return (
      <div className="px-4 py-3 lg:px-6">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  let staggerIndex = 0;
  const nextStagger = () => `dash-stagger-${++staggerIndex}`;

  const renderWidget = (widget: typeof widgets[number], stagger: string) => {
    if (!widget.visible) return null;

    // Filter by current view
    if (view === 'operational' && FINANCIAL_WIDGETS.has(widget.key)) return null;
    if (view === 'financial' && OPERATIONAL_WIDGETS.has(widget.key)) return null;

    switch (widget.key) {
      case 'finance':
        return hasAccess('finance') ? (
          <div key={widget.key} className={`lg:col-span-2 animate-card-reveal ${stagger}`}>
            <DashboardHeroFinance
              balance={stats.monthBalance}
              pendingExpenses={stats.pendingExpenses}
              isLoading={statsLoading}
            />
          </div>
        ) : null;

      case 'checklist':
        return null;

      case 'bills-due':
        return hasAccess('finance') && (stats.billsDueSoon?.length ?? 0) > 0 ? (
          <div key={widget.key} className={`animate-card-reveal ${stagger}`}>
            <Suspense fallback={<GenericWidgetSkeleton />}>
              <BillsDueWidget bills={stats.billsDueSoon || []} onNavigate={() => navigate('/finance')} />
            </Suspense>
          </div>
        ) : null;

      case 'calendar':
        return hasAccess('agenda') ? (
          <DashboardSection key={widget.key} onNavigate={() => navigate('/calendar')} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget fallback={<CalendarSkeleton />}><LazyCalendar /></LazyWidget>
          </DashboardSection>
        ) : null;

      case 'analytics':
        return hasAccess('cash-closing') ? (
          <div key={widget.key} className={`lg:col-span-2 animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyAnalytics /></LazyWidget>
          </div>
        ) : null;

      case 'weekly-summary':
        return hasAccess('cash-closing') ? (
          <DashboardSection key={widget.key} onNavigate={() => navigate('/cash-closing')} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyWeeklySummary /></LazyWidget>
          </DashboardSection>
        ) : null;

      case 'leaderboard':
        return hasAccess('ranking') ? (
          <DashboardSection key={widget.key} onNavigate={() => navigate('/ranking')} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget fallback={<LeaderboardSkeleton />}><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
          </DashboardSection>
        ) : null;

      case 'quick-stats':
        return null;

      case 'heatmap':
        return (
          <div key={widget.key} className={`lg:col-span-2 animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyHeatmap /></LazyWidget>
          </div>
        );

      case 'month-comparison':
        return (
          <div key={widget.key} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyMonthComparison /></LazyWidget>
          </div>
        );

      case 'break-even':
        return (
          <div key={widget.key} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyBreakEven /></LazyWidget>
          </div>
        );

      case 'multi-unit':
        return (
          <div key={widget.key} className={`lg:col-span-2 animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyMultiUnit /></LazyWidget>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-3 lg:px-8 lg:py-4 max-w-[1400px] mx-auto">

      {/* Pull to Refresh indicator */}
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} threshold={threshold} />

      {/* Greeting */}
      <DashboardContextBar firstName={firstName} stats={stats} />

      {/* View Selector */}
      <div className="mt-3 flex gap-1.5 p-1 rounded-xl bg-card/70 border border-border/30 w-fit">
        <button
          onClick={() => handleViewChange('operational')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            view === 'operational'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <AppIcon name="dashboard" size={14} />
          Operacional
        </button>
        <button
          onClick={() => handleViewChange('financial')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            view === 'financial'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <AppIcon name="account_balance" size={14} />
          Financeiro
        </button>
      </div>

      {/* Quick Stats — only on operational view */}
      {view === 'operational' && (
        <div className="mt-3">
          <Suspense fallback={<QuickStatsSkeleton />}>
            <LazyQuickStats />
          </Suspense>
        </div>
      )}

      {/* Upgrade Banner for free users */}
      <div className="mt-4">
        <UpgradeBanner />
      </div>

      {/* Setup Onboarding — full width, operational only */}
      {view === 'operational' && <SetupChecklistWidget />}

      {/* Sales Goal Widget — financial */}
      {view === 'financial' && (
        <div className="mt-4">
          <SalesGoalWidget />
        </div>
      )}

      {/* Smart Scanner — operational */}
      {view === 'operational' && (
        <div className="mt-4">
          <SmartScannerWidget />
        </div>
      )}

      {/* Widgets Grid — 2 columns on desktop */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {widgets.map((widget) => {
          const stagger = nextStagger();
          return renderWidget(widget, stagger);
        })}
      </div>

      {/* Manage button */}
      <button
        onClick={() => setManagerOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 mt-6 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <AppIcon name="Settings" size={16} />
        Gerenciar tela inicial
      </button>

      <DashboardWidgetManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        widgets={widgets}
        onSave={setWidgets}
        onReset={resetDefaults}
      />

      <GuidedTour />
    </div>
  );
}
