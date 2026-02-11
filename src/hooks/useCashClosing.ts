 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useUnit } from '@/contexts/UnitContext';
 import { CashClosing, CashClosingFormData, CashClosingStatus } from '@/types/cashClosing';
 import { format } from 'date-fns';
 import { toast } from 'sonner';
import { supabase as sb } from '@/integrations/supabase/client';

interface PaymentSetting {
  method_key: string;
  settlement_type: 'immediate' | 'business_days' | 'weekly_day';
  settlement_days: number;
  settlement_day_of_week: number | null;
  fee_percentage: number;
  create_transaction: boolean;
}
 
 export function useCashClosing() {
   const { user, isAdmin } = useAuth();
   const { activeUnitId } = useUnit();
   const [closings, setClosings] = useState<CashClosing[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchClosings = useCallback(async () => {
     if (!user) return;
     setIsLoading(true);
 
     try {
       // Use type assertion since types.ts doesn't have this table yet
       const { data, error } = await supabase
         .from('cash_closings' as any)
         .select('*')
         .order('date', { ascending: false })
         .order('created_at', { ascending: false });
 
       if (error) throw error;
 
       // Fetch profiles for each closing
       const closingsWithProfiles = await Promise.all(
         (data || []).map(async (closing: any) => {
           const { data: profile } = await supabase
             .from('profiles')
             .select('full_name, avatar_url')
             .eq('user_id', closing.user_id)
             .single();
 
           let validatorProfile = null;
           if (closing.validated_by) {
             const { data: vp } = await supabase
               .from('profiles')
               .select('full_name')
               .eq('user_id', closing.validated_by)
               .single();
             validatorProfile = vp;
           }
 
           return {
             ...closing,
             profile,
             validator_profile: validatorProfile,
           } as CashClosing;
         })
       );
 
       setClosings(closingsWithProfiles);
     } catch (error) {
       console.error('Error fetching closings:', error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchClosings();
   }, [fetchClosings]);
 
   const uploadReceipt = async (file: File): Promise<string | null> => {
     if (!user) return null;
 
     const fileExt = file.name.split('.').pop();
     const fileName = `${user.id}/${Date.now()}.${fileExt}`;
 
     const { error } = await supabase.storage
       .from('cash-receipts')
       .upload(fileName, file);
 
     if (error) {
       toast.error('Erro ao enviar comprovante');
       return null;
     }
 
     const { data: { publicUrl } } = supabase.storage
       .from('cash-receipts')
       .getPublicUrl(fileName);
 
     return publicUrl;
   };
 
   const createClosing = async (formData: CashClosingFormData) => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('cash_closings' as any)
         .insert({
          date: formData.date,
          unit_name: formData.unit_name,
       initial_cash: formData.initial_cash,
          cash_amount: formData.cash_amount,
          debit_amount: formData.debit_amount,
          credit_amount: formData.credit_amount,
          pix_amount: formData.pix_amount,
           meal_voucher_amount: formData.meal_voucher_amount || 0,
          delivery_amount: formData.delivery_amount,
          cash_difference: formData.cash_difference,
          receipt_url: formData.receipt_url || '',
          notes: formData.notes,
          expenses: formData.expenses || [],
           user_id: user.id,
         } as any);
 
       if (error) {
         if (error.code === '23505') {
           toast.error('Já existe um fechamento para esta data e unidade');
         } else {
           toast.error('Erro ao enviar fechamento');
         }
         return false;
       }
 
      await fetchClosings();
       return true;
     } catch {
       toast.error('Erro ao enviar fechamento');
       return false;
     }
   };
 
   const approveClosing = async (closingId: string) => {
     if (!user || !isAdmin) return false;
 
     try {
       // First, update the closing status
       const { error: updateError } = await supabase
         .from('cash_closings' as any)
         .update({
           status: 'approved',
           validated_by: user.id,
           validated_at: new Date().toISOString(),
         } as any)
         .eq('id', closingId);
 
       if (updateError) throw updateError;
 
       // Get the closing data to create financial transactions
       const closing = closings.find(c => c.id === closingId);
       if (closing && !closing.financial_integrated) {
         await integrateWithFinancial(closing);
       }
 
      await fetchClosings();
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
         .update({
           status: 'divergent',
           validated_by: user.id,
           validated_at: new Date().toISOString(),
           validation_notes: notes,
         } as any)
         .eq('id', closingId);
 
       if (error) throw error;
 
      await fetchClosings();
       return true;
     } catch {
       toast.error('Erro ao marcar divergência');
       return false;
     }
   };
 
   const integrateWithFinancial = async (closing: CashClosing) => {
     if (!user) return;
 
     try {
        // Fetch user's payment method settings
        const { data: paymentSettings } = await sb
          .from('payment_method_settings' as any)
          .select('*')
          .eq('user_id', user.id);

        const getPaymentSetting = (methodKey: string): PaymentSetting | null => {
          const setting = (paymentSettings as unknown as PaymentSetting[] || []).find(s => s.method_key === methodKey);
          return setting || null;
        };

       // Get user's income categories for each payment method
       const { data: categories } = await supabase
         .from('finance_categories')
         .select('*')
         .eq('user_id', user.id)
         .eq('type', 'income');
 
        // Get accounts - Carteira for cash, Itaú for others
        const { data: accounts } = await supabase
          .from('finance_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
  
        // Find specific accounts - busca flexível por nome
        const carteiraAccount = accounts?.find(a => 
          a.name.toLowerCase().includes('carteira') || a.type === 'wallet'
        );
        const itauAccount = accounts?.find(a => 
          a.name.toLowerCase().includes('itaú') || a.name.toLowerCase().includes('itau')
        );
        const carteiraAccountId = carteiraAccount?.id || accounts?.[0]?.id || null;
        const bankAccountId = itauAccount?.id || accounts?.[0]?.id || null;

        // Find main categories
        const balcaoCategory = categories?.find(c => c.name === 'Vendas Balcão' && !c.parent_id);
        const deliveryCategory = categories?.find(c => c.name === 'Vendas Delivery' && !c.parent_id);

        // Find specific subcategories for each payment method - busca por nome exato
        const dinheiroSubcat = categories?.find(c => c.name.toLowerCase() === 'dinheiro');
        const debitoSubcat = categories?.find(c => c.name.toLowerCase() === 'cartão débito' || c.name.toLowerCase() === 'débito');
        const creditoSubcat = categories?.find(c => c.name.toLowerCase() === 'cartão crédito' || c.name.toLowerCase() === 'crédito');
        const pixSubcat = categories?.find(c => c.name.toLowerCase() === 'pix');
        const voucherSubcat = categories?.find(c => c.name.toLowerCase() === 'vale alimentação' || c.name.toLowerCase() === 'vale refeição');
        const ifoodSubcat = categories?.find(c => c.name.toLowerCase() === 'ifood' || c.name.toLowerCase() === 'delivery');
 
       const transactions = [];

        // Helper functions for date calculations
       const addBusinessDays = (dateStr: string, days: number): string => {
          if (days === 0) return dateStr;
         const date = new Date(dateStr);
         let added = 0;
         while (added < days) {
           date.setDate(date.getDate() + 1);
           const dayOfWeek = date.getDay();
           if (dayOfWeek !== 0 && dayOfWeek !== 6) {
             added++;
           }
         }
         return format(date, 'yyyy-MM-dd');
       };
 
        const getNextDayOfWeek = (dateStr: string, targetDay: number): string => {
          const date = new Date(dateStr);
          const currentDay = date.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
          date.setDate(date.getDate() + daysUntilTarget);
          return format(date, 'yyyy-MM-dd');
        };

        const calculateSettlementDate = (baseDate: string, setting: PaymentSetting | null): { date: string; isPaid: boolean } => {
          if (!setting) return { date: baseDate, isPaid: true };

          switch (setting.settlement_type) {
            case 'immediate':
              return { date: baseDate, isPaid: true };
            case 'business_days':
              return { date: addBusinessDays(baseDate, setting.settlement_days), isPaid: false };
            case 'weekly_day':
              return { date: getNextDayOfWeek(baseDate, setting.settlement_day_of_week ?? 3), isPaid: false };
            default:
              return { date: baseDate, isPaid: true };
          }
        };

        const applyFee = (amount: number, setting: PaymentSetting | null): number => {
          if (!setting || setting.fee_percentage === 0) return amount;
          return amount * (1 - setting.fee_percentage / 100);
        };

       // Create income transactions for each payment method
       if (closing.cash_amount > 0 && (getPaymentSetting('cash_amount')?.create_transaction !== false)) {
          const cashSetting = getPaymentSetting('cash_amount');
          const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, cashSetting);
          const netAmount = applyFee(closing.cash_amount, cashSetting);

          transactions.push({
            user_id: user.id,
            type: 'income',
             amount: netAmount,
            description: `Dinheiro (${format(new Date(closing.date), 'dd/MM')})`,
            category_id: dinheiroSubcat?.id || balcaoCategory?.id || null,
            account_id: carteiraAccountId, // Dinheiro vai para Carteira
             date: settlementDate,
             is_paid: isPaid,
             notes: `Fechamento de caixa${cashSetting?.fee_percentage ? ` (taxa: ${cashSetting.fee_percentage}%)` : ''}`,
          });
       }
 
       if (closing.debit_amount > 0 && (getPaymentSetting('debit_amount')?.create_transaction !== false)) {
          const debitSetting = getPaymentSetting('debit_amount');
          const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, debitSetting);
          const feeAmount = debitSetting?.fee_percentage ? closing.debit_amount * (debitSetting.fee_percentage / 100) : 0;

           // Lançamento de entrada com valor bruto
           transactions.push({
             user_id: user.id,
             type: 'income',
             amount: closing.debit_amount,
             description: `Débito (${format(new Date(closing.date), 'dd/MM')})`,
             category_id: debitoSubcat?.id || balcaoCategory?.id || null,
             account_id: bankAccountId,
             date: settlementDate,
             is_paid: isPaid,
             notes: 'Fechamento de caixa',
           });

          // Lançamento de saída da taxa (se houver)
          if (feeAmount > 0) {
            // Get fee category (Taxas Operacionais > Maquininha)
            const { data: expCategories } = await supabase
              .from('finance_categories')
              .select('*')
              .eq('user_id', user.id)
              .eq('type', 'expense');
            
            const taxasCategory = expCategories?.find(c => c.name === 'Taxas Operacionais' && !c.parent_id);
            const maquininhaSubcat = expCategories?.find(c => c.name === 'Maquininha' && c.parent_id === taxasCategory?.id);

            transactions.push({
              user_id: user.id,
              type: 'expense',
              amount: feeAmount,
              description: `Taxa Débito - ${debitSetting?.fee_percentage}% (${format(new Date(closing.date), 'dd/MM')})`,
              category_id: maquininhaSubcat?.id || taxasCategory?.id || null,
              account_id: bankAccountId,
              date: settlementDate,
              is_paid: isPaid,
              notes: `Taxa automática sobre R$ ${closing.debit_amount.toFixed(2)}`,
            });
          }
        }
 
       if (closing.credit_amount > 0 && (getPaymentSetting('credit_amount')?.create_transaction !== false)) {
          const creditSetting = getPaymentSetting('credit_amount');
          const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, creditSetting);
          const feeAmount = creditSetting?.fee_percentage ? closing.credit_amount * (creditSetting.fee_percentage / 100) : 0;

           // Lançamento de entrada com valor bruto
           transactions.push({
             user_id: user.id,
             type: 'income',
             amount: closing.credit_amount,
             description: `Crédito (${format(new Date(closing.date), 'dd/MM')})`,
             category_id: creditoSubcat?.id || balcaoCategory?.id || null,
             account_id: bankAccountId,
             date: settlementDate,
             is_paid: isPaid,
             notes: 'Fechamento de caixa',
           });

          // Lançamento de saída da taxa (se houver)
          if (feeAmount > 0) {
            // Get fee category (Taxas Operacionais > Maquininha)
            const { data: expCategories } = await supabase
              .from('finance_categories')
              .select('*')
              .eq('user_id', user.id)
              .eq('type', 'expense');
            
            const taxasCategory = expCategories?.find(c => c.name === 'Taxas Operacionais' && !c.parent_id);
            const maquininhaSubcat = expCategories?.find(c => c.name === 'Maquininha' && c.parent_id === taxasCategory?.id);

            transactions.push({
              user_id: user.id,
              type: 'expense',
              amount: feeAmount,
              description: `Taxa Crédito - ${creditSetting?.fee_percentage}% (${format(new Date(closing.date), 'dd/MM')})`,
              category_id: maquininhaSubcat?.id || taxasCategory?.id || null,
              account_id: bankAccountId,
              date: settlementDate,
              is_paid: isPaid,
              notes: `Taxa automática sobre R$ ${closing.credit_amount.toFixed(2)}`,
            });
          }
        }
 
       if (closing.pix_amount > 0 && (getPaymentSetting('pix_amount')?.create_transaction !== false)) {
          const pixSetting = getPaymentSetting('pix_amount');
          const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, pixSetting);
          const netAmount = applyFee(closing.pix_amount, pixSetting);

          transactions.push({
            user_id: user.id,
            type: 'income',
             amount: netAmount,
            description: `Pix (${format(new Date(closing.date), 'dd/MM')})`,
            category_id: pixSubcat?.id || balcaoCategory?.id || null,
            account_id: bankAccountId,
             date: settlementDate,
             is_paid: isPaid,
             notes: `Fechamento de caixa${pixSetting?.fee_percentage ? ` (taxa: ${pixSetting.fee_percentage}%)` : ''}`,
          });
       }
 
        if (closing.meal_voucher_amount && closing.meal_voucher_amount > 0 && (getPaymentSetting('meal_voucher_amount')?.create_transaction !== false)) {
           const voucherSetting = getPaymentSetting('meal_voucher_amount');
           const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, voucherSetting);
           const netAmount = applyFee(closing.meal_voucher_amount, voucherSetting);

           transactions.push({
             user_id: user.id,
             type: 'income',
              amount: netAmount,
             description: `Vale Alimentação (${format(new Date(closing.date), 'dd/MM')})`,
             category_id: voucherSubcat?.id || balcaoCategory?.id || null,
             account_id: bankAccountId,
              date: settlementDate,
              is_paid: isPaid,
              notes: `Fechamento de caixa${voucherSetting?.fee_percentage ? ` (taxa: ${voucherSetting.fee_percentage}%)` : ''}`,
           });
        }

       if (closing.delivery_amount > 0 && (getPaymentSetting('delivery_amount')?.create_transaction !== false)) {
          const deliverySetting = getPaymentSetting('delivery_amount');
          const { date: settlementDate, isPaid } = calculateSettlementDate(closing.date, deliverySetting);
          const netAmount = applyFee(closing.delivery_amount, deliverySetting);

          transactions.push({
            user_id: user.id,
            type: 'income',
             amount: netAmount,
            description: `Delivery (${format(new Date(closing.date), 'dd/MM')})`,
            category_id: ifoodSubcat?.id || deliveryCategory?.id || null,
            account_id: bankAccountId,
             date: settlementDate,
             is_paid: isPaid,
             notes: `Fechamento de caixa${deliverySetting?.fee_percentage ? ` (taxa: ${deliverySetting.fee_percentage}%)` : ''}`,
          });
       }
 
       // Create expense transactions from cash closing expenses
       if (closing.expenses && Array.isArray(closing.expenses)) {
         // Get expense categories
         const { data: expenseCategories } = await supabase
           .from('finance_categories')
           .select('*')
           .eq('user_id', user.id)
           .eq('type', 'expense');
         
         for (const expense of closing.expenses as any[]) {
           if (expense.amount && expense.amount > 0) {
              transactions.push({
                user_id: user.id,
                type: 'expense',
                amount: expense.amount,
                description: expense.description || 'Gasto do dia',
                category_id: null, // Could be improved with category matching
                account_id: carteiraAccountId, // Gastos do dia saem da Carteira
                date: closing.date,
                is_paid: true,
                notes: 'Lançamento automático do fechamento de caixa',
              });
           }
         }
       }
 
       if (transactions.length > 0) {
         await supabase.from('finance_transactions').insert(transactions);
       }
 
       // Mark as integrated
       await supabase
         .from('cash_closings' as any)
         .update({ financial_integrated: true } as any)
         .eq('id', closing.id);
 
     } catch (error) {
       console.error('Error integrating with financial:', error);
     }
   };
 
   const deleteClosing = async (closingId: string) => {
     if (!user || !isAdmin) return false;
 
     try {
       const { error } = await supabase
         .from('cash_closings' as any)
         .delete()
         .eq('id', closingId);
 
       if (error) throw error;
 
      await fetchClosings();
       return true;
     } catch {
       toast.error('Erro ao excluir fechamento');
       return false;
     }
   };
 
    const checkChecklistCompleted = async (date: string): Promise<boolean> => {
     if (!user) return false;
 
     try {
       // Check if there are any checklist items for 'fechamento' type
       const { data: items } = await supabase
         .from('checklist_items')
         .select('id')
         .eq('checklist_type', 'fechamento')
         .eq('is_active', true)
         .is('deleted_at', null);
 
       if (!items || items.length === 0) {
         // No checklist items configured, allow closing
         return true;
       }
 
       // Check completions for today
        const { data: completions } = await supabase
         .from('checklist_completions')
         .select('item_id')
         .eq('date', date)
          .eq('checklist_type', 'fechamento')
          // checklist completions are user-scoped in the app
          .eq('completed_by', user.id);
 
       const completedIds = new Set(completions?.map(c => c.item_id) || []);
       const allCompleted = items.every(item => completedIds.has(item.id));
 
       return allCompleted;
     } catch {
       return true; // Allow on error
     }
   };
 
   return {
     closings,
     isLoading,
     uploadReceipt,
     createClosing,
     approveClosing,
     markDivergent,
     deleteClosing,
     checkChecklistCompleted,
     refetch: fetchClosings,
   };
 }