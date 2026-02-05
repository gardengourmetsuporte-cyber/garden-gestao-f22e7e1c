 import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthSelector } from './MonthSelector';
import { TransactionItem } from './TransactionItem';
import { FinanceTransaction, MonthlyStats } from '@/types/finance';
 import { FileText, Filter, Repeat } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { TransactionFilters, TransactionFiltersState } from './TransactionFilters';
 import { FinanceCategory, FinanceAccount } from '@/types/finance';

interface FinanceTransactionsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  transactionsByDate: Record<string, FinanceTransaction[]>;
  monthStats: MonthlyStats;
  onTransactionClick: (transaction: FinanceTransaction) => void;
  onTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
   categories: FinanceCategory[];
   accounts: FinanceAccount[];
}

export function FinanceTransactions({
  selectedMonth,
  onMonthChange,
  transactionsByDate,
  monthStats,
  onTransactionClick,
   onTogglePaid,
  onDeleteTransaction,
   categories,
   accounts
}: FinanceTransactionsProps) {
   const [showFilters, setShowFilters] = useState(false);
   const [filters, setFilters] = useState<TransactionFiltersState>({
     status: 'all',
     categoryId: null,
     accountId: null
   });
 
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

   // Apply filters to transactions
   const filteredTransactionsByDate = useMemo(() => {
     const result: Record<string, FinanceTransaction[]> = {};
     
     Object.entries(transactionsByDate).forEach(([date, transactions]) => {
       const filtered = transactions.filter(t => {
         // Status filter
         if (filters.status === 'paid' && !t.is_paid) return false;
         if (filters.status === 'pending' && t.is_paid) return false;
         
         // Category filter
         if (filters.categoryId && t.category_id !== filters.categoryId) return false;
         
         // Account filter
         if (filters.accountId && t.account_id !== filters.accountId) return false;
         
         return true;
       });
       
       if (filtered.length > 0) {
         result[date] = filtered;
       }
     });
     
     return result;
   }, [transactionsByDate, filters]);
 
  const sortedDates = useMemo(() => {
     return Object.keys(filteredTransactionsByDate).sort((a, b) => b.localeCompare(a));
   }, [filteredTransactionsByDate]);

  const hasTransactions = sortedDates.length > 0;
   const hasActiveFilters = filters.status !== 'all' || filters.categoryId || filters.accountId;

  return (
     <>
       <div className="space-y-4">
      {/* Month Selector */}
         <div className="px-4 pt-4 flex items-center justify-between gap-2">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
           <Button 
             variant={hasActiveFilters ? "default" : "outline"}
             size="sm"
             onClick={() => setShowFilters(true)}
             className="gap-1"
           >
             <Filter className="w-4 h-4" />
             {hasActiveFilters && <span className="text-xs">•</span>}
           </Button>
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
             const transactions = filteredTransactionsByDate[dateStr];
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
                     <div key={transaction.id} className="relative">
                       {transaction.is_recurring && transaction.installment_group_id && (
                         <Badge variant="outline" className="absolute -top-2 right-2 text-[10px] px-1.5 py-0 z-10 bg-background">
                           <Repeat className="w-2.5 h-2.5 mr-0.5" />
                           {transaction.installment_number}/{transaction.total_installments}
                         </Badge>
                       )}
                       <TransactionItem
                      transaction={transaction}
                      onClick={() => onTransactionClick(transaction)}
                      onTogglePaid={onTogglePaid}
                     onDelete={onDeleteTransaction}
                    />
                     </div>
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
 
       {/* Filters Sheet */}
       <TransactionFilters
         open={showFilters}
         onOpenChange={setShowFilters}
         filters={filters}
         onFiltersChange={setFilters}
         categories={categories}
         accounts={accounts}
       />
     </>
  );
}
