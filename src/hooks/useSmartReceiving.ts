import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface SmartReceivingItem {
  id?: string;
  raw_description: string;
  raw_quantity: number;
  raw_unit_type: string;
  raw_unit_price: number;
  raw_total: number;
  inventory_item_id: string | null;
  matched_name: string | null;
  confidence: number;
  confirmed_quantity: number | null;
  confirmed_unit_price: number | null;
  is_confirmed: boolean;
  is_new_item: boolean;
}

export interface SmartReceiving {
  id: string;
  user_id: string;
  unit_id: string | null;
  order_id: string | null;
  supplier_id: string | null;
  supplier_invoice_id: string | null;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number;
  boleto_due_date: string | null;
  boleto_amount: number | null;
  boleto_barcode: string | null;
  invoice_image_url: string | null;
  boleto_image_url: string | null;
  ai_raw_response: any;
  status: string;
  finance_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  items?: SmartReceivingItem[];
}

export interface OcrResult {
  document_type: 'invoice' | 'boleto' | 'both';
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number;
  boleto_amount: number | null;
  boleto_due_date: string | null;
  boleto_barcode: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    total: number;
    matched_item_id: string | null;
    matched_name: string | null;
    confidence: number;
  }>;
}

export function useSmartReceiving() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const queryKey = ['smart-receivings', activeUnitId];

  const { data: receivings = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('smart_receivings')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUnitId) {
        query = query.eq('unit_id', activeUnitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SmartReceiving[];
    },
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Upload image to storage
  const uploadImage = useCallback(async (file: File, type: 'invoice' | 'boleto'): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${activeUnitId}/${type}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('smart-receivings')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('smart-receivings')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }, [activeUnitId]);

  // Convert file to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Process image with AI OCR
  const processImage = useCallback(async (
    file: File,
    inventoryItems: Array<{ id: string; name: string; unit_type: string; unit_price: number | null }>
  ): Promise<OcrResult> => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('smart-receiving-ocr', {
        body: {
          image_base64: base64,
          image_type: file.type,
          inventory_items: inventoryItems,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro no processamento');

      return data.data as OcrResult;
    } finally {
      setIsProcessing(false);
    }
  }, [fileToBase64]);

  // Create smart receiving record with items
  const createReceiving = useMutation({
    mutationFn: async (params: {
      ocrResult: OcrResult;
      invoiceImageUrl: string | null;
      boletoImageUrl: string | null;
      orderId?: string | null;
      supplierId?: string | null;
      aiRawResponse?: any;
    }) => {
      const { ocrResult, invoiceImageUrl, boletoImageUrl, orderId, supplierId, aiRawResponse } = params;

      // Create main record
      const { data: receiving, error: recError } = await supabase
        .from('smart_receivings')
        .insert({
          user_id: user!.id,
          unit_id: activeUnitId,
          order_id: orderId || null,
          supplier_id: supplierId || null,
          supplier_name: ocrResult.supplier_name,
          invoice_number: ocrResult.invoice_number,
          invoice_date: ocrResult.invoice_date,
          total_amount: ocrResult.total_amount || 0,
          boleto_due_date: ocrResult.boleto_due_date,
          boleto_amount: ocrResult.boleto_amount,
          boleto_barcode: ocrResult.boleto_barcode,
          invoice_image_url: invoiceImageUrl,
          boleto_image_url: boletoImageUrl,
          ai_raw_response: aiRawResponse || null,
          status: 'review',
        })
        .select()
        .single();

      if (recError) throw recError;

      // Create items
      if (ocrResult.items?.length > 0) {
        const items = ocrResult.items.map(item => ({
          receiving_id: receiving.id,
          raw_description: item.description,
          raw_quantity: item.quantity,
          raw_unit_type: item.unit_type || 'unidade',
          raw_unit_price: item.unit_price || 0,
          raw_total: item.total || 0,
          inventory_item_id: item.matched_item_id,
          matched_name: item.matched_name,
          confidence: item.confidence || 0,
          confirmed_quantity: item.quantity,
          confirmed_unit_price: item.unit_price || 0,
        }));

        const { error: itemsError } = await supabase
          .from('smart_receiving_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return receiving as SmartReceiving;
    },
    onSuccess: invalidate,
  });

  // Confirm receiving: create stock movements + financial transaction
  const confirmReceiving = useMutation({
    mutationFn: async (params: {
      receivingId: string;
      items: SmartReceivingItem[];
      createFinancialEntry: boolean;
      boletoAmount?: number;
      boletoDueDate?: string;
    }) => {
      const { receivingId, items, createFinancialEntry, boletoAmount, boletoDueDate } = params;

      // Get receiving data
      const { data: receiving, error: recError } = await supabase
        .from('smart_receivings')
        .select('*')
        .eq('id', receivingId)
        .single();

      if (recError) throw recError;

      // Create stock movements for confirmed items with inventory matches
      const confirmedItems = items.filter(i => i.is_confirmed && i.inventory_item_id);
      for (const item of confirmedItems) {
        const qty = item.confirmed_quantity || item.raw_quantity;
        await supabase.from('stock_movements').insert({
          item_id: item.inventory_item_id!,
          type: 'entrada',
          quantity: qty,
          notes: `Recebimento inteligente - NF ${receiving.invoice_number || 'S/N'}`,
          user_id: user!.id,
          unit_id: activeUnitId,
        });

        // Update unit price if available
        const price = item.confirmed_unit_price || item.raw_unit_price;
        if (price > 0) {
          await supabase
            .from('inventory_items')
            .update({ unit_price: price })
            .eq('id', item.inventory_item_id!);
        }
      }

      // Create financial transaction if requested
      let financeTransactionId: string | null = null;
      if (createFinancialEntry && (boletoAmount || receiving.total_amount)) {
        const amount = boletoAmount || receiving.boleto_amount || receiving.total_amount;
        const dueDate = boletoDueDate || receiving.boleto_due_date;

        const { data: txn, error: txnError } = await supabase
          .from('finance_transactions')
          .insert({
            user_id: user!.id,
            unit_id: activeUnitId,
            type: 'expense',
            amount: amount,
            description: receiving.supplier_name || 'Nota Fiscal',
            date: dueDate || new Date().toISOString().split('T')[0],
            is_paid: false,
            is_recurring: false,
            is_fixed: false,
            notes: `NF: ${receiving.invoice_number || 'S/N'} - Recebimento Inteligente`,
            supplier_id: receiving.supplier_id,
          })
          .select()
          .single();

        if (txnError) throw txnError;
        financeTransactionId = txn.id;
      }

      // Update receiving status
      const { error: updateError } = await supabase
        .from('smart_receivings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          finance_transaction_id: financeTransactionId,
        })
        .eq('id', receivingId);

      if (updateError) throw updateError;

      return { receivingId, financeTransactionId };
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      toast.success('Recebimento confirmado com sucesso!');
    },
  });

  return {
    receivings,
    isLoading,
    isProcessing,
    processImage,
    uploadImage,
    createReceiving: createReceiving.mutateAsync,
    confirmReceiving: confirmReceiving.mutateAsync,
    invalidate,
  };
}
