import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface CashRegister {
  id: string;
  unit_id: string;
  opened_by: string;
  opened_at: string;
  initial_cash: number;
  closed_by: string | null;
  closed_at: string | null;
  final_cash: number | null;
  cash_difference: number | null;
  total_cash: number;
  total_debit: number;
  total_credit: number;
  total_pix: number;
  total_meal_voucher: number;
  total_delivery: number;
  total_signed_account: number;
  total_sales: number;
  sales_count: number;
  status: string;
  cash_closing_id: string | null;
  notes: string | null;
}

export interface CashRegisterSummary {
  total_cash: number;
  total_debit: number;
  total_credit: number;
  total_pix: number;
  total_meal_voucher: number;
  total_delivery: number;
  total_signed_account: number;
  total_sales: number;
  sales_count: number;
}

const PAYMENT_METHOD_MAP: Record<string, keyof CashRegisterSummary> = {
  dinheiro: 'total_cash',
  debito: 'total_debit',
  credito: 'total_credit',
  pix: 'total_pix',
  vale_refeicao: 'total_meal_voucher',
  delivery: 'total_delivery',
  conta_assinada: 'total_signed_account',
};

export function useCashRegister(onFinancialIntegrate?: (closing: any) => Promise<void>) {
  const { activeUnitId, activeUnit } = useUnit();
  const { user } = useAuth();
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOpen = currentRegister?.status === 'open';

  // Fetch current open register
  const fetchCurrentRegister = useCallback(async () => {
    if (!activeUnitId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('pos_cash_registers')
      .select('*')
      .eq('unit_id', activeUnitId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCurrentRegister(data as CashRegister | null);
    setLoading(false);
  }, [activeUnitId]);

  useEffect(() => { fetchCurrentRegister(); }, [fetchCurrentRegister]);

  // Open register
  const openRegister = useCallback(async (initialCash: number) => {
    if (!activeUnitId || !user?.id) return false;
    if (currentRegister?.status === 'open') {
      toast.error('Já existe um caixa aberto');
      return false;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('pos_cash_registers')
        .insert({
          unit_id: activeUnitId,
          opened_by: user.id,
          initial_cash: initialCash,
          status: 'open',
        })
        .select('*')
        .single();
      if (error) throw error;
      setCurrentRegister(data as CashRegister);
      toast.success('Caixa aberto!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao abrir caixa: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [activeUnitId, user, currentRegister]);

  // Fetch sales summary for the current register period
  const fetchSalesSummary = useCallback(async (): Promise<CashRegisterSummary> => {
    const empty: CashRegisterSummary = {
      total_cash: 0, total_debit: 0, total_credit: 0, total_pix: 0,
      total_meal_voucher: 0, total_delivery: 0, total_signed_account: 0,
      total_sales: 0, sales_count: 0,
    };
    if (!activeUnitId || !currentRegister) return empty;

    // Get sales made since register was opened
    const { data: sales } = await supabase
      .from('pos_sales')
      .select('id, total, status')
      .eq('unit_id', activeUnitId)
      .eq('status', 'paid')
      .gte('paid_at', currentRegister.opened_at);

    if (!sales || sales.length === 0) return empty;

    const saleIds = sales.map(s => s.id);
    const summary = { ...empty };
    summary.sales_count = sales.length;
    summary.total_sales = sales.reduce((s, sale) => s + (sale.total || 0), 0);

    // Get payments for these sales
    const { data: payments } = await supabase
      .from('pos_sale_payments')
      .select('method, amount')
      .in('sale_id', saleIds);

    (payments || []).forEach(p => {
      const key = PAYMENT_METHOD_MAP[p.method];
      if (key && key in summary) {
        (summary as any)[key] += p.amount || 0;
      }
    });

    return summary;
  }, [activeUnitId, currentRegister]);

  // Close register
  const closeRegister = useCallback(async (finalCash: number, notes?: string, expenses?: { description: string; amount: number }[]) => {
    if (!activeUnitId || !user?.id || !currentRegister) return false;
    setSaving(true);
    try {
      const summary = await fetchSalesSummary();
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const expectedCash = currentRegister.initial_cash + summary.total_cash - totalExpenses;
      const cashDifference = finalCash - expectedCash;

      // Update register
      const { error: regError } = await supabase
        .from('pos_cash_registers')
        .update({
          closed_by: user.id,
          closed_at: new Date().toISOString(),
          final_cash: finalCash,
          cash_difference: cashDifference,
          total_cash: summary.total_cash,
          total_debit: summary.total_debit,
          total_credit: summary.total_credit,
          total_pix: summary.total_pix,
          total_meal_voucher: summary.total_meal_voucher,
          total_delivery: summary.total_delivery,
          total_signed_account: summary.total_signed_account,
          total_sales: summary.total_sales,
          sales_count: summary.sales_count,
          status: 'closed',
          notes: notes || null,
        })
        .eq('id', currentRegister.id);
      if (regError) throw regError;

      // Create cash_closing record for approval
      const { data: closing, error: closingError } = await supabase
        .from('cash_closings')
        .insert({
          unit_id: activeUnitId,
          user_id: user.id,
          unit_name: activeUnit?.name || 'PDV',
          date: format(new Date(), 'yyyy-MM-dd'),
          initial_cash: currentRegister.initial_cash,
          cash_amount: summary.total_cash,
          debit_amount: summary.total_debit,
          credit_amount: summary.total_credit,
          pix_amount: summary.total_pix,
          meal_voucher_amount: summary.total_meal_voucher,
          delivery_amount: summary.total_delivery,
          signed_account_amount: summary.total_signed_account,
          cash_difference: cashDifference,
          receipt_url: '',
          status: 'pending',
          notes: notes ? `[PDV] ${notes}` : '[PDV] Fechamento automático via PDV',
          expenses: expenses && expenses.length > 0 ? expenses : null,
          financial_integrated: true,
        })
        .select('*')
        .single();

      if (closingError) throw closingError;

      // Link closing to register
      if (closing) {
        await supabase
          .from('pos_cash_registers')
          .update({ cash_closing_id: closing.id })
          .eq('id', currentRegister.id);

        // Trigger financial integration via callback
        if (onFinancialIntegrate) {
          try {
            await onFinancialIntegrate(closing as any);
          } catch (err) {
            console.error('Financial integration error (non-blocking):', err);
          }
        }
      }

      setCurrentRegister(null);
      toast.success('Caixa fechado e enviado para aprovação!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao fechar caixa: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [activeUnitId, user, currentRegister, activeUnit, fetchSalesSummary, onFinancialIntegrate]);

  return {
    currentRegister,
    isOpen,
    loading,
    saving,
    openRegister,
    closeRegister,
    fetchSalesSummary,
    fetchCurrentRegister,
  };
}
