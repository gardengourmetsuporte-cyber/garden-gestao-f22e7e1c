import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useInventoryCounts() {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const countsQuery = useQuery({
    queryKey: ['inventory-counts', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_counts')
        .select('*')
        .eq('unit_id', unitId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });

  const startCount = useMutation({
    mutationFn: async () => {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('id, current_stock')
        .eq('unit_id', unitId!)
        .is('deleted_at', null);

      const { data: count, error } = await supabase
        .from('inventory_counts')
        .insert({ unit_id: unitId!, created_by: user?.id, status: 'in_progress' } as any)
        .select()
        .single();
      if (error) throw error;

      if (items?.length) {
        const countItems = items.map(item => ({
          count_id: count.id,
          item_id: item.id,
          system_stock: Number(item.current_stock || 0),
        }));
        await supabase.from('inventory_count_items').insert(countItems as any);
      }

      return count;
    },
    onSuccess: () => {
      toast.success('Contagem iniciada');
      qc.invalidateQueries({ queryKey: ['inventory-counts'] });
    },
    onError: () => toast.error('Erro ao iniciar contagem'),
  });

  const updateCountItem = useMutation({
    mutationFn: async ({ itemId, countedStock }: { itemId: string; countedStock: number }) => {
      const { error } = await supabase
        .from('inventory_count_items')
        .update({ counted_stock: countedStock, counted_by: user?.id, counted_at: new Date().toISOString() } as any)
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-count-items'] }),
  });

  const completeCount = useMutation({
    mutationFn: async (countId: string) => {
      const { data: items } = await supabase
        .from('inventory_count_items')
        .select('item_id, counted_stock')
        .eq('count_id', countId)
        .not('counted_stock', 'is', null);

      for (const item of (items as any[]) || []) {
        await supabase
          .from('inventory_items')
          .update({ current_stock: item.counted_stock, updated_at: new Date().toISOString() })
          .eq('id', item.item_id);

        await supabase
          .from('inventory_count_items')
          .update({ adjusted: true } as any)
          .eq('count_id', countId)
          .eq('item_id', item.item_id);
      }

      await supabase
        .from('inventory_counts')
        .update({ status: 'completed', completed_at: new Date().toISOString() } as any)
        .eq('id', countId);
    },
    onSuccess: () => {
      toast.success('Contagem finalizada e estoque ajustado');
      qc.invalidateQueries({ queryKey: ['inventory-counts'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: () => toast.error('Erro ao finalizar contagem'),
  });

  return { countsQuery, startCount, updateCountItem, completeCount };
}

export function useCountItems(countId: string | null) {
  return useQuery({
    queryKey: ['inventory-count-items', countId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_count_items')
        .select('*')
        .eq('count_id', countId!);
      if (error) throw error;
      // Get item names separately
      const itemIds = data?.map(d => (d as any).item_id) || [];
      if (!itemIds.length) return [];
      const { data: invItems } = await supabase
        .from('inventory_items')
        .select('id, name, category_id, unit_type')
        .in('id', itemIds);
      const nameMap = new Map(invItems?.map(i => [i.id, i]) || []);
      return data?.map(d => ({
        ...(d as any),
        item_name: nameMap.get((d as any).item_id)?.name || '',
        item_category: nameMap.get((d as any).item_id)?.category_id || '',
        item_unit_type: String(nameMap.get((d as any).item_id)?.unit_type || 'unidade'),
      })) || [];
    },
    enabled: !!countId,
  });
}
