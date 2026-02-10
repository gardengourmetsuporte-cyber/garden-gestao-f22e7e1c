import { useMemo, useState, useCallback } from 'react';
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
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Droppable date zone (for cross-date drops)
function DateDropZone({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `date-${dateStr}` });
  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'bg-primary/10 rounded-lg ring-2 ring-primary/30 transition-all duration-200' : 'transition-all duration-200'}
    >
      {children}
    </div>
  );
}

// Sortable transaction wrapper (supports both reordering within day and cross-day drag)
function SortableTransaction({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    ...(isDragging && {
      scale: '1.02',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--neon-cyan) / 0.2)',
      borderRadius: '16px',
      opacity: 0.95,
    }),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

interface FinanceTransactionsProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  transactionsByDate: Record<string, FinanceTransaction[]>;
  monthStats: MonthlyStats;
  onTransactionClick: (transaction: FinanceTransaction) => void;
  onTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransactionDate?: (id: string, newDate: string) => Promise<void>;
  onReorderTransactions?: (dateStr: string, orderedIds: string[]) => Promise<void>;
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
  onUpdateTransactionDate,
  onReorderTransactions,
  categories,
  accounts
}: FinanceTransactionsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>({
    status: 'all',
    categoryId: null,
    accountId: null
  });

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 8 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredTransactionsByDate = useMemo(() => {
    const result: Record<string, FinanceTransaction[]> = {};
    
    Object.entries(transactionsByDate).forEach(([date, transactions]) => {
      const filtered = transactions.filter(t => {
        if (filters.status === 'paid' && !t.is_paid) return false;
        if (filters.status === 'pending' && t.is_paid) return false;
        if (filters.categoryId && t.category_id !== filters.categoryId) return false;
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

  // Build a flat map of transaction ID -> date
  const transactionDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(filteredTransactionsByDate).forEach(([date, txns]) => {
      txns.forEach(t => { map[t.id] = date; });
    });
    return map;
  }, [filteredTransactionsByDate]);

  const hasTransactions = sortedDates.length > 0;
  const hasActiveFilters = filters.status !== 'all' || filters.categoryId || filters.accountId;

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const txnId = String(active.id);
    const overId = String(over.id);
    const currentDate = transactionDateMap[txnId];

    // Check if dropping on a date zone (cross-date move)
    if (overId.startsWith('date-')) {
      const targetDate = overId.replace('date-', '');
      if (targetDate !== currentDate && onUpdateTransactionDate) {
        await onUpdateTransactionDate(txnId, targetDate);
      }
      return;
    }

    // Check if dropping on another transaction
    const targetDate = transactionDateMap[overId];
    
    if (targetDate && targetDate === currentDate && onReorderTransactions) {
      // Same day reorder
      const dayTxns = filteredTransactionsByDate[currentDate];
      if (!dayTxns) return;
      
      const oldIndex = dayTxns.findIndex(t => t.id === txnId);
      const newIndex = dayTxns.findIndex(t => t.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(dayTxns, oldIndex, newIndex);
        await onReorderTransactions(currentDate, reordered.map(t => t.id));
      }
    } else if (targetDate && targetDate !== currentDate && onUpdateTransactionDate) {
      // Cross-date move (dropped on a transaction in another date)
      await onUpdateTransactionDate(txnId, targetDate);
    }
  }, [filteredTransactionsByDate, transactionDateMap, onUpdateTransactionDate, onReorderTransactions]);

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
        <div className="mx-4 card-command p-3">
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

        {/* Transactions List with DnD */}
        {hasTransactions ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="px-4 pb-24 space-y-4">
              {sortedDates.map(dateStr => {
                const transactions = filteredTransactionsByDate[dateStr];
                const dayTotal = transactions.reduce((sum, t) => {
                  if (t.type === 'income') return sum + Number(t.amount);
                  if (t.type === 'expense' || t.type === 'credit_card') return sum - Number(t.amount);
                  return sum;
                }, 0);

                return (
                  <DateDropZone key={dateStr} dateStr={dateStr}>
                    {/* Date Header */}
                    <div className="flex items-center justify-between py-2 px-1">
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      <span className={`text-sm font-semibold ${dayTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(dayTotal)}
                      </span>
                    </div>

                    {/* Sortable transactions for this date */}
                    <SortableContext items={transactions.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {transactions.map(transaction => (
                          <SortableTransaction key={transaction.id} id={transaction.id}>
                            <div className="relative">
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
                          </SortableTransaction>
                        ))}
                      </div>
                    </SortableContext>
                  </DateDropZone>
                );
              })}
            </div>
          </DndContext>
        ) : (
          <div className="empty-state">
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
