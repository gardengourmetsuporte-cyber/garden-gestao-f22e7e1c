import { ArrowUpCircle, ArrowDownCircle, AlertCircle, ChevronRight } from 'lucide-react';
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
}

export function FinanceHome({
  selectedMonth,
  onMonthChange,
  accounts,
  totalBalance,
  monthStats,
  onNavigate,
  onAccountClick,
}: FinanceHomeProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="p-4 space-y-5">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* Total Balance Card - Command Center style */}
      <button
        onClick={() => onNavigate?.('more')}
        className="card-command animate-neon-border p-6 animate-slide-up stagger-1 w-full text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo em contas</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className={cn(
          "text-4xl font-extrabold mt-2 tracking-tight",
          totalBalance >= 0 ? "text-[hsl(var(--neon-cyan))]" : "text-destructive"
        )}>
          {formatCurrency(totalBalance)}
        </p>
      </button>

      {/* Income/Expense Summary - asymmetric command cards */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-2">
        <button
          onClick={() => onNavigate?.('transactions', { type: 'income' })}
          className="card-command-success p-4 text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="icon-glow icon-glow-sm icon-glow-success">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Receitas</span>
          </div>
          <p className="text-xl font-bold text-success">
            {formatCurrency(monthStats.totalIncome)}
          </p>
        </button>
        <button
          onClick={() => onNavigate?.('transactions', { type: 'expense' })}
          className="card-command-danger p-4 text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="icon-glow icon-glow-sm icon-glow-destructive">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Despesas</span>
          </div>
          <p className="text-xl font-bold text-destructive">
            {formatCurrency(monthStats.totalExpense)}
          </p>
        </button>
      </div>

      {/* Pending Alerts */}
      {(monthStats.pendingExpenses > 0 || monthStats.pendingIncome > 0) && (
        <button
          onClick={() => onNavigate?.('transactions', { status: 'pending' })}
          className="card-command-warning p-4 space-y-2 animate-slide-up stagger-3 w-full text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="icon-glow icon-glow-sm icon-glow-warning" style={{ width: '1.75rem', height: '1.75rem' }}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-warning">Pendências</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
        </button>
      )}

      {/* Accounts List */}
      <div className="space-y-3 animate-slide-up stagger-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contas</h2>
        </div>
        <div className="space-y-2">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} onClick={() => onAccountClick?.(account)} />
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