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
import { DashboardSection } from './DashboardSection';


const BillsDueWidget = lazy(() => import('./BillsDueWidget').then(m => ({ default: m.BillsDueWidget })));

import { UpgradeBanner } from './UpgradeBanner';
import { AppIcon } from '@/components/ui/app-icon';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { QuickStatsSkeleton, LeaderboardSkeleton, CalendarSkeleton, GenericWidgetSkeleton } from '@/components/ui/widget-skeleton';
import { cn } from '@/lib/utils';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyWeeklySummary = lazy(() => import('./LazyWeeklySummaryWidget'));
const LazyQuickStats = lazy(() => import('./QuickStatsWidget').then(m => ({ default: m.QuickStatsWidget })));
const LazyAnalytics = lazy(() => import('./AnalyticsWidget'));
const LazyHeatmap = lazy(() => import('./SalesHeatmapWidget'));
const LazyMonthComparison = lazy(() => import('./MonthComparisonWidget'));
const LazyBreakEven = lazy(() => import('./BreakEvenWidget'));
const LazyMultiUnit = lazy(() => import('./MultiUnitOverview'));
import { SalesGoalWidget } from './SalesGoalWidget';
import { TeamDashboardView } from './TeamDashboardView';
import { ServiceDashboardView } from './ServiceDashboardView';
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

type DashboardView = 'operational' | 'financial' | 'service' | 'team';

const OPERATIONAL_WIDGETS = new Set(['checklist', 'quick-stats', 'calendar', 'multi-unit']);
const FINANCIAL_WIDGETS = new Set(['finance', 'bills-due', 'analytics', 'heatmap', 'month-comparison', 'break-even', 'weekly-summary']);
const TEAM_ONLY_WIDGETS = new Set(['leaderboard']);

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-0.5">
      {title}
    </h3>
  );
}

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

    if (view === 'team' || view === 'service') return null;
    if (view === 'operational' && (FINANCIAL_WIDGETS.has(widget.key) || TEAM_ONLY_WIDGETS.has(widget.key))) return null;
    if (view === 'financial' && (OPERATIONAL_WIDGETS.has(widget.key) || TEAM_ONLY_WIDGETS.has(widget.key))) return null;

    switch (widget.key) {
      case 'finance':
      case 'checklist':
      case 'quick-stats':
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
    <div className="px-4 py-5 lg:px-8 lg:py-6 max-w-[1400px] mx-auto flex flex-col gap-5">


      {/* Greeting + Refresh */}
      <DashboardContextBar firstName={firstName} stats={stats} />

      {/* View Selector */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { key: 'operational' as const, icon: 'LayoutGrid', label: 'Operacional' },
          { key: 'financial' as const, icon: 'Landmark', label: 'Financeiro' },
          { key: 'service' as const, icon: 'Store', label: 'Serviço' },
          { key: 'team' as const, icon: 'Users', label: 'Equipe' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => handleViewChange(tab.key)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-300 touch-manipulation border",
              view === tab.key
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 border-primary/50 scale-[1.03]"
                : "bg-card/80 text-muted-foreground hover:text-foreground hover:bg-card hover:scale-[1.02] border-border/40 active:scale-[0.95]"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
              view === tab.key
                ? "bg-primary-foreground/20 rotate-0"
                : "bg-muted/60"
            )}>
              <AppIcon name={tab.icon} size={16} className="shrink-0" />
            </div>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>


      {/* Quick Stats — operational only */}
      {view === 'operational' && (
        <Suspense fallback={<QuickStatsSkeleton />}>
          <LazyQuickStats />
        </Suspense>
      )}

      {/* Upgrade Banner — operational only */}
      {view === 'operational' && <UpgradeBanner />}

      {/* Setup Onboarding — operational only */}
      {view === 'operational' && <SetupChecklistWidget />}

      {/* Finance Hero — financial */}
      {view === 'financial' && hasAccess('finance') && (
        <DashboardHeroFinance
          balance={stats.monthBalance}
          pendingExpenses={stats.pendingExpenses}
          isLoading={statsLoading}
        />
      )}

      {/* Sales Goal — financial */}
      {view === 'financial' && <SalesGoalWidget />}

      {/* Service View */}
      {view === 'service' && <ServiceDashboardView />}

      {/* Team View */}
      {view === 'team' && <TeamDashboardView currentUserId={user?.id} />}

      {/* Widgets Grid */}
      {view !== 'team' && view !== 'service' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {widgets.map((widget) => {
              const stagger = nextStagger();
              return renderWidget(widget, stagger);
            })}
          </div>
      )}

      {/* Manage button */}
      <button
        onClick={() => setManagerOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-manipulation"
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
        currentView={view}
      />

      <GuidedTour />
    </div>
  );
}
