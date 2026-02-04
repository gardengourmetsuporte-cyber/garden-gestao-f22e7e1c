import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthSelector } from './MonthSelector';
import { TransactionItem } from './TransactionItem';
import { FinanceTransaction, MonthlyStats } from '@/types/finance';
import { FileText } from 'lucide-react';

interface FinanceTransactionsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  transactionsByDate: Record<string, FinanceTransaction[]>;
  monthStats: MonthlyStats;
  onTransactionClick: (transaction: FinanceTransaction) => void;
}

export function FinanceTransactions({
  selectedMonth,
  onMonthChange,
  transactionsByDate,
  monthStats,
  onTransactionClick
}: FinanceTransactionsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const sortedDates = useMemo(() => {
    return Object.keys(transactionsByDate).sort((a, b) => b.localeCompare(a));
  }, [transactionsByDate]);

  const hasTransactions = sortedDates.length > 0;

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="px-4 pt-4">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Summary Header */}
      <div className="px-4 py-3 bg-secondary/50 border-y">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Saldo do mês</span>
          <span className={monthStats.balance >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
            {formatCurrency(monthStats.balance)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-success">+{formatCurrency(monthStats.totalIncome)}</span>
          <span className="text-destructive">-{formatCurrency(monthStats.totalExpense)}</span>
        </div>
      </div>

      {/* Transactions List */}
      {hasTransactions ? (
        <div className="px-4 pb-24 space-y-4">
          {sortedDates.map(dateStr => {
            const transactions = transactionsByDate[dateStr];
            const dayTotal = transactions.reduce((sum, t) => {
              if (t.type === 'income') return sum + Number(t.amount);
              if (t.type === 'expense' || t.type === 'credit_card') return sum - Number(t.amount);
              return sum;
            }, 0);

            return (
              <div key={dateStr}>
                {/* Date Header */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground capitalize">
                    {format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <span className={`text-sm font-semibold ${dayTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(dayTotal)}
                  </span>
                </div>

                {/* Transactions for this date */}
                <div className="space-y-2">
                  {transactions.map(transaction => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onClick={() => onTransactionClick(transaction)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhuma transação</p>
          <p className="text-sm">Toque em + para adicionar</p>
        </div>
      )}
    </div>
  );
}
