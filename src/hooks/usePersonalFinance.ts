import { useMemo, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FinanceAccount, 
  FinanceCategory, 
  FinanceTransaction, 
  TransactionFormData,
  MonthlyStats,
  RecurringEditMode,
  DEFAULT_PERSONAL_EXPENSE_CATEGORIES,
  DEFAULT_PERSONAL_INCOME_CATEGORIES
} from '@/types/finance';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';


export type { RecurringEditMode };

// ---- Fetch helpers (unit_id IS NULL) ----

async function fetchAccountsData(userId: string) {
  const { data } = await supabase
    .from('finance_accounts')
    .select('*')
    .eq('user_id', userId)
    .is('unit_id', null)
    .eq('is_active', true)
    .order('created_at');
  return (data || []) as FinanceAccount[];
}

async function fetchCategoriesData(userId: string) {
  const { data } = await supabase
    .from('finance_categories')
    .select('*')
    .eq('user_id', userId)
    .is('unit_id', null)
    .order('sort_order');

  const all = (data || []) as FinanceCategory[];
  const parents = all.filter(c => !c.parent_id);
  return parents.map(parent => ({
    ...parent,
    subcategories: all.filter(c => c.parent_id === parent.id)
  }));
}

async function fetchTransactionsData(userId: string, month: Date) {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

  const { data } = await supabase
    .from('finance_transactions')
    .select(`
      *,
      category:finance_categories(*),
      account:finance_accounts!finance_transactions_account_id_fkey(*),
      to_account:finance_accounts!finance_transactions_to_account_id_fkey(*)
    `)
    .eq('user_id', userId)
    .is('unit_id', null)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return (data || []) as FinanceTransaction[];
}

async function initializePersonalDefaults(userId: string) {
  // Check existing personal accounts
  const { data: existingAccounts } = await supabase
    .from('finance_accounts')
    .select('id')
    .eq('user_id', userId)
    .is('unit_id', null)
    .limit(1);

  if (!existingAccounts || existingAccounts.length === 0) {
    await supabase.from('finance_accounts').insert({
      user_id: userId,
      name: 'Carteira Pessoal',
      type: 'wallet',
      balance: 0,
      color: '#8b5cf6',
      icon: 'Wallet',
      unit_id: null,
    });
  }

  // Check existing personal categories
  const { data: existingCategories } = await supabase
    .from('finance_categories')
    .select('id')
    .eq('user_id', userId)
    .is('unit_id', null)
    .limit(1);

  if (!existingCategories || existingCategories.length === 0) {
    for (let i = 0; i < DEFAULT_PERSONAL_EXPENSE_CATEGORIES.length; i++) {
      const cat = DEFAULT_PERSONAL_EXPENSE_CATEGORIES[i];
      const { data: parentData } = await supabase
        .from('finance_categories')
        .insert({
          user_id: userId, name: cat.name, type: 'expense',
          icon: cat.icon, color: cat.color, is_system: true, sort_order: i,
          unit_id: null,
        })
        .select().single();

      if (parentData && cat.subcategories.length > 0) {
        const subs = cat.subcategories.map((name, j) => ({
          user_id: userId, name, type: 'expense',
          icon: cat.icon, color: cat.color,
          parent_id: parentData.id, is_system: true, sort_order: j,
          unit_id: null,
        }));
        await supabase.from('finance_categories').insert(subs);
      }
    }

    for (let i = 0; i < DEFAULT_PERSONAL_INCOME_CATEGORIES.length; i++) {
      const cat = DEFAULT_PERSONAL_INCOME_CATEGORIES[i];
      const { data: parentData } = await supabase
        .from('finance_categories')
        .insert({
          user_id: userId, name: cat.name, type: 'income',
          icon: cat.icon, color: cat.color, is_system: true, sort_order: i,
          unit_id: null,
        })
        .select().single();

      if (parentData && cat.subcategories.length > 0) {
        const subs = cat.subcategories.map((name, j) => ({
          user_id: userId, name, type: 'income',
          icon: cat.icon, color: cat.color,
          parent_id: parentData.id, is_system: true, sort_order: j,
          unit_id: null,
        }));
        await supabase.from('finance_categories').insert(subs);
      }
    }
  }
}

// ---- Hook ----

