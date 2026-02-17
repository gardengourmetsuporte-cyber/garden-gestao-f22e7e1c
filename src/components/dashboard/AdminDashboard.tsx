import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';
import { useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { FinanceChartWidget } from './FinanceChartWidget';
import { AICopilotWidget } from './AICopilotWidget';
import { AutoOrderWidget } from './AutoOrderWidget';
import { AgendaDashboardWidget } from './AgendaDashboardWidget';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { earnedPoints, balance, isLoading: pointsLoading } = usePoints();

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

        {/* AI COPILOT WIDGET */}
        <AICopilotWidget />

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


        {/* FINANCE CHART WIDGET - Donut expenses */}
        <FinanceChartWidget />

        {/* AUTO ORDER WIDGET */}
        <AutoOrderWidget />

        {/* AGENDA WIDGET - Full featured */}
        <AgendaDashboardWidget />

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

        {/* RANKING WIDGET - Compact horizontal bar */}
        <button
          onClick={() => navigate('/ranking')}
          className="col-span-2 animate-slide-up stagger-5"
        >
          <div className="card-command w-full p-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--neon-amber) / 0.15)', border: '1px solid hsl(var(--neon-amber) / 0.25)' }}>
                <AppIcon name="Trophy" size={18} style={{ color: 'hsl(var(--neon-amber))' }} />
              </div>
              <div className="flex-1 min-w-0">
                {leaderboardLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : top3.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {top3.slice(0, 3).map((entry, idx) => (
                        <div key={entry.user_id} className="ring-2 ring-background rounded-full">
                          <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.total_score} size={24} />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        🥇 {top3[0].full_name?.split(' ')[0]} · <span style={{ color: 'hsl(var(--neon-amber))' }}>{top3[0].total_score} pts</span>
                      </p>
                      {userRank && userRank.rank > 1 && (
                        <p className="text-[10px] text-muted-foreground">
                          Você está em {userRank.rank}º lugar
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados de ranking</p>
                )}
              </div>
              <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
