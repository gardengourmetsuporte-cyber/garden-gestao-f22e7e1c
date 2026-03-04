import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { DashboardWidgetManager } from './DashboardWidgetManager';
import { SetupChecklistWidget } from './SetupChecklistWidget';
import { DashboardHeroFinance } from './DashboardHeroFinance';
import { DashboardKPIGrid } from './DashboardKPIGrid';
import { DashboardSection } from './DashboardSection';
import { FinanceChartWidget } from './FinanceChartWidget';
import { BillsDueWidget } from './BillsDueWidget';
import { AIInsightsWidget } from './AIInsightsWidget';
import { PendingOrdersWidget } from './PendingOrdersWidget';
import { AppIcon } from '@/components/ui/app-icon';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyChecklist = lazy(() => import('./ChecklistDashboardWidget').then(m => ({ default: m.ChecklistDashboardWidget })));
const LazyAgenda = lazy(() => import('./AgendaDashboardWidget').then(m => ({ default: m.AgendaDashboardWidget })));
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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  if (!isReady) {
    return (
      <div className="px-4 py-3 lg:px-6">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-3 lg:px-6">
      {/* Welcome */}
      <div className="animate-spring-in spring-stagger-1">
        <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Setup Onboarding */}
      <SetupChecklistWidget />

      {/* Hero Finance */}
      {false && (
        <DashboardHeroFinance
          balance={stats.monthBalance}
          pendingExpenses={stats.pendingExpenses}
          isLoading={statsLoading}
        />
      )}

      {widgets.map((widget) => {
        if (!widget.visible) return null;

        switch (widget.key) {
          case 'finance':
            return hasAccess('finance') ? (
              <DashboardHeroFinance
                key={widget.key}
                balance={stats.monthBalance}
                pendingExpenses={stats.pendingExpenses}
                isLoading={statsLoading}
              />
            ) : null;

          case 'checklist':
            return hasAccess('checklists') ? (
              <DashboardSection key={widget.key} title="Checklists" icon="CheckSquare" iconColor="text-green-400" onNavigate={() => navigate('/checklists')}>
                <LazyWidget><LazyChecklist /></LazyWidget>
              </DashboardSection>
            ) : null;

          case 'finance-chart':
            return hasAccess('finance') ? (
              <DashboardSection key={widget.key} title="Despesas do mês" icon="BarChart3" iconColor="text-emerald-400" onNavigate={() => navigate('/finance')}>
                <FinanceChartWidget />
              </DashboardSection>
            ) : null;

          case 'bills-due':
            return hasAccess('finance') && (stats.billsDueSoon?.length ?? 0) > 0 ? (
              <DashboardSection key={widget.key} title="Contas a vencer" icon="AlertTriangle" iconColor="text-amber-400" onNavigate={() => navigate('/finance')}>
                <BillsDueWidget bills={stats.billsDueSoon || []} />
              </DashboardSection>
            ) : null;

          case 'calendar':
            return hasAccess('agenda') ? (
              <DashboardSection key={widget.key} title="Calendário" icon="CalendarDays" iconColor="text-indigo-400" onNavigate={() => navigate('/calendar')}>
                <LazyWidget><LazyCalendar /></LazyWidget>
              </DashboardSection>
            ) : null;

          case 'agenda':
            return hasAccess('agenda') ? (
              <DashboardSection key={widget.key} title="Agenda" icon="ListTodo" iconColor="text-violet-400" onNavigate={() => navigate('/agenda')}>
                <LazyWidget><LazyAgenda /></LazyWidget>
              </DashboardSection>
            ) : null;

          case 'weekly-summary':
            return hasAccess('cash-closing') ? (
              <DashboardSection key={widget.key} title="Resumo semanal" icon="Calendar" iconColor="text-blue-400" onNavigate={() => navigate('/cash-closing')}>
                <LazyWidget><LazyWeeklySummary /></LazyWidget>
              </DashboardSection>
            ) : null;

          case 'leaderboard':
            return hasAccess('ranking') ? (
              <DashboardSection key={widget.key} title="Ranking" icon="Trophy" iconColor="text-yellow-400" onNavigate={() => navigate('/ranking')}>
                <LazyWidget><LazyLeaderboard currentUserId={user?.id} /></LazyWidget>
              </DashboardSection>
            ) : null;

          default:
            return null;
        }
      })}
      {/* Manage button */}
      <button
        onClick={() => setManagerOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
