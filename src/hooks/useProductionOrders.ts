import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface ProductionRecipe {
  id: string;
  name: string;
  yield_quantity: number;
  yield_unit: string;
  min_ready_stock: number;
  current_ready_stock: number;
  category?: { name: string; color: string } | null;
  ingredients: {
    id: string;
    item_id: string | null;
    quantity: number;
    unit_type: string;
    source_type: string;
    item?: { id: string; name: string; current_stock: number; unit_type: string } | null;
  }[];
}

export interface ProductionOrder {
  id: string;
  recipe_id: string;
  quantity: number;
  produced_by: string;
  notes: string | null;
  status: string;
  created_at: string;
  recipe?: { name: string; yield_unit: string; category?: { name: string; color: string } | null };
}

export function useProductionOrders() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  // Fetch recipes that have min_ready_stock > 0
  const { data: productionRecipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['production-recipes', activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id, name, yield_quantity, yield_unit, min_ready_stock, current_ready_stock,
          category:recipe_categories(name, color),
          ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(
            id, item_id, quantity, unit_type, source_type,
            item:inventory_items(id, name, current_stock, unit_type)
          )
        `)
        .gt('min_ready_stock', 0)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data || []) as ProductionRecipe[];
    },
    enabled: !!user,
  });

  // Recipes needing production
  const needsProduction = productionRecipes.filter(
    r => (r.current_ready_stock ?? 0) < (r.min_ready_stock ?? 0)
  );

  // Fetch production history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['production-orders', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('production_orders')
        .select(`
          *,
          recipe:recipes(name, yield_unit, category:recipe_categories(name, color))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeUnitId) query = query.eq('unit_id', activeUnitId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProductionOrder[];
    },
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['production-recipes'] });
    queryClient.invalidateQueries({ queryKey: ['production-orders'] });
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }, [queryClient]);

  // Produce: update ready stock, deduct ingredients, log order
  const produceMut = useMutation({
    mutationFn: async ({ recipeId, quantity, notes }: { recipeId: string; quantity: number; notes?: string }) => {
      const recipe = productionRecipes.find(r => r.id === recipeId);
      if (!recipe) throw new Error('Receita não encontrada');

      // 1. Deduct inventory for each ingredient (proportional to portions produced)
      const multiplier = quantity / recipe.yield_quantity;
      for (const ing of recipe.ingredients) {
        if (ing.source_type === 'inventory' && ing.item_id && ing.item) {
          const deductQty = ing.quantity * multiplier;
          // Register stock movement (saida)
          const { error: movError } = await supabase
            .from('stock_movements')
            .insert({
              item_id: ing.item_id,
              type: 'saida',
              quantity: deductQty,
              notes: `Produção: ${quantity} ${recipe.yield_unit} de ${recipe.name}`,
              user_id: user?.id,
              unit_id: activeUnitId,
            });
          if (movError) throw movError;
        }
      }

      // 2. Update current_ready_stock on recipe
      const newStock = (recipe.current_ready_stock ?? 0) + quantity;
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ current_ready_stock: newStock })
        .eq('id', recipeId);
      if (updateError) throw updateError;

      // 3. Log production order
      const { error: logError } = await supabase
        .from('production_orders')
        .insert({
          unit_id: activeUnitId!,
          recipe_id: recipeId,
          quantity,
          produced_by: user!.id,
          notes: notes || null,
          status: 'completed',
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

  // Update ready stock manually (e.g. after sales)
  const updateStockMut = useMutation({
    mutationFn: async ({ recipeId, newStock }: { recipeId: string; newStock: number }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ current_ready_stock: Math.max(0, newStock) })
        .eq('id', recipeId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
    },
  });

  return {
    productionRecipes,
    needsProduction,
    history,
    isLoading: recipesLoading || historyLoading,
    produce: (recipeId: string, quantity: number, notes?: string) =>
      produceMut.mutateAsync({ recipeId, quantity, notes }),
    isProducing: produceMut.isPending,
    updateReadyStock: (recipeId: string, newStock: number) =>
      updateStockMut.mutateAsync({ recipeId, newStock }),
    refetch: invalidate,
  };
}
