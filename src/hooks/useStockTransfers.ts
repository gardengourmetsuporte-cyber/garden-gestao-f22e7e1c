import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface StockTransfer {
  id: string;
  from_unit_id: string;
  to_unit_id: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  completed_by: string | null;
  items?: StockTransferItem[];
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  item_name: string;
  from_item_id: string | null;
  to_item_id: string | null;
  quantity: number;
  unit_type: string;
}

export function useStockTransfers() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['stock-transfers', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('stock_transfers' as any)
        .select('*, stock_transfer_items(*)')
        .or(`from_unit_id.eq.${activeUnitId},to_unit_id.eq.${activeUnitId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as unknown as StockTransfer[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const createTransfer = useMutation({
    mutationFn: async (params: {
      toUnitId: string;
      items: { itemId: string; itemName: string; quantity: number; unitType: string }[];
      notes?: string;
    }) => {
      const { data: transfer, error } = await supabase
        .from('stock_transfers' as any)
        .insert({
          from_unit_id: activeUnitId,
          to_unit_id: params.toUnitId,
          created_by: user!.id,
          notes: params.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const items = params.items.map(i => ({
        transfer_id: (transfer as any).id,
        item_name: i.itemName,
        from_item_id: i.itemId,
        quantity: i.quantity,
        unit_type: i.unitType,
      }));

      await supabase.from('stock_transfer_items' as any).insert(items);

      // Deduct stock from source
      for (const item of params.items) {
        await supabase
          .from('inventory_items')
          .update({ current_stock: supabase.rpc ? undefined : 0 })
          .eq('id', item.itemId);

        // Use stock movement instead
        await supabase.from('stock_movements').insert({
          item_id: item.itemId,
          type: 'saida',
          quantity: item.quantity,
          reason: `Transferência para outra unidade`,
          user_id: user!.id,
          unit_id: activeUnitId,
        });
      }

      return transfer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-transfers'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const acceptTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const transfer = transfers.find(t => t.id === transferId);
      if (!transfer) throw new Error('Transfer not found');

      // Add stock to destination
      for (const item of (transfer as any).stock_transfer_items || []) {
        // Try to find matching item in destination unit
        const { data: destItem } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('unit_id', activeUnitId)
          .eq('name', item.item_name)
          .maybeSingle();

        if (destItem) {
          await supabase.from('stock_movements').insert({
            item_id: destItem.id,
            type: 'entrada',
            quantity: item.quantity,
            reason: `Transferência recebida`,
            user_id: user!.id,
            unit_id: activeUnitId,
          });
        }
      }

      await supabase
        .from('stock_transfers' as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user!.id,
        })
        .eq('id', transferId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-transfers'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  return { transfers, isLoading, createTransfer, acceptTransfer };
}
