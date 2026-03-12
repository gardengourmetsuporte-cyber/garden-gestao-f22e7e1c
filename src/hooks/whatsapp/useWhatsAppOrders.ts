import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppOrder } from '@/types/whatsapp';

export function useWhatsAppOrders() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-orders', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('whatsapp_orders')
        .select('*, contact:whatsapp_contacts(*)')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as WhatsAppOrder[];
    },
    enabled: !!activeUnitId,
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('whatsapp_orders')
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-orders'] });
      toast({ title: 'Status do pedido atualizado' });
    },
  });

  return { ...query, orders: query.data || [], updateOrderStatus };
}

export function useRecoverCarts() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('whatsapp-recover-carts', {
        body: { unit_id: activeUnitId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-orders'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      toast({ title: 'Recuperação Iniciada', description: `${data.recovered_count || 0} mensagens enviadas.` });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao recuperar carrinhos', description: err.message, variant: 'destructive' });
    },
  });
}
