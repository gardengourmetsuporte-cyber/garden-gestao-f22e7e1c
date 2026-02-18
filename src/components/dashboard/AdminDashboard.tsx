import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';
import { useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { FinanceChartWidget } from './FinanceChartWidget';
import { AICopilotWidget } from './AICopilotWidget';
import { AutoOrderWidget } from './AutoOrderWidget';
import { AgendaDashboardWidget } from './AgendaDashboardWidget';
import { WeeklySummary } from '@/components/cashClosing/WeeklySummary';
import { useCashClosing } from '@/hooks/useCashClosing';
import { ChecklistDashboardWidget } from './ChecklistDashboardWidget';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { earnedPoints, balance, isLoading: pointsLoading } = usePoints();
  const { closings } = useCashClosing();

  const animatedBalance = useCountUpCurrency(stats.monthBalance);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  // Leaderboard top 3
  const top3 = (leaderboard || []).slice(0, 3);
  const userRank = (leaderboard || []).find(e => e.user_id === user?.id);

  const nextMilestone = Math.ceil((earnedPoints + 1) / 50) * 50;
  const progress = earnedPoints > 0 ? ((earnedPoints % 50) / 50) * 100 : 0;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Welcome - minimal */}
      <div className="animate-slide-up stagger-1">
        <h2 className="text-xl font-bold text-foreground">
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-muted-foreground text-xs capitalize mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* === WIDGET GRID - iOS style mixed === */}
      <div className="grid grid-cols-2 gap-3">

        {/* === FINANCIAL BLOCK - grouped together === */}

        {/* FINANCE WIDGET - large (full width) */}
        <button
          onClick={() => navigate('/finance')}
          className="finance-hero-card col-span-2 text-left animate-slide-up stagger-2"
        >
          <div className="finance-hero-inner p-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">
                Saldo do mês
              </span>
              <AppIcon name="ChevronRight" size={18} className="text-white/50" />
            </div>
            <p className={cn(
              "text-[2rem] font-extrabold tracking-tight leading-tight",
              stats.monthBalance >= 0 ? "text-white" : "text-red-300"
            )}>
              {statsLoading ? <Skeleton className="h-9 w-40 bg-white/10" /> : formatCurrency(animatedBalance)}
            </p>
            <div className="flex gap-2 mt-3">
              <div className="finance-hero-chip finance-hero-chip--success">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Pendências</span>
                <span className={cn(
                  "text-sm font-bold",
                  stats.pendingExpenses > 0 ? "text-red-300" : "text-emerald-300"
                )}>
                  {statsLoading ? '...' : formatCurrency(stats.pendingExpenses)}
                </span>
              </div>
              {stats.pendingClosings > 0 && (
                <div className="finance-hero-chip finance-hero-chip--neutral">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Fechamentos</span>
                  <span className="text-sm font-bold text-amber-300">{stats.pendingClosings}</span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* FINANCE CHART + WEEKLY SUMMARY - side by side */}
        <FinanceChartWidget />

        {/* WEEKLY CASH SUMMARY */}
        <div className="animate-slide-up stagger-3">
          <WeeklySummary closings={closings} />
        </div>

        {/* === OPERATIONAL BLOCK === */}

        {/* CHECKLIST PROGRESS WIDGET */}
        <ChecklistDashboardWidget />

        {/* AI COPILOT WIDGET */}
        <AICopilotWidget />

        {/* ALERTS */}
        {(stats.pendingRedemptions > 0) && (
          <div className="card-command-info col-span-2 p-4 animate-slide-up stagger-4">
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

        {/* RANKING WIDGET - Full leaderboard */}
        <div className="col-span-2 animate-slide-up stagger-5">
          <Leaderboard
            entries={leaderboard}
            currentUserId={user?.id}
            isLoading={leaderboardLoading}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </div>
    </div>
  );
}
