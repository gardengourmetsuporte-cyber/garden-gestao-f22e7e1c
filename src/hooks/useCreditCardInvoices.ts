import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCardInvoice, FinanceAccount, FinanceTransaction } from '@/types/finance';
import { toast } from 'sonner';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

export function useCreditCardInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('credit_card_invoices')
      .select(`
        *,
        account:finance_accounts!credit_card_invoices_account_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }
    
    setInvoices((data || []) as unknown as CreditCardInvoice[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getOrCreateInvoice = async (
    accountId: string, 
    purchaseDate: Date,
    closingDay: number = 25,
    dueDay: number = 5
  ): Promise<CreditCardInvoice | null> => {
    if (!user) return null;

    // Calculate which invoice this purchase belongs to
    const purchaseDayOfMonth = purchaseDate.getDate();
    let invoiceMonth = purchaseDate;
    
    // If purchase is after closing day, it goes to next month's invoice
    if (purchaseDayOfMonth > closingDay) {
      invoiceMonth = addMonths(purchaseDate, 1);
    }
    
    // Calculate dates
    const closeDate = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth(), closingDay);
    const dueDate = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth() + 1, dueDay);
    
    const closeDateStr = format(closeDate, 'yyyy-MM-dd');
    const dueDateStr = format(dueDate, 'yyyy-MM-dd');

    // Check if invoice already exists
    const { data: existing } = await supabase
      .from('credit_card_invoices')
      .select('*')
      .eq('account_id', accountId)
      .eq('due_date', dueDateStr)
      .single();
    
    if (existing) {
      return existing as CreditCardInvoice;
    }

    // Create new invoice
    const { data: newInvoice, error } = await supabase
      .from('credit_card_invoices')
      .insert({
        user_id: user.id,
        account_id: accountId,
        close_date: closeDateStr,
        due_date: dueDateStr,
        total_amount: 0,
        is_paid: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      toast.error('Erro ao criar fatura');
      return null;
    }

    await fetchInvoices();
    return newInvoice as CreditCardInvoice;
  };

  const payInvoice = async (invoiceId: string, fromAccountId: string) => {
    if (!user) return;

    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    // Update invoice as paid
    const { error: invoiceError } = await supabase
      .from('credit_card_invoices')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        paid_from_account_id: fromAccountId
      })
      .eq('id', invoiceId);

    if (invoiceError) {
      toast.error('Erro ao pagar fatura');
      return;
    }

    // Create expense transaction from the paying account
    const { error: txError } = await supabase
      .from('finance_transactions')
      .insert({
        user_id: user.id,
        type: 'expense',
        amount: invoice.total_amount,
        description: `Pagamento fatura cartão - ${format(new Date(invoice.due_date), 'MMM/yyyy')}`,
        account_id: fromAccountId,
        date: format(new Date(), 'yyyy-MM-dd'),
        is_paid: true,
        is_fixed: false,
        is_recurring: false
      });

    if (txError) {
      console.error('Error creating payment transaction:', txError);
    }

    // Mark all transactions in the invoice as paid
    await supabase
      .from('finance_transactions')
      .update({ is_paid: true })
      .eq('credit_card_invoice_id', invoiceId);

    await fetchInvoices();
  };

  const getInvoiceTransactions = async (invoiceId: string): Promise<FinanceTransaction[]> => {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select(`
        *,
        category:finance_categories(*)
      `)
      .eq('credit_card_invoice_id', invoiceId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching invoice transactions:', error);
      return [];
    }

    return (data || []) as FinanceTransaction[];
  };

  const deleteInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('credit_card_invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      toast.error('Erro ao excluir fatura');
      return;
    }

    await fetchInvoices();
  };

  return {
    invoices,
    isLoading,
    fetchInvoices,
    getOrCreateInvoice,
    payInvoice,
    getInvoiceTransactions,
    deleteInvoice
  };
}
