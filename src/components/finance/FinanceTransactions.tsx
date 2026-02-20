import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { differenceInHours } from 'date-fns';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthSelector } from './MonthSelector';
import { TransactionItem } from './TransactionItem';
import { FinanceTransaction, MonthlyStats } from '@/types/finance';
import { Loader2, Repeat } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionFilters, TransactionFiltersState } from './TransactionFilters';
import { FinanceCategory, FinanceAccount } from '@/types/finance';
import {
  DndContext,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable transaction wrapper (reordering within same day only)
function SortableTransaction({ id, children }: { id: string; children: (isDragging: boolean) => React.ReactNode }) {
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
      {children(isDragging)}
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
  onReorderTransactions?: (dateStr: string, orderedIds: string[]) => Promise<void>;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  initialFilters?: Partial<TransactionFiltersState>;
}

export function FinanceTransactions({
  selectedMonth,
  onMonthChange,
  transactionsByDate,
  monthStats,
  onTransactionClick,
  onTogglePaid,
  onDeleteTransaction,
  onReorderTransactions,
  categories,
  accounts,
  initialFilters
}: FinanceTransactionsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>({
    status: 'all',
    type: 'all',
    categoryId: null,
    accountId: null,
    ...initialFilters
  });

  // Track "seen" new transactions — persisted in localStorage
  const SEEN_KEY = 'finance_seen_txns';

  // Load seen state synchronously to avoid flash of glow on remount
  const getInitialSeen = (): Record<string, number> => {
    try {
      const stored = localStorage.getItem(SEEN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let data: Record<string, number>;
        if (Array.isArray(parsed)) {
          data = {};
          parsed.forEach((id: string) => { data[id] = Date.now(); });
        } else {
          data = parsed;
        }
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const cleaned: Record<string, number> = {};
        Object.entries(data).forEach(([id, ts]) => {
          if ((ts as number) > cutoff) cleaned[id] = ts as number;
        });
        localStorage.setItem(SEEN_KEY, JSON.stringify(cleaned));
        return cleaned;
      }
    } catch {}
    return {};
  };
  const seenRef = useRef<Record<string, number>>(getInitialSeen());
  const [, forceUpdate] = useState(0);

  const markSeen = useCallback((id: string) => {
    if (id in seenRef.current) return; // already seen
    seenRef.current = { ...seenRef.current, [id]: Date.now() };
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seenRef.current)); } catch {}
    forceUpdate(v => v + 1);
  }, []);

  // Not memoized — always reads fresh from the ref so dismissed items never come back
  const isNewTransaction = (t: FinanceTransaction): boolean => {
    if (t.id in seenRef.current) return false;
    const hoursAgo = differenceInHours(new Date(), new Date(t.created_at));
    return hoursAgo < 48;
  };

  // Apply initialFilters when they change from parent (reset to defaults when empty)
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    } else {
      setFilters({ status: 'all', type: 'all', categoryId: null, accountId: null });
    }
  }, [initialFilters]);
  const todayRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

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
        if (filters.type === 'income' && t.type !== 'income') return false;
        if (filters.type === 'expense' && t.type !== 'expense') return false;
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

  const hasTransactions = sortedDates.length > 0;
  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.categoryId || filters.accountId;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Reset scroll tracking when month changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [selectedMonth]);

  // Auto-scroll to today's date on mount
  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (todayRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, 100);
    }
  }, [sortedDates]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const txnId = String(active.id);
    const overId = String(over.id);

    // Find which date both belong to — only allow same-day reorder
    let sharedDate: string | null = null;
    for (const [date, txns] of Object.entries(filteredTransactionsByDate)) {
      const hasActive = txns.some(t => t.id === txnId);
      const hasOver = txns.some(t => t.id === overId);
      if (hasActive && hasOver) {
        sharedDate = date;
        break;
      }
    }

    if (!sharedDate || !onReorderTransactions) return;

    const dayTxns = filteredTransactionsByDate[sharedDate];
    const oldIndex = dayTxns.findIndex(t => t.id === txnId);
    const newIndex = dayTxns.findIndex(t => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(dayTxns, oldIndex, newIndex);
      await onReorderTransactions(sharedDate, reordered.map(t => t.id));
    }
  }, [filteredTransactionsByDate, onReorderTransactions]);

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
            <AppIcon name="Filter" size={16} />
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
                  <div key={dateStr} ref={dateStr === todayStr ? todayRef : undefined}>
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
                            {(isDragging) => (
                              <div
                                className="relative"
                              >
                                {transaction.is_recurring && transaction.installment_group_id && (
                                  <Badge variant="outline" className="absolute -top-2 right-2 text-[10px] px-1.5 py-0 z-10 bg-background">
                                    <Repeat className="w-2.5 h-2.5 mr-0.5" />
                                    {transaction.installment_number}/{transaction.total_installments}
                                  </Badge>
                                )}
                                <TransactionItem
                                  transaction={transaction}
                                  isNew={isNewTransaction(transaction)}
                                  onClick={() => {
                                    if (isNewTransaction(transaction)) {
                                      markSeen(transaction.id);
                                      return;
                                    }
                                    onTransactionClick(transaction);
                                  }}
                                  onTogglePaid={async (id, isPaid) => {
                                    markSeen(id);
                                    await onTogglePaid(id, isPaid);
                                  }}
                                  onDelete={async (id) => {
                                    markSeen(id);
                                    await onDeleteTransaction(id);
                                  }}
                                  disableSwipe={isDragging}
                                />
                              </div>
                            )}
                          </SortableTransaction>
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </DndContext>
        ) : (
          <div className="empty-state">
            <AppIcon name="FileText" size={48} className="mb-4 opacity-50" />
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
