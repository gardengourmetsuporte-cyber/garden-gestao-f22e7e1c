import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinanceChartWidget } from './FinanceChartWidget';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useLazyVisible } from '@/hooks/useLazyVisible';
import { SetupChecklistWidget } from './SetupChecklistWidget';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { DashboardWidgetManager } from './DashboardWidgetManager';

// Lazy-load heavy below-fold widgets
const LazyLeaderboard = lazy(() => import('./LazyLeaderboardWidget'));
const LazyCalendar = lazy(() => import('./UnifiedCalendarWidget').then(m => ({ default: m.UnifiedCalendarWidget })));
const LazyChecklist = lazy(() => import('./ChecklistDashboardWidget').then(m => ({ default: m.ChecklistDashboardWidget })));
const LazyAgenda = lazy(() => import('./AgendaDashboardWidget').then(m => ({ default: m.AgendaDashboardWidget })));
const LazyWeeklySummary = lazy(() => import('./LazyWeeklySummaryWidget'));

function WidgetSkeleton() {
  return <Skeleton className="h-32 w-full rounded-2xl" />;
}

function LazySection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useLazyVisible('300px');
  return (
    <div ref={ref} className={className}>
      {visible ? (
        <Suspense fallback={<WidgetSkeleton />}>{children}</Suspense>
      ) : (
        <WidgetSkeleton />
      )}
    </div>
  );
}

// Widget renderer map
const WIDGET_RENDERERS: Record<string, (ctx: WidgetContext) => React.ReactNode | null> = {
  'finance': ({ hasAccess, stats, statsLoading, formatCurrency, navigate }) => {
    if (!hasAccess('finance')) return null;
    return (
      <div className="space-y-7 animate-spring-in spring-stagger-2">
        <button onClick={() => navigate('/finance')} className="finance-hero-card w-full text-left card-press">
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
      </div>
    );
  },
  'finance-chart': ({ hasAccess }) => {
    if (!hasAccess('finance')) return null;
    return <FinanceChartWidget />;
  },
  'weekly-summary': ({ hasAccess }) => {
    if (!hasAccess('cash-closing')) return null;
    return <LazySection><LazyWeeklySummary /></LazySection>;
  },
  'checklist': ({ hasAccess }) => {
    if (!hasAccess('checklists')) return null;
    return <LazySection className="card-press min-w-0 overflow-hidden"><LazyChecklist /></LazySection>;
  },
  'calendar': ({ hasAccess }) => {
    if (!hasAccess('agenda')) return null;
    return <LazySection className="card-press min-w-0 overflow-hidden"><LazyCalendar /></LazySection>;
  },
  'agenda': ({ hasAccess }) => {
    if (!hasAccess('agenda')) return null;
    return <LazySection className="card-press min-w-0 overflow-hidden"><LazyAgenda /></LazySection>;
  },
  'pending-actions': ({ hasAccess, stats, navigate }) => {
    if (!hasAccess('rewards') || stats.pendingRedemptions <= 0) return null;
    return (
      <div className="card-command-info p-4 animate-spring-in spring-stagger-4">
        <div className="flex items-center gap-2 mb-2">
          <AppIcon name="Bell" size={16} className="text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ações pendentes</span>
        </div>
        <button onClick={() => navigate('/rewards')} className="flex items-center justify-between w-full py-1.5 hover:bg-muted/30 rounded-lg px-2 transition-colors">
          <span className="text-xs text-foreground">Resgates aguardando</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{stats.pendingRedemptions}</span>
        </button>
      </div>
    );
  },
  'leaderboard': ({ hasAccess, userId }) => {
    if (!hasAccess('ranking')) return null;
    return <LazySection><LazyLeaderboard currentUserId={userId} /></LazySection>;
  },
};

interface WidgetContext {
  hasAccess: (m: string) => boolean;
  stats: any;
  statsLoading: boolean;
  formatCurrency: (v: number) => string;
  navigate: (p: string) => void;
  userId?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasAccess } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { widgets, setWidgets, resetDefaults, isVisible } = useDashboardWidgets();
  const [managerOpen, setManagerOpen] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  const ctx: WidgetContext = { hasAccess, stats, statsLoading, formatCurrency, navigate, userId: user?.id };

  return (
    <div className="space-y-7 px-4 py-3 lg:px-6">
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

      {/* Dynamic widgets */}
      {widgets.map(w => {
        if (!w.visible) return null;
        const renderer = WIDGET_RENDERERS[w.key];
        if (!renderer) return null;
        const node = renderer(ctx);
        if (!node) return null;
        return <div key={w.key}>{node}</div>;
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
