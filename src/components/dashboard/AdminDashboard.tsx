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
import { Skeleton } from '@/components/ui/skeleton';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyChecklist = lazy(() => import('./ChecklistDashboardWidget').then(m => ({ default: m.ChecklistDashboardWidget })));

const LazyWeeklySummary = lazy(() => import('./LazyWeeklySummaryWidget'));
const LazyAutoOrder = lazy(() => import('./AutoOrderWidget').then(m => ({ default: m.AutoOrderWidget })));
const LazyCashFlow = lazy(() => import('../finance/CashFlowProjection').then(m => ({ default: m.CashFlowProjection })));

function LazyWidget({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useLazyVisible('300px');
  return (
    <div ref={ref}>
      {visible ? (
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>{children}</Suspense>
      ) : (
        <Skeleton className="h-32 w-full rounded-2xl" />
      )}
    </div>
  );
}


export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { widgets, setWidgets, resetDefaults } = useDashboardWidgets();
  const [managerOpen, setManagerOpen] = useState(false);

  const isReady = !statsLoading && !modulesLoading && !!profile;

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  if (!isReady) {
    return (
      <div className="px-4 py-3 lg:px-6">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  let staggerIndex = 0;
  const nextStagger = () => `dash-stagger-${++staggerIndex}`;

  // Categorize widgets into full-width vs grid-able
  const renderWidget = (widget: typeof widgets[number], stagger: string) => {
    if (!widget.visible) return null;

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
        return hasAccess('checklists') ? (
          <DashboardSection key={widget.key} onNavigate={() => navigate('/checklists')} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyChecklist /></LazyWidget>
          </DashboardSection>
        ) : null;

      case 'bills-due':
        return hasAccess('finance') && (stats.billsDueSoon?.length ?? 0) > 0 ? (
          <div key={widget.key} className={`animate-card-reveal ${stagger}`}>
            <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>
              <BillsDueWidget bills={stats.billsDueSoon || []} onNavigate={() => navigate('/finance')} />
            </Suspense>
          </div>
        ) : null;

      case 'calendar':
        return hasAccess('agenda') ? (
          <DashboardSection key={widget.key} onNavigate={() => navigate('/calendar')} className={`animate-card-reveal ${stagger}`}>
            <LazyWidget><LazyCalendar /></LazyWidget>
          </DashboardSection>
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
            <LazyWidget><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
          </DashboardSection>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-3 lg:px-8 lg:py-6 max-w-[1400px] mx-auto">

      {/* Upgrade Banner for free users */}
      <UpgradeBanner />

      {/* Setup Onboarding — full width */}
      <SetupChecklistWidget />

      {/* Smart Scanner — full width */}
      <div className="mt-4">
        <SmartScannerWidget />
      </div>

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
    </div>
  );
}
