import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShoppingListItem {
  id: string;
  item_id: string;
  quantity: number;
  notes: string | null;
  added_by: string | null;
  unit_id: string;
  status: string;
  created_at: string;
  inventory_item?: {
    id: string;
    name: string;
    unit_type: string;
    current_stock: number;
    min_stock: number;
    supplier_id: string | null;
    category?: { name: string; color: string } | null;
    supplier?: { name: string } | null;
  };
  profile?: { full_name: string } | null;
}

export function useShoppingList() {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['shopping-list', activeUnitId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*, inventory_items:item_id(id, name, unit_type, current_stock, min_stock, supplier_id, category:category_id(name, color), supplier:supplier_id(name))')
        .eq('unit_id', activeUnitId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        inventory_item: row.inventory_items,
        profile: null,
      })) as ShoppingListItem[];
    },
    enabled: !!activeUnitId,
  });

  const addToList = useMutation({
    mutationFn: async ({ itemId, quantity, notes }: { itemId: string; quantity: number; notes?: string }) => {
      if (!activeUnitId || !user) throw new Error('Missing context');
      const { error } = await supabase.from('shopping_list_items').insert({
        item_id: itemId,
        quantity,
        notes: notes || null,
        added_by: user.id,
        unit_id: activeUnitId,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Item adicionado à lista de compras');
    },
    onError: () => toast.error('Erro ao adicionar à lista'),
  });

  const removeFromList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error('Erro ao remover item'),
  });

  const clearList = useMutation({
    mutationFn: async () => {
      if (!activeUnitId) return;
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('unit_id', activeUnitId)
        .eq('status', 'pending');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Lista limpa');
    },
    onError: () => toast.error('Erro ao limpar lista'),
  });

  return {
    items,
    isLoading,
    addToList: addToList.mutateAsync,
    removeFromList: removeFromList.mutateAsync,
    clearList: clearList.mutateAsync,
    isAdding: addToList.isPending,
  };
}
