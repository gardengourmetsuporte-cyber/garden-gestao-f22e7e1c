import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FinanceBottomNav } from '@/components/finance/FinanceBottomNav';
import { FinanceHome } from '@/components/finance/FinanceHome';
import { FinanceTransactions } from '@/components/finance/FinanceTransactions';
import { FinanceCharts } from '@/components/finance/FinanceCharts';
import { FinanceMore } from '@/components/finance/FinanceMore';
import { TransactionSheet } from '@/components/finance/TransactionSheet';
import { AccountManagement } from '@/components/finance/AccountManagement';
import { useFinance } from '@/hooks/useFinance';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useEmployees } from '@/hooks/useEmployees';
import { FinanceTab, TransactionType, FinanceTransaction, TransactionFormData } from '@/types/finance';
import { Loader2 } from 'lucide-react';
import { RecurringEditMode } from '@/components/finance/TransactionSheet';

export default function Finance() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('home');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [accountManagementOpen, setAccountManagementOpen] = useState(false);

  const {
    accounts,
    categories,
    transactions,
    transactionsByDate,
    monthStats,
    totalBalance,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionPaid,
    addAccount,
    updateAccount,
    deleteAccount,
    updateRecurringTransaction,
    reorderTransactions,
    updateTransactionDate,
    refetch
  } = useFinance(selectedMonth);

  const {
    expensesByCategory,
    incomeByCategory,
    dailyExpenses,
    dailyIncome,
    getSubcategoryStats,
    getSupplierStats,
    getEmployeeStats
  } = useFinanceStats(transactions, categories);

  const { suppliers } = useSuppliers();
  const { employees } = useEmployees();


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

  const handleUpdateTransactionDate = async (id: string, newDate: string) => {
    await updateTransactionDate(id, newDate);
  };

  const handleRefreshCategories = async () => {
    await refetch();
  };

  const handleRefreshAll = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-20 lg:pb-20">
        {activeTab === 'home' && (
          <FinanceHome
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            accounts={accounts}
            totalBalance={totalBalance}
            monthStats={monthStats}
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
            onUpdateTransactionDate={handleUpdateTransactionDate}
            onReorderTransactions={reorderTransactions}
             categories={categories}
             accounts={accounts}
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
          />
        )}

        {activeTab === 'more' && (
          <FinanceMore
            accounts={accounts}
            categories={categories}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onRefreshCategories={handleRefreshCategories}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <FinanceBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTransaction={handleAddTransaction}
      />

      {/* Transaction Sheet */}
      <TransactionSheet
        open={transactionSheetOpen}
        onOpenChange={setTransactionSheetOpen}
        defaultType={transactionType}
        categories={categories}
        accounts={accounts}
        suppliers={suppliers}
        employees={employees}
        onSave={handleSaveTransaction}
        onDelete={deleteTransaction}
        editingTransaction={editingTransaction}
        onUpdateRecurring={updateRecurringTransaction}
        onRefreshCategories={handleRefreshCategories}
        allTransactions={transactions}
      />

      {/* Account Management from Home */}
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
