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
} from '@/types/finance';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';
import { useUndoRedo, UndoAction } from './useUndoRedo';

// ---- Shared fetch helpers ----

async function fetchAccountsCore(userId: string, unitId: string | null, isPersonal: boolean) {
  let query = supabase
    .from('finance_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at');
  if (isPersonal) query = query.is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);
  const { data } = await query;
  return (data || []) as FinanceAccount[];
}

async function fetchCategoriesCore(userId: string, unitId: string | null, isPersonal: boolean) {
  let query = supabase
    .from('finance_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');
  if (isPersonal) query = query.is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);
  const { data } = await query;

  const all = (data || []) as FinanceCategory[];
  const parents = all.filter(c => !c.parent_id);
  return parents.map(parent => ({
    ...parent,
    subcategories: all.filter(c => c.parent_id === parent.id),
  }));
}

async function fetchTransactionsCore(userId: string, unitId: string | null, isPersonal: boolean, month: Date) {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

  const selectStr = isPersonal
    ? `*, category:finance_categories(*), account:finance_accounts!finance_transactions_account_id_fkey(*), to_account:finance_accounts!finance_transactions_to_account_id_fkey(*)`
    : `*, category:finance_categories(*), account:finance_accounts!finance_transactions_account_id_fkey(*), to_account:finance_accounts!finance_transactions_to_account_id_fkey(*), supplier:suppliers!finance_transactions_supplier_id_fkey(id, name), employee:employees!finance_transactions_employee_id_fkey(id, full_name)`;

  let query = supabase
    .from('finance_transactions')
    .select(selectStr)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (isPersonal) query = query.is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);
  const { data } = await query;
  return (data || []) as unknown as FinanceTransaction[];
}

// ---- Core options ----

interface UseFinanceCoreOptions {
  selectedMonth: Date;
  unitId: string | null;
  isPersonal: boolean;
  defaultCategories: {
    expense: { name: string; icon: string; color: string; subcategories: string[] }[];
    income: { name: string; icon: string; color: string; subcategories: string[] }[];
  };
  queryKeyPrefix: string;
}

