import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinanceChartWidget } from './FinanceChartWidget';
import { PersonalFinanceChartWidget } from './PersonalFinanceChartWidget';
import { usePersonalFinanceStats } from '@/hooks/usePersonalFinanceStats';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useLazyVisible } from '@/hooks/useLazyVisible';

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

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasAccess } = useUserModules();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { totalBalance: personalBalance, monthExpenses: personalExpenses, pendingExpenses: personalPending, isLoading: personalLoading } = usePersonalFinanceStats();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome */}
      <div className="animate-spring-in spring-stagger-1">
        <h2 className="text-xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* === FINANCE BLOCK (above fold) === */}
      <div className="space-y-4 animate-spring-in spring-stagger-2">
        {hasAccess('finance') ? (
          <>
            <button
              onClick={() => navigate('/finance')}
              className="finance-hero-card w-full text-left card-press"
            >
              <div className="finance-hero-inner p-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">Saldo da empresa</span>
                  <AppIcon name="ChevronRight" size={18} className="text-white/50" />
                </div>
                <p className={cn(
                  "text-[2rem] font-extrabold tracking-tight leading-tight",
                  stats.monthBalance >= 0 ? "text-white" : "text-red-300"
                )}>
                  {statsLoading ? <Skeleton className="h-9 w-40 bg-white/10" /> : formatCurrency(stats.monthBalance)}
                </p>
                {stats.pendingExpenses > 0 && (
                  <div className="flex gap-2 mt-3">
                    <div className="finance-hero-chip finance-hero-chip--neutral">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Pendências</span>
                      <span className="text-sm font-bold text-amber-300">{statsLoading ? '...' : formatCurrency(stats.pendingExpenses)}</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
            <FinanceChartWidget />
          </>
        ) : hasAccess('personal-finance') ? (
          <>
            <button
              onClick={() => navigate('/personal-finance')}
              className="finance-hero-card finance-hero-card--personal col-span-2 text-left card-press"
            >
              <div className="finance-hero-inner p-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">Meu saldo pessoal</span>
                  <AppIcon name="ChevronRight" size={18} className="text-white/50" />
                </div>
                <p className={cn(
                  "text-[2rem] font-extrabold tracking-tight leading-tight",
                  personalBalance >= 0 ? "text-white" : "text-red-300"
                )}>
                  {personalLoading ? <Skeleton className="h-9 w-40 bg-white/10" /> : formatCurrency(personalBalance)}
                </p>
                <div className="flex gap-2 mt-3">
                  <div className="finance-hero-chip finance-hero-chip--success">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Despesas do mês</span>
                    <span className="text-sm font-bold text-white">{personalLoading ? '...' : formatCurrency(personalExpenses)}</span>
                  </div>
                  {personalPending > 0 && (
                    <div className="finance-hero-chip finance-hero-chip--neutral">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Pendências</span>
                      <span className="text-sm font-bold text-amber-300">{formatCurrency(personalPending)}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
            <PersonalFinanceChartWidget />
          </>
        ) : null}
      </div>

      {/* === BELOW-FOLD WIDGETS (lazy on scroll) === */}

      {hasAccess('cash-closing') && (
        <LazySection>
          <LazyWeeklySummary />
        </LazySection>
      )}

      {hasAccess('checklists') && (
        <LazySection className="card-press min-w-0 overflow-hidden">
          <LazyChecklist />
        </LazySection>
      )}

      {hasAccess('agenda') && (
        <LazySection className="card-press min-w-0 overflow-hidden">
          <LazyCalendar />
        </LazySection>
      )}

      {hasAccess('agenda') && (
        <LazySection className="card-press min-w-0 overflow-hidden">
          <LazyAgenda />
        </LazySection>
      )}

      {hasAccess('rewards') && (stats.pendingRedemptions > 0) && (
        <div className="card-command-info p-4 animate-spring-in spring-stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <AppIcon name="Bell" size={16} className="text-primary" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ações pendentes</span>
          </div>
          <button
            onClick={() => navigate('/rewards')}
            className="flex items-center justify-between w-full py-1.5 hover:bg-muted/30 rounded-lg px-2 transition-colors"
          >
            <span className="text-xs text-foreground">Resgates aguardando</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{stats.pendingRedemptions}</span>
          </button>
        </div>
      )}

      {hasAccess('ranking') && (
        <LazySection>
          <LazyLeaderboard currentUserId={user?.id} />
        </LazySection>
      )}
    </div>
  );
}
