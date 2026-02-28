import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { CashClosing, CashClosingFormData } from '@/types/cashClosing';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PaymentSetting {
  method_key: string;
  settlement_type: 'immediate' | 'business_days' | 'weekly_day';
  settlement_days: number;
  settlement_day_of_week: number | null;
  fee_percentage: number;
  create_transaction: boolean;
}

// ---- Fetch helper (eliminates N+1) ----

async function fetchClosingsData(userId: string, unitId: string, isAdmin: boolean) {
  const { data, error } = await supabase
    .from('cash_closings' as any)
    .select('*')
    .eq('unit_id', unitId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  const closings = (data || []) as any[];

  // Batch profile fetch — single query for all unique user IDs
  const allUserIds = new Set<string>();
  closings.forEach(c => {
    allUserIds.add(c.user_id);
    if (c.validated_by) allUserIds.add(c.validated_by);
  });

  const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
  if (allUserIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', [...allUserIds]);
    (profiles || []).forEach(p => profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
  }

  return closings.map(c => ({
    ...c,
    profile: profileMap.get(c.user_id) || null,
    validator_profile: c.validated_by ? profileMap.get(c.validated_by) || null : null,
  })) as CashClosing[];
}

// ---- Hook ----

export function useCashClosing() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['cash-closings', activeUnitId];

  const { data: closings = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchClosingsData(user!.id, activeUnitId!, isAdmin),
    enabled: !!user && !!activeUnitId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('cash-receipts').upload(fileName, file);
    if (error) {
      toast.error('Erro ao enviar comprovante');
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('cash-receipts').getPublicUrl(fileName);
    return publicUrl;
  };

  const createClosingMut = useMutation({
    mutationFn: async (formData: CashClosingFormData) => {
      const { error } = await supabase
        .from('cash_closings' as any)
        .insert({
          date: formData.date, unit_name: formData.unit_name, unit_id: activeUnitId,
          initial_cash: formData.initial_cash, cash_amount: formData.cash_amount,
          debit_amount: formData.debit_amount, credit_amount: formData.credit_amount,
          pix_amount: formData.pix_amount, meal_voucher_amount: formData.meal_voucher_amount || 0,
          delivery_amount: formData.delivery_amount, signed_account_amount: formData.signed_account_amount || 0, cash_difference: formData.cash_difference,
          receipt_url: formData.receipt_url || '', notes: formData.notes,
          expenses: formData.expenses || [], user_id: user!.id,
        } as any);
      if (error) {
        if (error.code === '23505') throw new Error('Já existe um fechamento para esta data e unidade');
        throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Fechamento de caixa enviado com sucesso! ✅');
    },
    onError: (err: Error) => {
      console.error('Cash closing error:', err);
      toast.error(err.message || 'Erro ao enviar fechamento. Tente novamente.');
    },
  });

  const createClosing = async (formData: CashClosingFormData) => {
    try {
      await createClosingMut.mutateAsync(formData);
      return true;
    } catch {
      return false;
    }
  };

  const approveClosing = async (closingId: string) => {
    if (!user || !isAdmin) return false;
    try {
      const { error: updateError } = await supabase
        .from('cash_closings' as any)
        .update({ status: 'approved', validated_by: user.id, validated_at: new Date().toISOString() } as any)
        .eq('id', closingId);
      if (updateError) throw updateError;

      const closing = closings.find(c => c.id === closingId);
      if (closing && !closing.financial_integrated) {
        await integrateWithFinancial(closing);
      }
      invalidate();
      return true;
    } catch {
      toast.error('Erro ao aprovar fechamento');
      return false;
    }
  };

  const markDivergent = async (closingId: string, notes: string) => {
    if (!user || !isAdmin) return false;
    try {
      const { error } = await supabase
        .from('cash_closings' as any)
        .update({ status: 'divergent', validated_by: user.id, validated_at: new Date().toISOString(), validation_notes: notes } as any)
        .eq('id', closingId);
      if (error) throw error;
      invalidate();
      return true;
    } catch {
      toast.error('Erro ao marcar divergência');
      return false;
    }
  };

  const deleteClosing = async (closingId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('cash_closings' as any).delete().eq('id', closingId);
      if (error) throw error;
      invalidate();
      toast.success('Fechamento excluído');
      return true;
    } catch {
      toast.error('Erro ao excluir fechamento');
      return false;
    }
  };

  const updateClosing = async (closingId: string, data: Partial<CashClosingFormData>) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('cash_closings' as any)
        .update(data as any)
        .eq('id', closingId);
      if (error) throw error;
      invalidate();
      toast.success('Fechamento atualizado');
      return true;
    } catch {
      toast.error('Erro ao atualizar fechamento');
      return false;
    }
  };

  const checkChecklistCompleted = async (date: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const query = supabase.from('checklist_items').select('id')
        .eq('checklist_type', 'fechamento').eq('is_active', true).is('deleted_at', null);
      if (activeUnitId) query.eq('unit_id', activeUnitId);
      const { data: items } = await query;
      if (!items || items.length === 0) return true;

      const { data: completions } = await supabase
        .from('checklist_completions').select('item_id')
        .eq('date', date).eq('checklist_type', 'fechamento').eq('completed_by', user.id);

      const completedIds = new Set(completions?.map(c => c.item_id) || []);
      return items.every(item => completedIds.has(item.id));
    } catch {
      return true;
    }
  };

  // ---- Financial integration (unchanged logic) ----
  const integrateWithFinancial = async (closing: CashClosing) => {
    if (!user || !activeUnitId) return;

    try {
      const { data: paymentSettings } = await supabase
        .from('payment_method_settings' as any).select('*').eq('user_id', user.id);

      const getPaymentSetting = (methodKey: string): PaymentSetting | null => {
        const setting = (paymentSettings as unknown as PaymentSetting[] || []).find(s => s.method_key === methodKey);
        return setting || null;
      };

      const categoryQuery = supabase
        .from('finance_categories').select('*').eq('user_id', user.id).eq('type', 'income');
      if (activeUnitId) categoryQuery.eq('unit_id', activeUnitId);
      const { data: categories } = await categoryQuery;

      const { data: accounts } = await supabase
        .from('finance_accounts').select('*').eq('user_id', user.id).eq('is_active', true);

      const carteiraAccount = accounts?.find(a => a.name.toLowerCase().includes('carteira') || a.type === 'wallet');
      const itauAccount = accounts?.find(a => a.name.toLowerCase().includes('itaú') || a.name.toLowerCase().includes('itau'));
      const carteiraAccountId = carteiraAccount?.id || accounts?.[0]?.id || null;
      const bankAccountId = itauAccount?.id || accounts?.[0]?.id || null;

      const balcaoCategory = categories?.find(c => c.name === 'Vendas Balcão' && !c.parent_id);
      const deliveryCategory = categories?.find(c => c.name === 'Vendas Delivery' && !c.parent_id);

      const dinheiroSubcat = categories?.find(c => c.name.toLowerCase() === 'dinheiro');
      const debitoSubcat = categories?.find(c => c.name.toLowerCase() === 'cartão débito' || c.name.toLowerCase() === 'débito');
      const creditoSubcat = categories?.find(c => c.name.toLowerCase() === 'cartão crédito' || c.name.toLowerCase() === 'crédito');
      const pixSubcat = categories?.find(c => c.name.toLowerCase() === 'pix');
      const voucherSubcat = categories?.find(c => c.name.toLowerCase() === 'vale alimentação' || c.name.toLowerCase() === 'vale refeição');
      const ifoodSubcat = categories?.find(c => c.name.toLowerCase() === 'ifood' || c.name.toLowerCase() === 'delivery');

      const transactions: any[] = [];

      const formatDateLabel = (dateStr: string): string => {
        const [, month, day] = dateStr.split('-');
        return `${day}/${month}`;
      };

      const addBusinessDays = (dateStr: string, days: number): string => {
        if (days === 0) return dateStr;
        const date = new Date(dateStr + 'T12:00:00');
        let added = 0;
        while (added < days) {
          date.setDate(date.getDate() + 1);
          const dayOfWeek = date.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) added++;
        }
        return format(date, 'yyyy-MM-dd');
      };

      const getNextDayOfWeek = (dateStr: string, targetDay: number): string => {
        const date = new Date(dateStr + 'T12:00:00');
        const currentDay = date.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilTarget);
        return format(date, 'yyyy-MM-dd');
      };

      const calculateSettlementDate = (baseDate: string, setting: PaymentSetting | null): { date: string; isPaid: boolean } => {
        if (!setting) return { date: baseDate, isPaid: true };
        switch (setting.settlement_type) {
          case 'immediate': return { date: baseDate, isPaid: true };
          case 'business_days': return { date: addBusinessDays(baseDate, setting.settlement_days), isPaid: false };
          case 'weekly_day': return { date: getNextDayOfWeek(baseDate, setting.settlement_day_of_week ?? 3), isPaid: false };
          default: return { date: baseDate, isPaid: true };
        }
      };

      const applyFee = (amount: number, setting: PaymentSetting | null): number => {
        if (!setting || setting.fee_percentage === 0) return amount;
        return amount * (1 - setting.fee_percentage / 100);
      };

      // Helper to get expense fee category
      const getFeeCategoryId = async (parentName: string, subName: string) => {
        const { data: expCategories } = await supabase
          .from('finance_categories').select('*').eq('user_id', user.id).eq('type', 'expense');
        const parent = expCategories?.find(c => c.name === parentName && !c.parent_id);
        const sub = expCategories?.find(c => c.name === subName && c.parent_id === parent?.id);
        return { parentId: parent?.id || null, subId: sub?.id || null };
      };

      const addIncomeTx = (amount: number, desc: string, catId: string | null, accId: string | null, setting: PaymentSetting | null) => {
        const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, setting);
        transactions.push({
          user_id: user.id, unit_id: activeUnitId, type: 'income',
          amount, description: desc, category_id: catId, account_id: accId,
          date: settlementDate, is_paid: isPaid,
          notes: `Fechamento de caixa${setting?.fee_percentage ? ` (taxa: ${setting.fee_percentage}%)` : ''}`,
        });
      };

      const addFeeTx = async (grossAmount: number, feePercent: number, desc: string, accId: string | null, setting: PaymentSetting | null) => {
        const feeAmount = grossAmount * (feePercent / 100);
        if (feeAmount <= 0) return;
        const { parentId, subId } = await getFeeCategoryId('Taxas Operacionais', 'Maquininha');
        const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, setting);
        transactions.push({
          user_id: user.id, unit_id: activeUnitId, type: 'expense',
          amount: feeAmount, description: desc, category_id: subId || parentId,
          account_id: accId, date: settlementDate, is_paid: isPaid,
          notes: `Taxa automática sobre R$ ${grossAmount.toFixed(2)}`,
        });
      };

      // Cash
      if (closing.cash_amount > 0 && getPaymentSetting('cash_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('cash_amount');
        addIncomeTx(applyFee(closing.cash_amount, s), `Dinheiro (${formatDateLabel(closing.date)})`, dinheiroSubcat?.id || balcaoCategory?.id || null, carteiraAccountId, s);
      }

      // Debit
      if (closing.debit_amount > 0 && getPaymentSetting('debit_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('debit_amount');
        const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, s);
        transactions.push({
          user_id: user.id, unit_id: activeUnitId, type: 'income',
          amount: closing.debit_amount, description: `Débito (${formatDateLabel(closing.date)})`,
          category_id: debitoSubcat?.id || balcaoCategory?.id || null, account_id: bankAccountId,
          date: settlementDate, is_paid: isPaid, notes: 'Fechamento de caixa',
        });
        if (s?.fee_percentage) await addFeeTx(closing.debit_amount, s.fee_percentage, `Taxa Débito - ${s.fee_percentage}% (${formatDateLabel(closing.date)})`, bankAccountId, s);
      }

      // Credit
      if (closing.credit_amount > 0 && getPaymentSetting('credit_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('credit_amount');
        const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, s);
        transactions.push({
          user_id: user.id, unit_id: activeUnitId, type: 'income',
          amount: closing.credit_amount, description: `Crédito (${formatDateLabel(closing.date)})`,
          category_id: creditoSubcat?.id || balcaoCategory?.id || null, account_id: bankAccountId,
          date: settlementDate, is_paid: isPaid, notes: 'Fechamento de caixa',
        });
        if (s?.fee_percentage) await addFeeTx(closing.credit_amount, s.fee_percentage, `Taxa Crédito - ${s.fee_percentage}% (${formatDateLabel(closing.date)})`, bankAccountId, s);
      }

      // Pix
      if (closing.pix_amount > 0 && getPaymentSetting('pix_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('pix_amount');
        addIncomeTx(applyFee(closing.pix_amount, s), `Pix (${formatDateLabel(closing.date)})`, pixSubcat?.id || balcaoCategory?.id || null, bankAccountId, s);
      }

      // Meal voucher
      if (closing.meal_voucher_amount && closing.meal_voucher_amount > 0 && getPaymentSetting('meal_voucher_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('meal_voucher_amount');
        addIncomeTx(applyFee(closing.meal_voucher_amount, s), `Vale Alimentação (${formatDateLabel(closing.date)})`, voucherSubcat?.id || balcaoCategory?.id || null, bankAccountId, s);
      }

      // Delivery
      if (closing.delivery_amount > 0 && getPaymentSetting('delivery_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('delivery_amount');
        const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, s);
        transactions.push({
          user_id: user.id, unit_id: activeUnitId, type: 'income',
          amount: closing.delivery_amount, description: `Delivery (${formatDateLabel(closing.date)})`,
          category_id: ifoodSubcat?.id || deliveryCategory?.id || null, account_id: bankAccountId,
          date: settlementDate, is_paid: isPaid, notes: 'Fechamento de caixa',
        });
        if (s?.fee_percentage) {
          const { parentId, subId } = await getFeeCategoryId('Taxas Operacionais', 'iFood');
          const deliveryFeeSubcat = subId || (await getFeeCategoryId('Taxas Operacionais', 'Delivery')).subId;
          const feeAmount = closing.delivery_amount * (s.fee_percentage / 100);
          if (feeAmount > 0) {
            transactions.push({
              user_id: user.id, unit_id: activeUnitId, type: 'expense',
              amount: feeAmount, description: `Taxa Delivery - ${s.fee_percentage}% (${formatDateLabel(closing.date)})`,
              category_id: deliveryFeeSubcat || parentId, account_id: bankAccountId,
              date: settlementDate, is_paid: isPaid,
              notes: `Taxa automática sobre R$ ${closing.delivery_amount.toFixed(2)}`,
            });
          }
        }
      }

      // Signed Account (Conta Assinada)
      if ((closing as any).signed_account_amount > 0 && getPaymentSetting('signed_account_amount')?.create_transaction !== false) {
        const s = getPaymentSetting('signed_account_amount');
        const signedSubcat = categories?.find(c => c.name.toLowerCase() === 'conta assinada');
        const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, s);
        transactions.push({
          user_id: user.id, unit_id: activeUnitId, type: 'income',
          amount: (closing as any).signed_account_amount, description: `Conta Assinada (${formatDateLabel(closing.date)})`,
          category_id: signedSubcat?.id || balcaoCategory?.id || null, account_id: bankAccountId,
          date: settlementDate, is_paid: isPaid, notes: 'Fechamento de caixa',
        });
      }

      // Expenses from closing
      if (closing.expenses && Array.isArray(closing.expenses)) {
        for (const expense of closing.expenses as any[]) {
          if (expense.amount && expense.amount > 0) {
            transactions.push({
              user_id: user.id, unit_id: activeUnitId, type: 'expense',
              amount: expense.amount, description: expense.description || 'Gasto do dia',
              category_id: null, account_id: carteiraAccountId,
              date: closing.date, is_paid: true,
              notes: 'Lançamento automático do fechamento de caixa',
            });
          }
        }
      }

      if (transactions.length > 0) {
        const { error: insertError } = await supabase.from('finance_transactions').insert(transactions);
        if (insertError) {
          console.error('Error inserting financial transactions:', insertError);
          toast.error('Erro ao criar lançamentos financeiros');
          return;
        }
      }

      await supabase.from('cash_closings' as any).update({ financial_integrated: true } as any).eq('id', closing.id);
      toast.success(`${transactions.length} lançamentos financeiros criados`, {
        action: {
          label: 'Ver no Financeiro',
          onClick: () => {
            window.location.href = '/finance';
          },
        },
      });
    } catch (error) {
      console.error('Error integrating with financial:', error);
      toast.error('Erro ao integrar com financeiro');
    }
  };

  return {
    closings, isLoading, uploadReceipt,
    createClosing, approveClosing, markDivergent,
    deleteClosing, updateClosing, checkChecklistCompleted,
    refetch: invalidate,
  };
}