export function usePersonalFinance(selectedMonth: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const defaultsInitializedRef = useRef(false);
  const monthKey = format(selectedMonth, 'yyyy-MM');

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['personal-finance-accounts', userId],
    queryFn: () => fetchAccountsData(userId!),
    enabled: !!userId,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['personal-finance-categories', userId],
    queryFn: () => fetchCategoriesData(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userId && !defaultsInitializedRef.current) {
      defaultsInitializedRef.current = true;
      initializePersonalDefaults(userId).catch(console.error);
    }
  }, [userId]);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['personal-finance-transactions', userId, monthKey],
    queryFn: () => fetchTransactionsData(userId!, selectedMonth),
    enabled: !!userId,
  });

  const isLoading = loadingAccounts || loadingCategories || loadingTransactions;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['personal-finance-accounts', userId] });
    queryClient.invalidateQueries({ queryKey: ['personal-finance-categories', userId] });
    queryClient.invalidateQueries({ queryKey: ['personal-finance-transactions', userId, monthKey] });
  }, [queryClient, userId, monthKey]);

  const invalidateTransactionsAndAccounts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['personal-finance-accounts', userId] });
    queryClient.invalidateQueries({ queryKey: ['personal-finance-transactions', userId, monthKey] });
  }, [queryClient, userId, monthKey]);

  // -- Mutations --
  const addTransactionMut = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const { error } = await supabase.from('finance_transactions').insert({
        ...data,
        user_id: userId!,
        unit_id: null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateTransactionsAndAccounts(),
    onError: () => toast.error('Erro ao salvar transação'),
  });

  const updateTransactionMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      const { error } = await supabase.from('finance_transactions').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTransactionsAndAccounts(),
    onError: () => toast.error('Erro ao atualizar transação'),
  });

  const deleteTransactionMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTransactionsAndAccounts(),
    onError: () => toast.error('Erro ao excluir transação'),
  });

  const togglePaidMut = useMutation({
    mutationFn: async ({ id, isPaid }: { id: string; isPaid: boolean }) => {
      const { error } = await supabase.from('finance_transactions').update({ is_paid: isPaid }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTransactionsAndAccounts(),
    onError: () => toast.error('Erro ao atualizar transação'),
  });

  const addAccountMut = useMutation({
    mutationFn: async (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('finance_accounts').insert({
        ...data, user_id: userId!, unit_id: null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-finance-accounts', userId] }),
    onError: () => toast.error('Erro ao criar conta'),
  });

  const updateAccountMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceAccount> }) => {
      const { error } = await supabase.from('finance_accounts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-finance-accounts', userId] }),
    onError: () => toast.error('Erro ao atualizar conta'),
  });

  const deleteAccountMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_accounts').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-finance-accounts', userId] }),
    onError: () => toast.error('Erro ao excluir conta'),
  });

  const updateRecurringTransaction = useCallback(async (id: string, data: Partial<TransactionFormData>, mode: RecurringEditMode) => {
    const { data: transaction } = await supabase
      .from('finance_transactions').select('*').eq('id', id).single();

    if (!transaction) {
      toast.error('Transação não encontrada');
      return;
    }

    const groupId = transaction.installment_group_id;
    const cleanDesc = data.description ? data.description.replace(/\s*\(\d+\/\d+\)$/, '') : undefined;
    const sharedUpdate = {
      amount: data.amount, description: cleanDesc,
      category_id: data.category_id, account_id: data.account_id,
      is_fixed: data.is_fixed, notes: data.notes
    };

    let error;
    if (mode === 'single' || !groupId) {
      ({ error } = await supabase.from('finance_transactions').update(data).eq('id', id));
    } else if (mode === 'pending') {
      ({ error } = await supabase.from('finance_transactions').update(sharedUpdate)
        .eq('installment_group_id', groupId).eq('is_paid', false));
    } else {
      ({ error } = await supabase.from('finance_transactions').update(sharedUpdate)
        .eq('installment_group_id', groupId));
    }

    if (error) {
      toast.error('Erro ao atualizar transação');
      return;
    }
    invalidateTransactionsAndAccounts();
  }, [invalidateTransactionsAndAccounts]);

  const reorderTransactions = useCallback(async (dateStr: string, orderedIds: string[]) => {
    queryClient.setQueryData<FinanceTransaction[]>(
      ['personal-finance-transactions', userId, monthKey],
      (old) => {
        if (!old) return old;
        return old.map(t => {
          const newOrder = orderedIds.indexOf(t.id);
          if (newOrder !== -1) return { ...t, sort_order: newOrder };
          return t;
        });
      }
    );

    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('finance_transactions').update({ sort_order: index }).eq('id', id)
        )
      );
    } catch {
      toast.error('Erro ao salvar ordem');
      invalidateTransactionsAndAccounts();
    }
  }, [queryClient, userId, monthKey, invalidateTransactionsAndAccounts]);

  const updateTransactionDate = useCallback(async (id: string, newDate: string) => {
    queryClient.setQueryData<FinanceTransaction[]>(
      ['personal-finance-transactions', userId, monthKey],
      (old) => old?.map(t => t.id === id ? { ...t, date: newDate } : t)
    );

    const { error } = await supabase.from('finance_transactions').update({ date: newDate }).eq('id', id);
    if (error) {
      toast.error('Erro ao mover transação');
      invalidateTransactionsAndAccounts();
    }
  }, [queryClient, userId, monthKey, invalidateTransactionsAndAccounts]);

  const monthStats: MonthlyStats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income' && t.is_paid).reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid).reduce((s, t) => s + Number(t.amount), 0);
    const pendingExpenses = transactions.filter(t => (t.type === 'expense' || t.type === 'credit_card') && !t.is_paid).reduce((s, t) => s + Number(t.amount), 0);
    const pendingIncome = transactions.filter(t => t.type === 'income' && !t.is_paid).reduce((s, t) => s + Number(t.amount), 0);
    return { totalIncome: income, totalExpense: expense, balance: income - expense, pendingExpenses, pendingIncome };
  }, [transactions]);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + Number(a.balance), 0), [accounts]);

  const transactionsByDate = useMemo(() => {
    const grouped: Record<string, FinanceTransaction[]> = {};
    transactions.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    Object.values(grouped).forEach(txns => txns.sort((a, b) => {
      const diff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (diff !== 0) return diff;
      return a.created_at.localeCompare(b.created_at);
    }));
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
    addTransaction: (data: TransactionFormData) => addTransactionMut.mutateAsync(data),
    updateTransaction: (id: string, data: Partial<TransactionFormData>) => updateTransactionMut.mutateAsync({ id, data }),
    deleteTransaction: (id: string) => deleteTransactionMut.mutateAsync(id),
    toggleTransactionPaid: (id: string, isPaid: boolean) => togglePaidMut.mutateAsync({ id, isPaid }),
    addAccount: (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => addAccountMut.mutateAsync(data),
    updateAccount: (id: string, data: Partial<FinanceAccount>) => updateAccountMut.mutateAsync({ id, data }),
    deleteAccount: (id: string) => deleteAccountMut.mutateAsync(id),
    updateRecurringTransaction,
    reorderTransactions,
    updateTransactionDate,
    refetch: invalidateAll,
  };
}
