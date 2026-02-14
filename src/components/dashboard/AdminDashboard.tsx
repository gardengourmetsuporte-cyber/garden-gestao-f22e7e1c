import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda } from '@/hooks/useAgenda';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';
import { useCountUp, useCountUpCurrency } from '@/hooks/useCountUp';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getRank } from '@/lib/ranks';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { tasks: agendaTasks, isLoading: tasksLoading } = useAgenda();
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

  // Agenda: today's pending tasks
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const pendingTasks = (agendaTasks || [])
    .filter(t => !t.is_completed && (!t.due_date || t.due_date <= todayStr || t.date === todayStr))
    .slice(0, 5);

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

        {/* POINTS WIDGET - half width */}
        <button
          onClick={() => navigate('/profile')}
          className="card-command-warning p-4 text-left animate-slide-up stagger-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2">
            <AppIcon name="Star" size={18} className="text-warning" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Seus pontos</span>
          </div>
          {pointsLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{animatedPoints}</p>
              <div className="mt-2">
                <Progress value={progress} className="h-1 bg-secondary [&>div]:bg-warning" />
                <p className="text-[9px] text-muted-foreground mt-1">{earnedPoints}/{nextMilestone} próxima conquista</p>
              </div>
            </>
          )}
        </button>

        {/* RANKING WIDGET - half width */}
        <button
          onClick={() => navigate('/profile')}
          className="card-command p-4 text-left animate-slide-up stagger-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-3">
            <AppIcon name="Trophy" size={18} className="text-warning" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ranking</span>
          </div>
          {leaderboardLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : top3.length > 0 ? (
            <div className="space-y-2">
              {top3.map((entry, idx) => (
                <div key={entry.user_id} className="flex items-center gap-2">
                  <span className="text-xs w-4 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                  <RankedAvatar avatarUrl={entry.avatar_url} earnedPoints={entry.earned_points} size={20} />
                  <span className={cn(
                    "text-[11px] font-medium truncate flex-1",
                    entry.user_id === user?.id && "text-primary"
                  )}>
                    {entry.full_name?.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-bold text-warning">{entry.earned_points}</span>
                </div>
              ))}
              {userRank && userRank.rank > 3 && (
                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                  <span className="text-[10px] w-4 text-center text-muted-foreground font-bold">{userRank.rank}º</span>
                  <RankedAvatar avatarUrl={userRank.avatar_url} earnedPoints={userRank.earned_points} size={20} />
                  <span className="text-[11px] font-medium text-primary truncate flex-1">Você</span>
                  <span className="text-[10px] font-bold text-warning">{userRank.earned_points}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sem dados</p>
          )}
        </button>

        {/* AGENDA WIDGET - full width */}
        <button
          onClick={() => navigate('/agenda')}
          className="card-command col-span-2 p-4 text-left animate-slide-up stagger-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AppIcon name="CalendarDays" size={18} className="text-primary" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Agenda de hoje</span>
            </div>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : pendingTasks.length > 0 ? (
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && !isToday(new Date(task.due_date));
                return (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      isOverdue ? "bg-destructive" : "bg-primary"
                    )} />
                    <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                    {task.due_date && (
                      <span className={cn(
                        "text-[10px] font-medium flex-shrink-0",
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {isToday(new Date(task.due_date)) ? 'Hoje' : 
                         isTomorrow(new Date(task.due_date)) ? 'Amanhã' :
                         format(new Date(task.due_date), 'dd/MM')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-3">
              <AppIcon name="Check" size={24} className="text-success mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Nenhuma tarefa pendente</p>
            </div>
          )}
        </button>

        {/* ALERTS - full width, only if alerts exist */}
        {(stats.pendingRedemptions > 0) && (
          <div className="card-command-info col-span-2 p-4 animate-slide-up stagger-5">
            <div className="flex items-center gap-2 mb-2">
              <AppIcon name="Bell" size={16} className="text-primary" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ações pendentes</span>
            </div>
            {stats.pendingRedemptions > 0 && (
              <button
                onClick={() => navigate('/rewards')}
                className="flex items-center justify-between w-full py-1.5 hover:bg-muted/30 rounded-lg px-2 transition-colors"
              >
                <span className="text-xs text-foreground">Resgates aguardando</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{stats.pendingRedemptions}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
