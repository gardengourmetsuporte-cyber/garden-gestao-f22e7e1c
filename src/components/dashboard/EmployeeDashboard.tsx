import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalFinanceStats } from '@/hooks/usePersonalFinanceStats';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalFinanceChartWidget } from './PersonalFinanceChartWidget';
import { cn } from '@/lib/utils';


export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { totalBalance, monthExpenses, pendingExpenses: personalPending, isLoading: personalLoading } = usePersonalFinanceStats();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="animate-spring-in spring-stagger-1">
        <div className="card-surface p-5" style={{ border: 'none' }}>
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
      <div className="animate-spring-in spring-stagger-2">
        <button
          onClick={() => navigate('/personal-finance')}
          className="finance-hero-card finance-hero-card--personal w-full text-left card-press"
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

      {/* Personal Expense Chart */}
      <div className="animate-spring-in spring-stagger-3">
        <div className="card-press min-w-0 overflow-hidden">
          <PersonalFinanceChartWidget />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="animate-spring-in spring-stagger-3">
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
