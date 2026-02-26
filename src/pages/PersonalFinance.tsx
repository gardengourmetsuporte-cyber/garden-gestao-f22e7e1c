import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FinanceBottomNav } from '@/components/finance/FinanceBottomNav';
import { FinanceHome } from '@/components/finance/FinanceHome';
import { FinanceTransactions } from '@/components/finance/FinanceTransactions';
import { FinanceCharts } from '@/components/finance/FinanceCharts';
import { FinanceMore } from '@/components/finance/FinanceMore';
import { FinancePlanning } from '@/components/finance/FinancePlanning';
import { TransactionSheet } from '@/components/finance/TransactionSheet';
import { AccountManagement } from '@/components/finance/AccountManagement';
import { usePersonalFinance } from '@/hooks/usePersonalFinance';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { FinanceTab, TransactionType, FinanceTransaction, FinanceAccount } from '@/types/finance';
import { TransactionFiltersState } from '@/components/finance/TransactionFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { RecurringEditMode } from '@/components/finance/TransactionSheet';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PersonalFinance() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('home');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  useEffect(() => {
    const handler = (e: Event) => {
      if (activeTab !== 'home') {
        e.preventDefault();
        setActiveTab('home');
      }
    };
    window.addEventListener('app-back-swipe', handler);
    return () => window.removeEventListener('app-back-swipe', handler);
  }, [activeTab]);

  // Reset filters when leaving the transactions tab
  useEffect(() => {
    if (activeTab !== 'transactions') {
      setTransactionInitialFilters({});
    }
  }, [activeTab]);

  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [accountManagementOpen, setAccountManagementOpen] = useState(false);
  const [transactionInitialFilters, setTransactionInitialFilters] = useState<Partial<TransactionFiltersState>>({});

  const handleFinanceNavigate = useCallback((tab: FinanceTab, filter?: { type?: 'income' | 'expense'; status?: 'pending' }) => {
    if (filter) {
      const newFilters: Partial<TransactionFiltersState> = {};
      if (filter.type) newFilters.type = filter.type;
      if (filter.status) newFilters.status = filter.status;
      setTransactionInitialFilters(newFilters);
    } else {
      setTransactionInitialFilters({});
    }
    setActiveTab(tab);
  }, []);

  const handleAccountCardClick = useCallback((account: FinanceAccount) => {
    setTransactionInitialFilters({ accountId: account.id });
    setActiveTab('transactions');
  }, []);

  const {
    accounts, categories, transactions, transactionsByDate,
    monthStats, totalBalance, isLoading,
    addTransaction, updateTransaction, deleteTransaction,
    toggleTransactionPaid, addAccount, updateAccount, deleteAccount,
    updateRecurringTransaction, reorderTransactions, updateTransactionDate,
    refetch, undo, redo, canUndo, canRedo
  } = usePersonalFinance(selectedMonth);

  const {
    expensesByCategory, incomeByCategory, dailyExpenses, dailyIncome,
    getSubcategoryStats, getSupplierStats, getEmployeeStats
  } = useFinanceStats(transactions, categories);

  const handleAddTransaction = (type: TransactionType) => {
    setEditingTransaction(null);
    setTransactionType(type);
    setTransactionSheetOpen(true);
  };

  const handleTransactionClick = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    setTransactionType(transaction.type);
    setTransactionSheetOpen(true);
  };

  const handleSaveTransaction = async (data: Parameters<typeof addTransaction>[0]) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await addTransaction(data);
    }
  };

  const handleRefreshCategories = async () => { await refetch(); };
  const handleRefreshAll = async () => { await refetch(); };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
      <header className="page-header-bar">
        <div className="page-header-content">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canUndo} onClick={undo}>
              <Undo2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canRedo} onClick={redo}>
              <Redo2 className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="page-title">Finanças Pessoais</h1>
        </div>
      </header>
      <div>
        {activeTab === 'home' && (
          <FinanceHome
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            accounts={accounts}
            totalBalance={totalBalance}
            monthStats={monthStats}
            onNavigate={handleFinanceNavigate}
            onAccountClick={handleAccountCardClick}
            variant="personal"
          />
        )}

        {activeTab === 'transactions' && (
          <FinanceTransactions
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            transactionsByDate={transactionsByDate}
            monthStats={monthStats}
            onTransactionClick={handleTransactionClick}
            onTogglePaid={toggleTransactionPaid}
            onDeleteTransaction={deleteTransaction}
            onReorderTransactions={reorderTransactions}
            categories={categories}
            accounts={accounts}
            initialFilters={transactionInitialFilters}
          />
        )}

        {activeTab === 'charts' && (
          <FinanceCharts
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            expensesByCategory={expensesByCategory}
            incomeByCategory={incomeByCategory}
            dailyExpenses={dailyExpenses}
            dailyIncome={dailyIncome}
            getSubcategoryStats={getSubcategoryStats}
            getSupplierStats={getSupplierStats}
            getEmployeeStats={getEmployeeStats}
            transactions={transactions}
            categories={categories}
          />
        )}

        {activeTab === 'planning' && (
          <FinancePlanning
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            totalBalance={totalBalance}
            categories={categories}
            transactions={transactions}
          />
        )}

        {activeTab === 'more' && (
          <FinanceMore
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            selectedMonth={selectedMonth}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onRefreshCategories={handleRefreshCategories}
            onRefreshAll={handleRefreshAll}
          />
        )}
      </div>
      </div>

      <FinanceBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTransaction={handleAddTransaction}
        variant="personal"
      />

      <TransactionSheet
        open={transactionSheetOpen}
        onOpenChange={setTransactionSheetOpen}
        defaultType={transactionType}
        categories={categories}
        accounts={accounts}
        suppliers={[]}
        employees={[]}
        onSave={handleSaveTransaction}
        onDelete={deleteTransaction}
        editingTransaction={editingTransaction}
        onUpdateRecurring={updateRecurringTransaction}
        onRefreshCategories={handleRefreshCategories}
        allTransactions={transactions}
      />

      <AccountManagement
        open={accountManagementOpen}
        onOpenChange={setAccountManagementOpen}
        accounts={accounts}
        onAdd={addAccount}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
      />
    </AppLayout>
  );
}
