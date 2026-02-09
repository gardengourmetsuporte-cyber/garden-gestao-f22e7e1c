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
    <div className="p-4 space-y-6">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
        <p className="text-sm opacity-80">Saldo em contas</p>
        <p className={cn(
          "text-3xl font-bold mt-1",
          totalBalance < 0 && "text-destructive-foreground/80"
        )}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Income/Expense Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-success">
            <ArrowUpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Receitas</span>
          </div>
          <p className="text-xl font-bold mt-2 text-success">
            {formatCurrency(monthStats.totalIncome)}
          </p>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-destructive">
            <ArrowDownCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Despesas</span>
          </div>
          <p className="text-xl font-bold mt-2 text-destructive">
            {formatCurrency(monthStats.totalExpense)}
          </p>
        </div>
      </div>

      {/* Pending Alerts */}
      {(monthStats.pendingExpenses > 0 || monthStats.pendingIncome > 0) && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Pendências</span>
          </div>
          {monthStats.pendingExpenses > 0 && (
            <p className="text-sm text-muted-foreground">
              Despesas a pagar: <span className="font-medium text-destructive">{formatCurrency(monthStats.pendingExpenses)}</span>
            </p>
          )}
          {monthStats.pendingIncome > 0 && (
            <p className="text-sm text-muted-foreground">
              Receitas a receber: <span className="font-medium text-success">{formatCurrency(monthStats.pendingIncome)}</span>
            </p>
          )}
        </div>
      )}

      {/* Quick Actions - compact inline */}
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
            bg-success/15 text-success border border-success/20
            active:scale-[0.97] transition-all touch-manipulation"
          onClick={() => onAddTransaction('income')}
        >
          <ArrowUpCircle className="w-5 h-5" />
          <span className="text-xs font-semibold">Receita</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
            bg-destructive/15 text-destructive border border-destructive/20
            active:scale-[0.97] transition-all touch-manipulation"
          onClick={() => onAddTransaction('expense')}
        >
          <ArrowDownCircle className="w-5 h-5" />
          <span className="text-xs font-semibold">Despesa</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
            bg-primary/15 text-primary border border-primary/20
            active:scale-[0.97] transition-all touch-manipulation"
          onClick={() => onAddTransaction('transfer')}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-xs font-semibold">Transf.</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Contas</h2>
          <Button variant="ghost" size="sm" className="text-primary" onClick={onAddAccount}>
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
        <div className="space-y-2">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
          {accounts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma conta cadastrada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
