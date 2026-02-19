import { Link, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { UserPointsCard } from './UserPointsCard';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRewards } from '@/hooks/useRewards';
import { usePoints } from '@/hooks/usePoints';
import { getRank, getNextRank } from '@/lib/ranks';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { usePersonalFinanceStats } from '@/hooks/usePersonalFinanceStats';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalFinanceChartWidget } from './PersonalFinanceChartWidget';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { redemptions } = useRewards();
  const { earned: earnedPoints } = usePoints();
  const { totalBalance, monthExpenses, pendingExpenses: personalPending, isLoading: personalLoading } = usePersonalFinanceStats();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;

  const currentRank = getRank(earnedPoints);
  const nextRank = getNextRank(earnedPoints);

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="animate-slide-up stagger-1">
        <div className="card-surface p-5">
          <h2 className="text-xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] || 'Colaborador'}!
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            {userRank ? (
              <>Você está em <span className="font-bold text-primary">#{userRank}</span> no ranking mensal</>
            ) : (
              'Complete tarefas para ganhar pontos'
            )}
          </p>
        </div>
      </div>

      {/* Personal Finance Card */}
      <div className="animate-slide-up stagger-2">
        <button
          onClick={() => navigate('/personal-finance')}
          className="finance-hero-card finance-hero-card--personal w-full text-left"
        >
          <div className="finance-hero-inner p-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/70">
                Meu saldo pessoal
              </span>
              <AppIcon name="ChevronRight" size={18} className="text-white/50" />
            </div>
            <p className={cn(
              "text-[2rem] font-extrabold tracking-tight leading-tight",
              totalBalance >= 0 ? "text-white" : "text-red-300"
            )}>
              {personalLoading ? <Skeleton className="h-9 w-40 bg-white/10" /> : formatCurrency(totalBalance)}
            </p>
            <div className="flex gap-2 mt-3">
              <div className="finance-hero-chip finance-hero-chip--success">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Despesas do mês</span>
                <span className="text-sm font-bold text-white">{personalLoading ? '...' : formatCurrency(monthExpenses)}</span>
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
      </div>

      {/* Points Card */}
      <div className="animate-slide-up stagger-3">
        <UserPointsCard />
      </div>

      {/* Next Rank Progress */}
      {nextRank && (
        <div className="animate-slide-up stagger-3">
          <div className="card-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: currentRank.color }}>
                  {currentRank.title}
                </span>
                <AppIcon name="ArrowRight" size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {nextRank.title}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Faltam {nextRank.pointsNeeded} pts
              </span>
            </div>
            <Progress
              value={nextRank.pointsNeeded > 0 ? Math.max(5, 100 - (nextRank.pointsNeeded / (nextRank.pointsNeeded + earnedPoints)) * 100) : 100}
              className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-[hsl(var(--neon-cyan))]"
            />
          </div>
        </div>
      )}

      {/* Personal Expense Chart */}
      <div className="grid grid-cols-2 gap-3">
        <PersonalFinanceChartWidget />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { to: '/checklists', icon: 'ClipboardCheck', label: 'Checklists', sub: 'Ganhe pontos', color: 'text-success', idx: 4 },
          { to: '/cash-closing', icon: 'Receipt', label: 'Caixa', sub: 'Fechamento', color: 'text-primary', idx: 5 },
          { to: '/rewards', icon: 'Gift', label: 'Recompensas', sub: 'Troque', color: 'text-warning', idx: 6, badge: pendingRedemptions },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <div className={cn(
              "card-interactive p-4 flex flex-col items-center text-center h-full relative animate-slide-up",
              `stagger-${item.idx}`
            )}>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-secondary/80")}>
                <AppIcon name={item.icon} size={20} className={item.color} />
              </div>
              <p className="font-semibold text-xs text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="animate-slide-up stagger-7">
        <Leaderboard 
          entries={leaderboard}
          currentUserId={user?.id}
          isLoading={leaderboardLoading}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>
    </div>
  );
}
