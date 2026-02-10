import { ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { AccountCard } from './AccountCard';
import { FinanceAccount, MonthlyStats } from '@/types/finance';
import { cn } from '@/lib/utils';

interface FinanceHomeProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  accounts: FinanceAccount[];
  totalBalance: number;
  monthStats: MonthlyStats;
}

export function FinanceHome({
  selectedMonth,
  onMonthChange,
  accounts,
  totalBalance,
  monthStats,
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

      {/* Accounts List */}
      <div className="space-y-3 animate-slide-up stagger-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contas</h2>
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