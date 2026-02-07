import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupplierInvoice } from '@/types/supplier';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useSupplierInvoices() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all supplier invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['supplier-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers(id, name, phone)
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as SupplierInvoice[];
    },
  });

  // Get pending invoices (not paid)
  const pendingInvoices = invoices.filter(inv => !inv.is_paid);
  
  // Get overdue invoices
  const overdueInvoices = invoices.filter(inv => {
    if (inv.is_paid) return false;
    return new Date(inv.due_date) < new Date();
  });

  // Add invoice and provision in finance (is_paid = false)
  const addInvoice = useMutation({
    mutationFn: async (invoice: {
      supplier_id: string;
      invoice_number?: string;
      description: string;
      amount: number;
      issue_date?: string;
      due_date: string;
      notes?: string;
    }): Promise<string> => {
      // Create supplier invoice
      // Busca nome do fornecedor
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', invoice.supplier_id)
        .single();
      
      const supplierName = supplierData?.name || 'Fornecedor';
      
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('supplier_invoices')
        .insert({
          ...invoice,
          user_id: user?.id,
        })
        .select('id')
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Create provisioned finance transaction (is_paid = false) - usa nome do fornecedor
      const { error: transError } = await supabase
        .from('finance_transactions')
        .insert({
          user_id: user?.id,
          type: 'expense',
          description: supplierName,
          amount: invoice.amount,
          date: invoice.due_date,
          supplier_id: invoice.supplier_id,
          is_paid: false,
          is_fixed: false,
        });
      
      if (transError) {
        console.error('Error creating finance transaction:', transError);
        // Don't fail if finance transaction fails - invoice was created
      }
      
      return invoiceData.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      toast.success('Boleto cadastrado e provisionado no financeiro!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar boleto');
    },
  });

  // Update invoice
  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SupplierInvoice> & { id: string }) => {
      const { error } = await supabase
        .from('supplier_invoices')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      toast.success('Boleto atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar boleto');
    },
  });

  // Delete invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      toast.success('Boleto removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover boleto');
    },
  });

  // Pay invoice and create finance transaction
  const payInvoiceWithTransaction = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      accountId,
      categoryId 
    }: { 
      invoiceId: string; 
      accountId: string;
      categoryId?: string;
    }) => {
      // Get invoice details
      const { data: invoice, error: fetchError } = await supabase
        .from('supplier_invoices')
        .select('*, supplier:suppliers(name)')
        .eq('id', invoiceId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const description = `${invoice.description} - ${invoice.supplier.name}`;
      
      // Create finance transaction
      const { data: transaction, error: transError } = await supabase
        .from('finance_transactions')
        .insert({
          user_id: user?.id,
          type: 'expense',
          description,
          amount: invoice.amount,
          date: new Date().toISOString().split('T')[0],
          account_id: accountId,
          category_id: categoryId,
          supplier_id: invoice.supplier_id,
          is_paid: true,
          is_fixed: false,
        })
        .select('id')
        .single();
      
      if (transError) throw transError;
      
      // Update invoice with transaction id
      const { error: updateError } = await supabase
        .from('supplier_invoices')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
          finance_transaction_id: transaction.id,
        })
        .eq('id', invoiceId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      toast.success('Boleto pago e lançado no financeiro!');
    },
    onError: () => {
      toast.error('Erro ao pagar boleto');
    },
  });

  return {
    invoices,
    pendingInvoices,
    overdueInvoices,
    isLoading,
    addInvoice: addInvoice.mutateAsync,
    updateInvoice: updateInvoice.mutateAsync,
    deleteInvoice: deleteInvoice.mutateAsync,
    payInvoiceWithTransaction: payInvoiceWithTransaction.mutateAsync,
  };
}