export function useFinanceCore({
  selectedMonth,
  unitId,
  isPersonal,
  defaultCategories,
  queryKeyPrefix,
}: UseFinanceCoreOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const defaultsInitializedRef = useRef(false);
  const monthKey = format(selectedMonth, 'yyyy-MM');

  const effectiveUnitId = isPersonal ? null : unitId;
  const undoRedo = useUndoRedo();
  const accountsKey = [queryKeyPrefix + '-accounts', userId, effectiveUnitId];
  const categoriesKey = [queryKeyPrefix + '-categories', userId, effectiveUnitId];
  const transactionsKey = [queryKeyPrefix + '-transactions', userId, effectiveUnitId, monthKey];

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: accountsKey,
    queryFn: () => fetchAccountsCore(userId!, effectiveUnitId, isPersonal),
    enabled: !!userId,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: categoriesKey,
    queryFn: () => fetchCategoriesCore(userId!, effectiveUnitId, isPersonal),
    enabled: !!userId,
  });

  // Initialize defaults once
  useEffect(() => {
    if (userId && !defaultsInitializedRef.current) {
      defaultsInitializedRef.current = true;
      initializeDefaultsCore(userId, effectiveUnitId, defaultCategories).catch(console.error);
    }
  }, [userId]);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: transactionsKey,
    queryFn: () => fetchTransactionsCore(userId!, effectiveUnitId, isPersonal, selectedMonth),
    enabled: !!userId,
  });

  const isLoading = loadingAccounts || loadingCategories || loadingTransactions;

  const accountsKeyStr = accountsKey.join('|');
  const categoriesKeyStr = categoriesKey.join('|');
  const transactionsKeyStr = transactionsKey.join('|');

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: accountsKey });
    queryClient.invalidateQueries({ queryKey: categoriesKey });
    queryClient.invalidateQueries({ queryKey: transactionsKey });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, accountsKeyStr, categoriesKeyStr, transactionsKeyStr]);

  const invalidateTransactionsAndAccounts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: accountsKey });
    queryClient.invalidateQueries({ queryKey: transactionsKey });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, accountsKeyStr, transactionsKeyStr]);

  // -- Mutations --
  const addTransactionMut = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const { error } = await supabase.from('finance_transactions').insert({
        ...data, user_id: userId!, unit_id: effectiveUnitId,
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
    onMutate: async ({ id, isPaid }) => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previous = queryClient.getQueryData<FinanceTransaction[]>(transactionsKey);
      queryClient.setQueryData<FinanceTransaction[]>(transactionsKey, (old) =>
        old?.map(t => (t.id === id ? { ...t, is_paid: isPaid } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(transactionsKey, context.previous);
      toast.error('Erro ao atualizar transação');
    },
    onSettled: () => invalidateTransactionsAndAccounts(),
  });

  const addAccountMut = useMutation({
    mutationFn: async (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('finance_accounts').insert({
        ...data, user_id: userId!, unit_id: effectiveUnitId,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
    onError: () => toast.error('Erro ao criar conta'),
  });

  const updateAccountMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceAccount> }) => {
      const { error } = await supabase.from('finance_accounts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
    onError: () => toast.error('Erro ao atualizar conta'),
  });

  const deleteAccountMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_accounts').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
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
      is_fixed: data.is_fixed, notes: data.notes,
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

  // Batch reorder using RPC
  const reorderTransactions = useCallback(async (_dateStr: string, orderedIds: string[]) => {
    queryClient.setQueryData<FinanceTransaction[]>(transactionsKey, (old) => {
      if (!old) return old;
      return old.map(t => {
        const newOrder = orderedIds.indexOf(t.id);
        if (newOrder !== -1) return { ...t, sort_order: newOrder };
        return t;
      });
    });

    try {
      const orders = orderedIds.map((_, i) => i);
      const { error } = await supabase.rpc('batch_reorder_transactions', {
        p_ids: orderedIds,
        p_orders: orders,
      });
      if (error) throw error;
    } catch {
      toast.error('Erro ao salvar ordem');
      invalidateTransactionsAndAccounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, transactionsKeyStr, invalidateTransactionsAndAccounts]);

  const updateTransactionDate = useCallback(async (id: string, newDate: string) => {
    queryClient.setQueryData<FinanceTransaction[]>(transactionsKey, (old) =>
      old?.map(t => (t.id === id ? { ...t, date: newDate } : t))
    );

    const { error } = await supabase.from('finance_transactions').update({ date: newDate }).eq('id', id);
    if (error) {
      toast.error('Erro ao mover transação');
      invalidateTransactionsAndAccounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, transactionsKeyStr, invalidateTransactionsAndAccounts]);

  // Computed
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
    Object.values(grouped).forEach(txns =>
      txns.sort((a, b) => {
        const diff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (diff !== 0) return diff;
        return a.created_at.localeCompare(b.created_at);
      })
    );
    return grouped;
  }, [transactions]);

  // ---- Undo / Redo executors ----

  const executeUndoAction = useCallback(async (action: UndoAction, isRedo: boolean) => {
    try {
      switch (action.type) {
        case 'create': {
          if (isRedo) {
            // Redo create = re-insert
            const { error } = await supabase.from('finance_transactions').insert({
              ...action.data, user_id: userId!, unit_id: effectiveUnitId,
            });
            if (error) throw error;
          } else {
            // Undo create = delete
            const { error } = await supabase.from('finance_transactions').delete().eq('id', action.transactionId);
            if (error) throw error;
          }
          break;
        }
        case 'delete': {
          if (isRedo) {
            // Redo delete = delete again
            const { error } = await supabase.from('finance_transactions').delete().eq('id', action.transactionId);
            if (error) throw error;
          } else {
            // Undo delete = re-insert from snapshot
            const { id, category, account, to_account, supplier, employee, ...rest } = action.snapshot;
            const { error } = await supabase.from('finance_transactions').insert({ ...rest, id });
            if (error) throw error;
          }
          break;
        }
        case 'update': {
          const dataToApply = isRedo ? action.after : action.before;
          const { error } = await supabase.from('finance_transactions').update(dataToApply).eq('id', action.transactionId);
          if (error) throw error;
          break;
        }
        case 'toggle_paid': {
          const newPaid = isRedo ? !action.wasPaid : action.wasPaid;
          const { error } = await supabase.from('finance_transactions').update({ is_paid: newPaid }).eq('id', action.transactionId);
          if (error) throw error;
          break;
        }
      }
      invalidateTransactionsAndAccounts();
    } catch {
      toast.error('Erro ao desfazer/refazer');
      invalidateTransactionsAndAccounts();
    }
  }, [userId, effectiveUnitId, invalidateTransactionsAndAccounts]);

  const handleUndo = useCallback(async () => {
    const action = undoRedo.popUndo();
    if (!action) return;
    undoRedo.pushToRedo(action);
    await executeUndoAction(action, false);
    toast.success('Lançamento desfeito');
  }, [undoRedo, executeUndoAction]);

  const handleRedo = useCallback(async () => {
    const action = undoRedo.popRedo();
    if (!action) return;
    undoRedo.pushToUndo(action);
    await executeUndoAction(action, true);
    toast.success('Lançamento refeito');
  }, [undoRedo, executeUndoAction]);

  // Wrapped mutation helpers that push to undo stack
  const addTransactionWithUndo = useCallback(async (data: TransactionFormData) => {
    const { data: inserted, error } = await supabase.from('finance_transactions').insert({
      ...data, user_id: userId!, unit_id: effectiveUnitId,
    }).select('id').single();
    if (error) { toast.error('Erro ao salvar transação'); throw error; }
    undoRedo.pushAction({ type: 'create', transactionId: inserted.id, data });
    invalidateTransactionsAndAccounts();
  }, [userId, effectiveUnitId, undoRedo, invalidateTransactionsAndAccounts]);

  const updateTransactionWithUndo = useCallback(async (id: string, data: Partial<TransactionFormData>) => {
    // Fetch current state for "before" snapshot
    const current = transactions.find(t => t.id === id);
    const before: Partial<TransactionFormData> = {};
    if (current) {
      for (const key of Object.keys(data) as (keyof TransactionFormData)[]) {
        (before as any)[key] = (current as any)[key];
      }
    }
    const { error } = await supabase.from('finance_transactions').update(data).eq('id', id);
    if (error) { toast.error('Erro ao atualizar transação'); throw error; }
    if (current) {
      undoRedo.pushAction({ type: 'update', transactionId: id, before, after: data });
    }
    invalidateTransactionsAndAccounts();
  }, [transactions, undoRedo, invalidateTransactionsAndAccounts]);

  const deleteTransactionWithUndo = useCallback(async (id: string) => {
    const snapshot = transactions.find(t => t.id === id);
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir transação'); throw error; }
    if (snapshot) {
      undoRedo.pushAction({ type: 'delete', transactionId: id, snapshot });
    }
    invalidateTransactionsAndAccounts();
  }, [transactions, undoRedo, invalidateTransactionsAndAccounts]);

  const togglePaidWithUndo = useCallback(async (id: string, isPaid: boolean) => {
    const current = transactions.find(t => t.id === id);
    undoRedo.pushAction({ type: 'toggle_paid', transactionId: id, wasPaid: current?.is_paid ?? !isPaid });
    await togglePaidMut.mutateAsync({ id, isPaid });
  }, [transactions, undoRedo, togglePaidMut]);

  return {
    accounts,
    categories,
    transactions,
    transactionsByDate,
    monthStats,
    totalBalance,
    isLoading,
    addTransaction: addTransactionWithUndo,
    updateTransaction: updateTransactionWithUndo,
    deleteTransaction: deleteTransactionWithUndo,
    toggleTransactionPaid: togglePaidWithUndo,
    addAccount: (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => addAccountMut.mutateAsync(data),
    updateAccount: (id: string, data: Partial<FinanceAccount>) => updateAccountMut.mutateAsync({ id, data }),
    deleteAccount: (id: string) => deleteAccountMut.mutateAsync(id),
    updateRecurringTransaction,
    reorderTransactions,
    updateTransactionDate,
    refetch: invalidateAll,
    // Undo/Redo
    undo: handleUndo,
    redo: handleRedo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
  };
}

// ---- Default initialization ----

async function initializeDefaultsCore(
  userId: string,
  unitId: string | null,
  cats: { expense: { name: string; icon: string; color: string; subcategories: string[] }[]; income: { name: string; icon: string; color: string; subcategories: string[] }[] }
) {
  let accQuery = supabase.from('finance_accounts').select('id').eq('user_id', userId).limit(1);
  if (unitId) accQuery = accQuery.eq('unit_id', unitId);
  else accQuery = accQuery.is('unit_id', null);
  const { data: existingAccounts } = await accQuery;

  if (!existingAccounts || existingAccounts.length === 0) {
    await supabase.from('finance_accounts').upsert({
      user_id: userId,
      name: unitId ? 'Carteira' : 'Carteira Pessoal',
      type: 'wallet',
      balance: 0,
      color: unitId ? '#3b82f6' : '#8b5cf6',
      icon: 'Wallet',
      unit_id: unitId,
    }, { onConflict: 'user_id,unit_id,name,type', ignoreDuplicates: true });
  }

  let catQuery = supabase.from('finance_categories').select('id').eq('user_id', userId).limit(1);
  if (unitId) catQuery = catQuery.eq('unit_id', unitId);
  else catQuery = catQuery.is('unit_id', null);
  const { data: existingCategories } = await catQuery;

  if (!existingCategories || existingCategories.length === 0) {
    for (const [type, list] of [['expense', cats.expense], ['income', cats.income]] as const) {
      for (let i = 0; i < list.length; i++) {
        const cat = list[i];
        const { data: parentData } = await supabase
          .from('finance_categories')
          .insert({
            user_id: userId, name: cat.name, type,
            icon: cat.icon, color: cat.color, is_system: true, sort_order: i,
            unit_id: unitId,
          })
          .select()
          .single();

        if (parentData && cat.subcategories.length > 0) {
          const subs = cat.subcategories.map((name, j) => ({
            user_id: userId, name, type,
            icon: cat.icon, color: cat.color,
            parent_id: parentData.id, is_system: true, sort_order: j,
            unit_id: unitId,
          }));
          await supabase.from('finance_categories').insert(subs);
        }
      }
    }
  }
}
