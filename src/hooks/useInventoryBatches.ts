import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface InventoryBatch {
  id: string;
  item_id: string;
  unit_id: string;
  batch_number: string | null;
  quantity: number;
  expiry_date: string | null;
  received_at: string;
  cost_per_unit: number;
  notes: string | null;
  is_consumed: boolean;
  created_at: string;
}

export function useInventoryBatches(itemId?: string) {
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['inventory-batches', activeUnitId, itemId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      let q = supabase
        .from('inventory_batches')
        .select('*')
        .eq('unit_id', activeUnitId)
        .eq('is_consumed', false)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      
      if (itemId) q = q.eq('item_id', itemId);
      
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as InventoryBatch[];
    },
    enabled: !!activeUnitId,
  });

  const addBatch = useMutation({
    mutationFn: async (batch: Partial<InventoryBatch> & { item_id: string }) => {
      if (!activeUnitId) throw new Error('Sem unidade');
      const { error } = await supabase.from('inventory_batches').insert({
        unit_id: activeUnitId,
        item_id: batch.item_id,
        batch_number: batch.batch_number || null,
        quantity: batch.quantity || 0,
        expiry_date: batch.expiry_date || null,
        received_at: batch.received_at || new Date().toISOString().split('T')[0],
        cost_per_unit: batch.cost_per_unit || 0,
        notes: batch.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-batches'] });
      toast.success('Lote adicionado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const consumeBatch = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      // Get current batch
      const { data: batch } = await supabase
        .from('inventory_batches')
        .select('quantity')
        .eq('id', id)
        .single();
      
      if (!batch) throw new Error('Lote não encontrado');
      const remaining = (batch as any).quantity - quantity;
      
      if (remaining <= 0) {
        await supabase.from('inventory_batches').update({ is_consumed: true, quantity: 0 } as any).eq('id', id);
      } else {
        await supabase.from('inventory_batches').update({ quantity: remaining } as any).eq('id', id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-batches'] });
      toast.success('Lote consumido (FIFO)');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Get batches expiring soon (within N days)
  const expiringQuery = useQuery({
    queryKey: ['inventory-batches-expiring', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const { data, error } = await supabase
        .from('inventory_batches')
        .select('*, item:inventory_items(name, unit_type)')
        .eq('unit_id', activeUnitId)
        .eq('is_consumed', false)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!activeUnitId,
  });

  return {
    batches: query.data || [],
    isLoading: query.isLoading,
    addBatch,
    consumeBatch,
    expiringBatches: expiringQuery.data || [],
    expiringLoading: expiringQuery.isLoading,
  };
}
