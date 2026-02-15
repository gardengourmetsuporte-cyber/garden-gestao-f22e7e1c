import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';
import { useCountUp, useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
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
  const animatedPoints = useCountUp(balance);

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

        {/* RANKING WIDGET - FULL WIDTH, LAST */}
        <div className="col-span-2 animate-slide-up stagger-5">
          <div
            className="card-command w-full p-5 text-left overflow-hidden relative"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'hsl(var(--neon-amber))' }} />
            <div className="flex items-center justify-between mb-5 relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--neon-amber) / 0.15)', border: '1px solid hsl(var(--neon-amber) / 0.25)' }}>
                  <AppIcon name="Trophy" size={18} style={{ color: 'hsl(var(--neon-amber))' }} />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Ranking</span>
                  <span className="text-[10px] text-muted-foreground block">Placar de pontos</span>
                </div>
              </div>
            </div>
            {leaderboardLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : top3.length > 0 ? (
              <>
                <div className="flex items-end justify-center gap-4 mb-5 pt-2">
                  {top3[1] && (
                    <button onClick={() => navigate(`/profile/${top3[1].user_id}`)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                      <div className="relative">
                        <RankedAvatar avatarUrl={top3[1].avatar_url} earnedPoints={top3[1].total_score} size={44} />
                        <span className="absolute -bottom-1 -right-1 text-base">🥈</span>
                      </div>
                      <span className={cn("text-[11px] font-semibold truncate max-w-[72px] text-center", top3[1].user_id === user?.id && "text-primary")}>{top3[1].full_name?.split(' ')[0]}</span>
                      <span className="text-[10px] font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{top3[1].total_score} pts</span>
                      <div className="w-[68px] h-14 rounded-t-xl" style={{ background: 'linear-gradient(180deg, hsl(215 20% 60% / 0.25), transparent)', border: '1px solid hsl(215 20% 60% / 0.3)', borderBottom: 'none' }} />
                    </button>
                  )}
                  {top3[0] && (
                    <button onClick={() => navigate(`/profile/${top3[0].user_id}`)} className="flex flex-col items-center gap-1.5 -mt-2 active:scale-95 transition-transform">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{ background: 'hsl(var(--neon-amber))' }} />
                        <RankedAvatar avatarUrl={top3[0].avatar_url} earnedPoints={top3[0].total_score} size={60} />
                        <span className="absolute -bottom-1 -right-1 text-lg">🥇</span>
                      </div>
                      <span className={cn("text-xs font-bold truncate max-w-[80px] text-center", top3[0].user_id === user?.id ? "text-primary" : "text-foreground")}>{top3[0].full_name?.split(' ')[0]}</span>
                      <span className="text-[11px] font-extrabold" style={{ color: 'hsl(var(--neon-amber))' }}>{top3[0].total_score} pts</span>
                      <div className="w-[72px] h-20 rounded-t-xl" style={{ background: 'linear-gradient(180deg, hsl(var(--neon-amber) / 0.25), transparent)', border: '1px solid hsl(var(--neon-amber) / 0.35)', borderBottom: 'none' }} />
                    </button>
                  )}
                  {top3[2] && (
                    <button onClick={() => navigate(`/profile/${top3[2].user_id}`)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                      <div className="relative">
                        <RankedAvatar avatarUrl={top3[2].avatar_url} earnedPoints={top3[2].total_score} size={44} />
                        <span className="absolute -bottom-1 -right-1 text-base">🥉</span>
                      </div>
                      <span className={cn("text-[11px] font-semibold truncate max-w-[72px] text-center", top3[2].user_id === user?.id && "text-primary")}>{top3[2].full_name?.split(' ')[0]}</span>
                      <span className="text-[10px] font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{top3[2].total_score} pts</span>
                      <div className="w-[68px] h-10 rounded-t-xl" style={{ background: 'linear-gradient(180deg, hsl(30 60% 40% / 0.25), transparent)', border: '1px solid hsl(30 60% 40% / 0.3)', borderBottom: 'none' }} />
                    </button>
                  )}
                </div>
                {(leaderboard || []).slice(3).map((entry) => (
                  <button
                    key={entry.user_id}
                    onClick={() => navigate(`/profile/${entry.user_id}`)}
                    className={cn(
                      "flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1.5 w-full text-left active:scale-[0.98] transition-transform",
                      entry.user_id === user?.id ? "bg-primary/10 ring-1 ring-primary/20" : "bg-secondary/40"
                    )}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{entry.rank}º</span>
                    <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.total_score} size={28} />
                    <span className={cn("text-xs font-medium truncate flex-1", entry.user_id === user?.id && "text-primary")}>
                      {entry.full_name?.split(' ')[0]}
                      {entry.user_id === user?.id && <span className="text-[10px] text-muted-foreground ml-1">(você)</span>}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--neon-amber) / 0.1)' }}>
                      <AppIcon name="Star" size={12} style={{ color: 'hsl(var(--neon-amber))' }} />
                      <span className="text-[10px] font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{entry.total_score}</span>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="text-center py-6">
                <AppIcon name="Trophy" size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sem dados de ranking</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
