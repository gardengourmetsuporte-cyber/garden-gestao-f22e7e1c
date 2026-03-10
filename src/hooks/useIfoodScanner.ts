import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface IfoodOrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
  options: { name: string; price?: number }[];
}

export interface IfoodScanResult {
  platform_order_id: string;
  platform_display_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  items: IfoodOrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  notes: string;
}

type ScanState = 'idle' | 'scanning' | 'review' | 'saving' | 'done' | 'error';

export function useIfoodScanner() {
  const { activeUnitId } = useUnit();
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<IfoodScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanImage = async (file: File) => {
    setState('scanning');
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const { data, error: fnError } = await supabase.functions.invoke('ifood-order-scanner', {
        body: { image_base64: base64, image_type: file.type },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao processar imagem');
      setResult(data.data);
      setState('review');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar imagem');
      setState('error');
      toast.error(err.message || 'Erro ao processar imagem');
    }
  };

  const confirmOrder = async (data: IfoodScanResult) => {
    if (!activeUnitId) return false;
    setState('saving');
    try {
      const { data: order, error: orderError } = await supabase
        .from('delivery_hub_orders')
        .insert({
          unit_id: activeUnitId,
          platform: 'ifood' as any,
          status: 'new' as any,
          platform_order_id: data.platform_order_id || null,
          platform_display_id: data.platform_display_id || null,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone || null,
          customer_address: data.customer_address || null,
          payment_method: data.payment_method || null,
          subtotal: data.subtotal || data.total,
          delivery_fee: data.delivery_fee || 0,
          discount: data.discount || 0,
          total: data.total,
          notes: data.notes || null,
          received_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      if (data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          order_id: order.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes || null,
          options: item.options?.length ? item.options : null,
        }));

        const { error: itemsError } = await supabase
          .from('delivery_hub_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      setState('done');
      toast.success('Pedido iFood importado com sucesso!');
      return true;
    } catch (err: any) {
      setError(err.message);
      setState('error');
      toast.error('Erro ao salvar pedido: ' + err.message);
      return false;
    }
  };

  const reset = () => {
    setState('idle');
    setResult(null);
    setError(null);
  };

  return { state, result, error, scanImage, confirmOrder, reset, setResult };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
