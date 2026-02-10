import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Plus, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthSelector } from './MonthSelector';
import { AccountCard } from './AccountCard';
import { FinanceAccount, MonthlyStats, TransactionType } from '@/types/finance';
import { cn } from '@/lib/utils';

interface FinanceHomeProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  accounts: FinanceAccount[];
  totalBalance: number;
  monthStats: MonthlyStats;
  onAddTransaction: (type: TransactionType) => void;
  onAddAccount?: () => void;
}

export function FinanceHome({
  selectedMonth,
  onMonthChange,
  accounts,
  totalBalance,
  monthStats,
  onAddTransaction,
  onAddAccount
}: FinanceHomeProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="p-4 space-y-5">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* Total Balance Card - Command Center style */}
      <div className="card-command animate-neon-border p-6 animate-slide-up stagger-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo em contas</p>
        <p className={cn(
          "text-4xl font-extrabold mt-2 tracking-tight",
          totalBalance >= 0 ? "text-[hsl(var(--neon-cyan))]" : "text-destructive"
        )}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Income/Expense Summary - asymmetric command cards */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-2">
        <div className="card-command-success p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-success" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Receitas</span>
          </div>
          <p className="text-xl font-bold text-success">
            {formatCurrency(monthStats.totalIncome)}
          </p>
        </div>
        <div className="card-command-danger p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-destructive/15 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Despesas</span>
          </div>
          <p className="text-xl font-bold text-destructive">
            {formatCurrency(monthStats.totalExpense)}
          </p>
        </div>
      </div>

      {/* Pending Alerts */}
      {(monthStats.pendingExpenses > 0 || monthStats.pendingIncome > 0) && (
        <div className="card-command-warning p-4 space-y-2 animate-slide-up stagger-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-warning/15 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <span className="font-semibold text-sm text-warning">Pendências</span>
          </div>
          {monthStats.pendingExpenses > 0 && (
            <p className="text-sm text-muted-foreground pl-9">
              Despesas a pagar: <span className="font-semibold text-destructive">{formatCurrency(monthStats.pendingExpenses)}</span>
            </p>
          )}
          {monthStats.pendingIncome > 0 && (
            <p className="text-sm text-muted-foreground pl-9">
              Receitas a receber: <span className="font-semibold text-success">{formatCurrency(monthStats.pendingIncome)}</span>
            </p>
          )}
        </div>
      )}

      {/* Quick Actions - circular command style */}
      <div className="flex justify-center gap-6 py-2 animate-slide-up stagger-4">
        <button
          className="flex flex-col items-center gap-2 group"
          onClick={() => onAddTransaction('income')}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center
            border-2 border-success/30 bg-success/10
            group-active:scale-90 transition-all duration-200
            group-hover:border-success/50 group-hover:shadow-glow-success">
            <ArrowUpCircle className="w-6 h-6 text-success" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Receita</span>
        </button>
        <button
          className="flex flex-col items-center gap-2 group"
          onClick={() => onAddTransaction('expense')}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center
            border-2 border-destructive/30 bg-destructive/10
            group-active:scale-90 transition-all duration-200
            group-hover:border-destructive/50 group-hover:shadow-glow-destructive">
            <ArrowDownCircle className="w-6 h-6 text-destructive" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Despesa</span>
        </button>
        <button
          className="flex flex-col items-center gap-2 group"
          onClick={() => onAddTransaction('transfer')}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center
            border-2 border-primary/30 bg-primary/10
            group-active:scale-90 transition-all duration-200
            group-hover:border-primary/50 group-hover:shadow-glow-primary">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Transf.</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="space-y-3 animate-slide-up stagger-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contas</h2>
          <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={onAddAccount}>
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
        <div className="space-y-2">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
          {accounts.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhuma conta cadastrada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}