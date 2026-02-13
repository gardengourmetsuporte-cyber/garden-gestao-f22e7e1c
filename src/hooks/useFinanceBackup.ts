import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { FinanceAccount, FinanceTransaction } from '@/types/finance';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface FinanceSnapshot {
  id: string;
  user_id: string;
  unit_id: string | null;
  name: string;
  accounts_data: any[];
  transactions_data: any[];
  total_balance: number;
  month: string;
  created_at: string;
}

export interface AccountComparison {
  name: string;
  snapshotBalance: number;
  currentBalance: number;
  difference: number;
}

const MAX_SNAPSHOTS = 10;

export function useFinanceBackup(
  accounts: FinanceAccount[],
  transactions: FinanceTransaction[],
  selectedMonth: Date,
  onRefresh: () => Promise<void>
) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [snapshots, setSnapshots] = useState<FinanceSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('finance_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (activeUnitId) query = query.eq('unit_id', activeUnitId);
      const { data, error } = await query;
      if (error) throw error;
      setSnapshots((data || []) as FinanceSnapshot[]);
    } catch (err) {
      console.error('Error fetching snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeUnitId]);

  const createSnapshot = useCallback(async (name: string) => {
    if (!user) return;
    setIsCreating(true);
    try {
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      const accountsData = accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        color: a.color,
        icon: a.icon,
      }));
      const transactionsData = transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category_id: t.category_id,
        account_id: t.account_id,
        to_account_id: t.to_account_id,
        supplier_id: t.supplier_id,
        employee_id: t.employee_id,
        date: t.date,
        is_paid: t.is_paid,
        is_fixed: t.is_fixed,
        is_recurring: t.is_recurring,
        recurring_interval: t.recurring_interval,
        tags: t.tags,
        notes: t.notes,
        sort_order: t.sort_order,
        credit_card_invoice_id: t.credit_card_invoice_id,
        installment_number: t.installment_number,
        total_installments: t.total_installments,
        installment_group_id: t.installment_group_id,
      }));

      const monthDate = format(selectedMonth, 'yyyy-MM-01');

      // Enforce max snapshots limit
      if (snapshots.length >= MAX_SNAPSHOTS) {
        const oldest = snapshots[snapshots.length - 1];
        await supabase.from('finance_snapshots').delete().eq('id', oldest.id);
      }

      const { error } = await supabase.from('finance_snapshots').insert({
        user_id: user.id,
        unit_id: activeUnitId,
        name: name || `Backup ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        accounts_data: accountsData,
        transactions_data: transactionsData,
        total_balance: totalBalance,
        month: monthDate,
      });

      if (error) throw error;
      toast.success('Backup criado com sucesso!');
      await fetchSnapshots();
    } catch (err) {
      console.error('Error creating snapshot:', err);
      toast.error('Erro ao criar backup');
    } finally {
      setIsCreating(false);
    }
  }, [user, activeUnitId, accounts, transactions, selectedMonth, snapshots, fetchSnapshots]);

  const compareSnapshot = useCallback((snapshot: FinanceSnapshot): AccountComparison[] => {
    const snapshotAccounts = snapshot.accounts_data as any[];
    const allAccountIds = new Set([
      ...snapshotAccounts.map((a: any) => a.id),
      ...accounts.map(a => a.id),
    ]);

    return Array.from(allAccountIds).map(id => {
      const snapshotAcc = snapshotAccounts.find((a: any) => a.id === id);
      const currentAcc = accounts.find(a => a.id === id);
      const snapshotBalance = snapshotAcc?.balance || 0;
      const currentBalance = currentAcc?.balance || 0;
      return {
        name: snapshotAcc?.name || currentAcc?.name || 'Conta removida',
        snapshotBalance,
        currentBalance,
        difference: currentBalance - snapshotBalance,
      };
    });
  }, [accounts]);

  const restoreSnapshot = useCallback(async (snapshot: FinanceSnapshot) => {
    if (!user) return;
    setIsRestoring(true);
    try {
      // 1. Auto-backup current state before restoring
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      await supabase.from('finance_snapshots').insert({
        user_id: user.id,
        unit_id: activeUnitId,
        name: `Auto-backup antes de restauração ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        accounts_data: accounts.map(a => ({
          id: a.id, name: a.name, type: a.type, balance: a.balance, color: a.color, icon: a.icon,
        })),
        transactions_data: transactions.map(t => ({
          id: t.id, type: t.type, amount: t.amount, description: t.description,
          category_id: t.category_id, account_id: t.account_id, to_account_id: t.to_account_id,
          date: t.date, is_paid: t.is_paid, is_fixed: t.is_fixed, is_recurring: t.is_recurring,
          recurring_interval: t.recurring_interval, tags: t.tags, notes: t.notes, sort_order: t.sort_order,
          supplier_id: t.supplier_id, employee_id: t.employee_id,
          credit_card_invoice_id: t.credit_card_invoice_id, installment_number: t.installment_number,
          total_installments: t.total_installments, installment_group_id: t.installment_group_id,
        })),
        total_balance: totalBalance,
        month: format(selectedMonth, 'yyyy-MM-01'),
      });

      // 2. Delete current month transactions (triggers will revert account balances)
      const txIds = transactions.map(t => t.id);
      if (txIds.length > 0) {
        const { error: delError } = await supabase
          .from('finance_transactions')
          .delete()
          .in('id', txIds);
        if (delError) throw delError;
      }

      // 3. Restore account balances directly
      const snapshotAccounts = snapshot.accounts_data as any[];
      for (const acc of snapshotAccounts) {
        const currentAcc = accounts.find(a => a.id === acc.id);
        if (currentAcc) {
          await supabase
            .from('finance_accounts')
            .update({ balance: acc.balance })
            .eq('id', acc.id);
        }
      }

      // 4. Re-insert snapshot transactions
      const snapshotTxs = snapshot.transactions_data as any[];
      if (snapshotTxs.length > 0) {
        // Insert without is_paid first to avoid trigger, then update
        for (const tx of snapshotTxs) {
          await supabase.from('finance_transactions').insert({
            user_id: user.id,
            unit_id: activeUnitId,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            category_id: tx.category_id,
            account_id: tx.account_id,
            to_account_id: tx.to_account_id,
            supplier_id: tx.supplier_id,
            employee_id: tx.employee_id,
            date: tx.date,
            is_paid: tx.is_paid,
            is_fixed: tx.is_fixed,
            is_recurring: tx.is_recurring,
            recurring_interval: tx.recurring_interval,
            tags: tx.tags,
            notes: tx.notes,
            sort_order: tx.sort_order,
            credit_card_invoice_id: tx.credit_card_invoice_id,
            installment_number: tx.installment_number,
            total_installments: tx.total_installments,
            installment_group_id: tx.installment_group_id,
          });
        }

        // After all inserts (triggers changed balances), force correct balance
        for (const acc of snapshotAccounts) {
          const currentAcc = accounts.find(a => a.id === acc.id);
          if (currentAcc) {
            await supabase
              .from('finance_accounts')
              .update({ balance: acc.balance })
              .eq('id', acc.id);
          }
        }
      }

      toast.success('Restauração concluída! Dados revertidos ao backup.');
      await onRefresh();
      await fetchSnapshots();
    } catch (err) {
      console.error('Error restoring snapshot:', err);
      toast.error('Erro ao restaurar backup');
    } finally {
      setIsRestoring(false);
    }
  }, [user, activeUnitId, accounts, transactions, selectedMonth, onRefresh, fetchSnapshots]);

  const deleteSnapshot = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('finance_snapshots').delete().eq('id', id);
      if (error) throw error;
      toast.success('Backup excluído');
      await fetchSnapshots();
    } catch (err) {
      toast.error('Erro ao excluir backup');
    }
  }, [fetchSnapshots]);

  return {
    snapshots,
    isLoading,
    isCreating,
    isRestoring,
    fetchSnapshots,
    createSnapshot,
    compareSnapshot,
    restoreSnapshot,
    deleteSnapshot,
  };
}
