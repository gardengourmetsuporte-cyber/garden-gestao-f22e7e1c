import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export type DocumentType = 'pix_receipt' | 'invoice' | 'boleto' | 'stock_exit' | 'payslip' | 'generic_receipt' | 'unknown';

export interface MissingInfo {
  field: string;
  message: string;
}

export interface SuggestedAction {
  action: string;
  description: string;
}

export interface ScanResult {
  document_type: DocumentType;
  confidence: number;
  extracted_data: Record<string, any>;
  missing_info: MissingInfo[];
  suggested_actions: SuggestedAction[];
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pix_receipt: 'Comprovante Pix',
  invoice: 'Nota Fiscal',
  boleto: 'Boleto',
  stock_exit: 'Saída de Estoque',
  payslip: 'Holerite',
  generic_receipt: 'Recibo/Cupom',
  unknown: 'Não identificado',
};

const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  pix_receipt: 'QrCode',
  invoice: 'FileText',
  boleto: 'Receipt',
  stock_exit: 'PackageMinus',
  payslip: 'UserCheck',
  generic_receipt: 'ReceiptText',
  unknown: 'HelpCircle',
};

export function useSmartScanner() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchContext = useCallback(async () => {
    if (!activeUnitId) return {};

    const [employees, items, suppliers, categories] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name').then(r =>
        (r.data || []).map(p => ({ id: p.user_id, name: p.full_name }))
      ),
      supabase.from('inventory_items').select('id, name, unit_type, unit_price').eq('unit_id', activeUnitId).limit(200).then(r => r.data || []),
      supabase.from('suppliers').select('id, name').eq('unit_id', activeUnitId).then(r => r.data || []),
      supabase.from('finance_categories').select('id, name, type, parent_id').eq('unit_id', activeUnitId).then(r => {
        const all = r.data || [];
        return all.map(c => ({
          ...c,
          parent_name: c.parent_id ? all.find(p => p.id === c.parent_id)?.name : null,
        }));
      }),
    ]);

    return {
      employees,
      inventory_items: items,
      suppliers,
      finance_categories: categories,
    };
  }, [activeUnitId]);

  const scanDocument = useCallback(async (file: File) => {
    if (!user || !activeUnitId) {
      toast.error('Faça login para usar o scanner');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const context = await fetchContext();

      const { data, error } = await supabase.functions.invoke('document-scanner', {
        body: { image_base64: base64, image_type: file.type, context },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha na análise');

      setScanResult(data.data);
      toast.success(`Documento identificado: ${DOCUMENT_TYPE_LABELS[data.data.document_type as DocumentType] || 'Desconhecido'}`);
    } catch (err: any) {
      console.error('Scan error:', err);
      toast.error(err.message || 'Erro ao analisar documento');
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  }, [user, activeUnitId, fetchContext]);

  const executeActions = useCallback(async (result: ScanResult, userInputs: Record<string, any> = {}) => {
    if (!user || !activeUnitId) return;
    setIsExecuting(true);

    try {
      const data = { ...result.extracted_data, ...userInputs };

      switch (result.document_type) {
        case 'pix_receipt': {
          // Create finance transaction
          const { error: txError } = await supabase.from('finance_transactions').insert({
            user_id: user.id,
            unit_id: activeUnitId,
            type: 'expense',
            description: data.description || `Pagamento Pix - ${data.receiver_name || ''}`,
            amount: data.amount || 0,
            date: data.date || new Date().toISOString().split('T')[0],
            is_paid: true,
            category_id: data.category_id || null,
            account_id: data.account_id || null,
          });
          if (txError) throw txError;

          // If employee matched, create payment record
          if (data.matched_employee_id) {
            const month = new Date(data.date || Date.now());
            await supabase.from('employee_payments').insert({
              employee_id: data.matched_employee_id,
              unit_id: activeUnitId,
              amount: data.amount || 0,
              payment_date: data.date || new Date().toISOString().split('T')[0],
              type: data.payment_type || 'other',
              reference_month: month.getMonth() + 1,
              reference_year: month.getFullYear(),
              is_paid: true,
              paid_at: new Date().toISOString(),
              notes: `Lançado via Scanner Inteligente`,
            });
          }

          toast.success('Pagamento lançado com sucesso!');
          queryClient.invalidateQueries({ queryKey: ['finance'] });
          queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
          break;
        }

        case 'invoice': {
          // Create finance transaction for the invoice total
          if (data.total_amount) {
            await supabase.from('finance_transactions').insert({
              user_id: user.id,
              unit_id: activeUnitId,
              type: 'expense',
              description: `NF ${data.invoice_number || ''} - ${data.supplier_name || 'Fornecedor'}`,
              amount: data.total_amount,
              date: data.invoice_date || new Date().toISOString().split('T')[0],
              is_paid: false,
              category_id: data.category_id || null,
            });
          }

          // Process stock entries
          if (data.items?.length) {
            const movements = data.items
              .filter((item: any) => item.matched_item_id)
              .map((item: any) => ({
                item_id: item.matched_item_id,
                unit_id: activeUnitId,
                user_id: user.id,
                type: 'entrada' as const,
                quantity: item.quantity || 0,
                notes: `NF ${data.invoice_number || ''} via Scanner`,
              }));

            if (movements.length > 0) {
              const { error: mvError } = await supabase.from('stock_movements').insert(movements);
              if (mvError) throw mvError;
            }

            // Update unit prices
            for (const item of data.items) {
              if (item.matched_item_id && item.unit_price) {
                await supabase.from('inventory_items')
                  .update({ unit_price: item.unit_price })
                  .eq('id', item.matched_item_id);
              }
            }
          }

          toast.success('Nota fiscal processada!');
          queryClient.invalidateQueries({ queryKey: ['finance'] });
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          break;
        }

        case 'boleto': {
          await supabase.from('finance_transactions').insert({
            user_id: user.id,
            unit_id: activeUnitId,
            type: 'expense',
            description: `Boleto - ${data.beneficiary_name || 'A pagar'}`,
            amount: data.amount || 0,
            date: data.due_date || new Date().toISOString().split('T')[0],
            is_paid: false,
            category_id: data.suggested_category_id || data.category_id || null,
          });

          toast.success('Boleto lançado como despesa futura!');
          queryClient.invalidateQueries({ queryKey: ['finance'] });
          break;
        }

        case 'stock_exit': {
          if (data.items?.length) {
            const movements = data.items
              .filter((item: any) => item.matched_item_id)
              .map((item: any) => ({
                item_id: item.matched_item_id,
                unit_id: activeUnitId,
                user_id: user.id,
                type: 'saida' as const,
                quantity: item.quantity || 0,
                notes: 'Saída via Scanner Inteligente',
              }));

            if (movements.length > 0) {
              const { error: mvError } = await supabase.from('stock_movements').insert(movements);
              if (mvError) throw mvError;
            }
          }

          toast.success('Saídas de estoque lançadas!');
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          break;
        }

        case 'payslip': {
          // Try to find an existing payment to link
          if (data.matched_employee_id) {
            const { data: existing } = await supabase
              .from('employee_payments')
              .select('id')
              .eq('employee_id', data.matched_employee_id)
              .eq('reference_month', data.reference_month)
              .eq('reference_year', data.reference_year)
              .eq('type', 'salary')
              .maybeSingle();

            if (existing?.id) {
              await supabase.from('employee_payments')
                .update({ receipt_url: data.receipt_url || null, notes: 'Holerite vinculado via Scanner' })
                .eq('id', existing.id);
              toast.success('Holerite vinculado ao pagamento existente!');
            } else {
              toast.info('Nenhum pagamento encontrado para vincular o holerite. Crie o pagamento manualmente.');
            }
          }
          queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
          break;
        }

        case 'generic_receipt': {
          await supabase.from('finance_transactions').insert({
            user_id: user.id,
            unit_id: activeUnitId,
            type: 'expense',
            description: data.description || data.vendor_name || 'Despesa',
            amount: data.amount || 0,
            date: data.date || new Date().toISOString().split('T')[0],
            is_paid: true,
            category_id: data.suggested_category_id || data.category_id || null,
          });

          toast.success('Despesa lançada!');
          queryClient.invalidateQueries({ queryKey: ['finance'] });
          break;
        }

        default:
          toast.error('Tipo de documento não suportado para lançamento automático');
          return;
      }
    } catch (err: any) {
      console.error('Execute error:', err);
      toast.error(err.message || 'Erro ao processar lançamento');
    } finally {
      setIsExecuting(false);
    }
  }, [user, activeUnitId, queryClient]);

  const reset = useCallback(() => {
    setScanResult(null);
    setPreviewUrl(null);
    setIsScanning(false);
    setIsExecuting(false);
  }, []);

  return {
    isScanning,
    scanResult,
    previewUrl,
    isExecuting,
    scanDocument,
    executeActions,
    reset,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_TYPE_ICONS,
  };
}
