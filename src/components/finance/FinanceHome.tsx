import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { MonthSelector } from './MonthSelector';
import { AccountCard } from './AccountCard';
import { FinanceAccount, MonthlyStats, FinanceTab } from '@/types/finance';
import { cn } from '@/lib/utils';

interface FinanceHomeProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  accounts: FinanceAccount[];
  totalBalance: number;
  monthStats: MonthlyStats;
  onNavigate?: (tab: FinanceTab, filter?: { type?: 'income' | 'expense'; status?: 'pending' }) => void;
  onAccountClick?: (account: FinanceAccount) => void;
  variant?: 'business' | 'personal';
}

export function FinanceHome({
  selectedMonth,
  onMonthChange,
  accounts,
  totalBalance,
  monthStats,
  onNavigate,
  onAccountClick,
  variant = 'business',
}: FinanceHomeProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const profit = monthStats.totalIncome - monthStats.totalExpense;
  const profitPercent = monthStats.totalIncome > 0 
    ? ((profit / monthStats.totalIncome) * 100).toFixed(0) 
    : '0';

  return (
    <div className="px-4 py-3 lg:px-6 space-y-4">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* === HERO BALANCE CARD === */}
      <button
        onClick={() => onNavigate?.('more')}
        className={cn("finance-hero-card w-full text-left animate-slide-up stagger-1", variant === 'personal' && "finance-hero-card--personal")}
      >
        <div className="finance-hero-inner p-5 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-500">
              {variant === 'personal' ? 'Meu saldo pessoal' : 'Saldo em contas'}
            </span>
            <AppIcon name="ChevronRight" size={18} className="text-slate-400" />
          </div>

          {/* Balance */}
          <p className={cn(
            "text-[2rem] font-extrabold tracking-tight leading-tight",
            totalBalance >= 0 ? "text-slate-900" : "text-red-600"
          )}>
            {formatCurrency(totalBalance)}
          </p>

          {/* Sub-stats row */}
          <div className="flex gap-2 mt-3">
            <div className="finance-hero-chip finance-hero-chip--success">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Lucro líquido</span>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-sm font-bold",
                  profit >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatCurrency(Math.abs(profit))}
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-1 py-0.5 rounded",
                  profit >= 0 
                    ? "text-emerald-700 bg-emerald-500/15" 
                    : "text-red-700 bg-red-500/15"
                )}>
                  {profit >= 0 ? '+' : '-'}{Math.abs(Number(profitPercent))}%
                </span>
              </div>
            </div>
            <div className="finance-hero-chip finance-hero-chip--neutral">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Despesas</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(monthStats.totalExpense)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Income/Expense Summary */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-2">
        <button
          onClick={() => onNavigate?.('transactions', { type: 'income' })}
          className="card-command-success p-4 text-left cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
              <AppIcon name="ArrowUpCircle" size={18} className="text-success" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Receitas</span>
          </div>
          <p className="text-lg font-bold text-success">
            {formatCurrency(monthStats.totalIncome)}
          </p>
        </button>
        <button
          onClick={() => onNavigate?.('transactions', { type: 'expense' })}
          className="card-command-danger p-4 text-left cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center">
              <AppIcon name="ArrowDownCircle" size={18} className="text-destructive" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Despesas</span>
          </div>
          <p className="text-lg font-bold text-destructive">
            {formatCurrency(monthStats.totalExpense)}
          </p>
        </button>
      </div>

      {/* Planning Quick Access */}
      <button
        onClick={() => onNavigate?.('planning')}
        className="w-full p-4 rounded-xl bg-card border border-border/50 text-left cursor-pointer transition-all duration-200 animate-slide-up stagger-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="Target" size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-sm text-foreground">Planejar</span>
            <p className="text-[11px] text-muted-foreground">Orçamentos, DRE e Fluxo de Caixa</p>
          </div>
          <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
        </div>
      </button>

      {/* Pending Alerts */}
      {(monthStats.pendingExpenses > 0 || monthStats.pendingIncome > 0) && (
        <button
          onClick={() => onNavigate?.('transactions', { status: 'pending' })}
          className="card-command-warning p-4 space-y-2 animate-slide-up stagger-3 w-full text-left cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center">
                <AppIcon name="AlertCircle" size={16} className="text-warning" />
              </div>
              <span className="font-semibold text-sm text-warning">Pendências</span>
            </div>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
          </div>
          {monthStats.pendingExpenses > 0 && (
            <div className="flex items-center justify-between pl-9 text-sm">
              <span className="text-muted-foreground">Despesas a pagar</span>
              <span className="font-semibold text-destructive">{formatCurrency(monthStats.pendingExpenses)}</span>
            </div>
          )}
          {monthStats.pendingIncome > 0 && (
            <div className="flex items-center justify-between pl-9 text-sm">
              <span className="text-muted-foreground">Receitas a receber</span>
              <span className="font-semibold text-success">{formatCurrency(monthStats.pendingIncome)}</span>
            </div>
          )}
        </button>
      )}

      {/* Accounts List */}
      <div className="space-y-3 animate-slide-up stagger-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground font-display">Contas</h2>
        </div>
        <div className="space-y-2">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} onClick={() => onAccountClick?.(account)} />
          ))}
          {accounts.length === 0 && (
            <EmptyState
              icon="Wallet"
              title="Nenhuma conta cadastrada"
              subtitle="Adicione suas contas bancárias para acompanhar seus saldos."
            />
          )}
        </div>
      </div>
    </div>
  );
}
