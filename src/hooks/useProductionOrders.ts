import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface ProductionItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit_type: string;
  category?: { id: string; name: string; color: string } | null;
  recipe_id?: string | null;
}

export interface ProductionOrder {
  id: string;
  item_id: string;
  quantity: number;
  produced_by: string;
  notes: string | null;
  created_at: string;
  item?: { name: string; unit_type: string } | null;
}

const PRODUCTION_CATEGORY_NAME = 'Produção';

export function useProductionOrders() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  // Find or get the "Produção" category ID
  const { data: productionCategory } = useQuery({
    queryKey: ['production-category', activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('unit_id', activeUnitId!)
        .ilike('name', PRODUCTION_CATEGORY_NAME)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeUnitId,
  });

  // Fetch inventory items in the "Produção" category
  const { data: productionItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['production-items', activeUnitId, productionCategory?.id],
    queryFn: async () => {
      if (!productionCategory?.id) return [];

      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock, min_stock, unit_type, category:categories(id, name, color)')
        .eq('unit_id', activeUnitId!)
        .eq('category_id', productionCategory.id)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return (data || []) as ProductionItem[];
    },
    enabled: !!activeUnitId && !!productionCategory?.id,
  });

  // Items needing production (below min_stock)
  const needsProduction = productionItems.filter(
    item => item.current_stock < item.min_stock
  );

  // Fetch production history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['production-orders', activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_orders')
        .select('id, quantity, produced_by, notes, created_at, item_id, item:inventory_items(name, unit_type)')
        .eq('unit_id', activeUnitId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ProductionOrder[];
    },
    enabled: !!activeUnitId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['production-items'] });
    queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }, [queryClient]);

  // Produce: register entrada movement + log production order
  const produceMut = useMutation({
    mutationFn: async ({ itemId, quantity, notes }: { itemId: string; quantity: number; notes?: string }) => {
      const item = productionItems.find(i => i.id === itemId);
      if (!item) throw new Error('Item não encontrado');

      // 1. Register stock entrada movement (trigger updates current_stock)
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert({
          item_id: itemId,
          type: 'entrada',
          quantity,
          notes: `Produção: ${quantity} ${item.unit_type} de ${item.name}${notes ? ` — ${notes}` : ''}`,
          user_id: user?.id,
          unit_id: activeUnitId,
        });
      if (movError) throw movError;

      // 2. Log production order
      const { error: logError } = await supabase
        .from('production_orders')
        .insert({
          unit_id: activeUnitId!,
          item_id: itemId,
          quantity,
          produced_by: user!.id,
          notes: notes || null,
        });
      if (logError) throw logError;
    },
    onSuccess: () => {
      toast.success('Produção registrada com sucesso!');
      invalidate();
    },
    onError: (err: any) => {
      toast.error('Erro ao registrar produção: ' + (err.message || ''));
    },
  });

  // Create the "Produção" category if it doesn't exist
  const ensureCategoryMut = useMutation({
    mutationFn: async () => {
      if (productionCategory) return productionCategory;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: PRODUCTION_CATEGORY_NAME,
          color: '#f59e0b',
          icon: 'ChefHat',
          unit_id: activeUnitId!,
        })
        .select('id, name, color')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-category'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    productionItems,
    needsProduction,
    history,
    productionCategory,
    isLoading: itemsLoading || historyLoading,
    produce: (itemId: string, quantity: number, notes?: string) =>
      produceMut.mutateAsync({ itemId, quantity, notes }),
    isProducing: produceMut.isPending,
    ensureCategory: () => ensureCategoryMut.mutateAsync(),
    refetch: invalidate,
  };
}
