import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FinanceAccount, 
  FinanceCategory, 
  FinanceTransaction, 
  TransactionFormData,
  MonthlyStats,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
} from '@/types/finance';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';

export type RecurringEditMode = 'single' | 'pending' | 'all';

export function useFinance(selectedMonth: Date) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at');
    setAccounts((data || []) as FinanceAccount[]);
  }, [user]);

  // Fetch categories with hierarchy
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');
    
    // Build hierarchy
    const all = (data || []) as FinanceCategory[];
    const parents = all.filter(c => !c.parent_id);
    const withSubs = parents.map(parent => ({
      ...parent,
      subcategories: all.filter(c => c.parent_id === parent.id)
    }));
    setCategories(withSubs);
  }, [user]);

  // Fetch transactions for selected month
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('finance_transactions')
      .select(`
        *,
        category:finance_categories(*),
        account:finance_accounts!finance_transactions_account_id_fkey(*),
        to_account:finance_accounts!finance_transactions_to_account_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    
    setTransactions((data || []) as FinanceTransaction[]);
  }, [user, selectedMonth]);

  // Initialize default data if empty
  const initializeDefaults = useCallback(async () => {
    if (!user) return;
    
    // Check if user has accounts
    const { data: existingAccounts } = await supabase
      .from('finance_accounts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!existingAccounts || existingAccounts.length === 0) {
      // Create default account
      await supabase.from('finance_accounts').insert({
        user_id: user.id,
        name: 'Carteira',
        type: 'wallet',
        balance: 0,
        color: '#3b82f6',
        icon: 'Wallet'
      });
    }
    
    // Check if user has categories
    const { data: existingCategories } = await supabase
      .from('finance_categories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!existingCategories || existingCategories.length === 0) {
      // Create default expense categories
      for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
        const cat = DEFAULT_EXPENSE_CATEGORIES[i];
        const { data: parentData } = await supabase
          .from('finance_categories')
          .insert({
            user_id: user.id,
            name: cat.name,
            type: 'expense',
            icon: cat.icon,
            color: cat.color,
            is_system: true,
            sort_order: i
          })
          .select()
          .single();
        
        if (parentData && cat.subcategories.length > 0) {
          const subs = cat.subcategories.map((name, j) => ({
            user_id: user.id,
            name,
            type: 'expense',
            icon: cat.icon,
            color: cat.color,
            parent_id: parentData.id,
            is_system: true,
            sort_order: j
          }));
          await supabase.from('finance_categories').insert(subs);
        }
      }
      
      // Create default income categories
      for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
        const cat = DEFAULT_INCOME_CATEGORIES[i];
        const { data: parentData } = await supabase
          .from('finance_categories')
          .insert({
            user_id: user.id,
            name: cat.name,
            type: 'income',
            icon: cat.icon,
            color: cat.color,
            is_system: true,
            sort_order: i
          })
          .select()
          .single();
        
        if (parentData && cat.subcategories.length > 0) {
          const subs = cat.subcategories.map((name, j) => ({
            user_id: user.id,
            name,
            type: 'income',
            icon: cat.icon,
            color: cat.color,
            parent_id: parentData.id,
            is_system: true,
            sort_order: j
          }));
          await supabase.from('finance_categories').insert(subs);
        }
      }
    }
  }, [user]);

  // Initial load - only initialize defaults once
  useEffect(() => {
    async function load() {
      if (!user || initialized) return;
      setIsLoading(true);
      setInitialized(true);
      await initializeDefaults();
      await Promise.all([fetchAccounts(), fetchCategories(), fetchTransactions()]);
      setIsLoading(false);
    }
    load();
  }, [user, initialized]);

  // Refetch transactions when month changes (only after initial load)
  useEffect(() => {
    if (initialized && user) {
      fetchTransactions();
    }
  }, [selectedMonth]);

  // CRUD Operations
  const addTransaction = async (data: TransactionFormData) => {
    if (!user) return;
    const { error } = await supabase.from('finance_transactions').insert({
      ...data,
      user_id: user.id,
    });
    if (error) {
      toast.error('Erro ao salvar transação');
      return;
    }
    // Silent success - no toast
    await Promise.all([fetchTransactions(), fetchAccounts()]);
  };

  const updateTransaction = async (id: string, data: Partial<TransactionFormData>) => {
    const { error } = await supabase
      .from('finance_transactions')
      .update(data)
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar transação');
      return;
    }
    // Silent success - no toast
    await Promise.all([fetchTransactions(), fetchAccounts()]);
  };

  const updateRecurringTransaction = async (id: string, data: Partial<TransactionFormData>, mode: RecurringEditMode) => {
    // First get the transaction to find its group
    const { data: transaction } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!transaction) {
      toast.error('Transação não encontrada');
      return;
    }
    
    const groupId = transaction.installment_group_id;
    
    if (mode === 'single' || !groupId) {
      // Update only this transaction
      const { error } = await supabase
        .from('finance_transactions')
        .update(data)
        .eq('id', id);
      if (error) {
        toast.error('Erro ao atualizar transação');
        return;
      }
      // Silent success
    } else if (mode === 'pending') {
      // Update all pending (is_paid = false) transactions in the group
      const { error } = await supabase
        .from('finance_transactions')
        .update({
          amount: data.amount,
          description: data.description ? data.description.replace(/\s*\(\d+\/\d+\)$/, '') : undefined,
          category_id: data.category_id,
          account_id: data.account_id,
          is_fixed: data.is_fixed,
          notes: data.notes
        })
        .eq('installment_group_id', groupId)
        .eq('is_paid', false);
      if (error) {
        toast.error('Erro ao atualizar transações pendentes');
        return;
      }
      // Silent success
    } else if (mode === 'all') {
      // Update all transactions in the group
      const { error } = await supabase
        .from('finance_transactions')
        .update({
          amount: data.amount,
          description: data.description ? data.description.replace(/\s*\(\d+\/\d+\)$/, '') : undefined,
          category_id: data.category_id,
          account_id: data.account_id,
          is_fixed: data.is_fixed,
          notes: data.notes
        })
        .eq('installment_group_id', groupId);
      if (error) {
        toast.error('Erro ao atualizar todas as transações');
        return;
      }
      // Silent success
    }
    
    await Promise.all([fetchTransactions(), fetchAccounts()]);
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Erro ao excluir transação');
      return;
    }
    // Silent success
    await Promise.all([fetchTransactions(), fetchAccounts()]);
  };

  const toggleTransactionPaid = async (id: string, isPaid: boolean) => {
    const { error } = await supabase
      .from('finance_transactions')
      .update({ is_paid: isPaid })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar transação');
      return;
    }
    await Promise.all([fetchTransactions(), fetchAccounts()]);
  };
  const addAccount = async (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('finance_accounts').insert({
      ...data,
      user_id: user.id,
    });
    if (error) {
      toast.error('Erro ao criar conta');
      return;
    }
    await fetchAccounts();
  };

  const updateAccount = async (id: string, data: Partial<FinanceAccount>) => {
    const { error } = await supabase
      .from('finance_accounts')
      .update(data)
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar conta');
      return;
    }
    await fetchAccounts();
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from('finance_accounts')
      .update({ is_active: false })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao excluir conta');
      return;
    }
    await fetchAccounts();
  };

  // Computed stats
  const monthStats: MonthlyStats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expense = transactions
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pendingExpenses = transactions
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && !t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pendingIncome = transactions
      .filter(t => t.type === 'income' && !t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      pendingExpenses,
      pendingIncome
    };
  }, [transactions]);

  // Total balance across all accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  }, [accounts]);

  // Transactions grouped by date
  const transactionsByDate = useMemo(() => {
    const grouped: Record<string, FinanceTransaction[]> = {};
    transactions.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return grouped;
  }, [transactions]);

  return {
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
    refetch: () => Promise.all([fetchAccounts(), fetchCategories(), fetchTransactions()]),
  };
}
