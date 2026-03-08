import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
import { toast } from 'sonner';
import type { Recipe } from '@/types/recipe';
import type { MenuGroup, MenuProduct } from '@/hooks/useMenuAdmin';

export interface SyncableRecipe extends Recipe {
  /** Already linked to a menu product */
  linkedProductId?: string;
  /** Current menu price (if linked) */
  currentMenuPrice?: number;
  /** Current margin (if linked) */
  currentMargin?: number;
  /** Full cost (ingredients + operational) */
  fullCost: number;
  /** Suggested price based on margin */
  suggestedPrice: number;
}

interface SyncOptions {
  recipeIds: string[];
  groupId: string;
  margin: number; // percentage e.g. 300 = 300%
  overrideExisting?: boolean;
}

export function useRecipeMenuSync(
  menuProducts: MenuProduct[],
  menuGroups: MenuGroup[],
  onRefresh: () => void,
) {
  const { activeUnitId } = useUnit();
  const { recipes } = useRecipes();
  const { calculateOperationalCosts } = useRecipeCostSettings();
  const [syncing, setSyncing] = useState(false);

  const getFullCost = useCallback((recipe: Recipe) => {
    const opCosts = calculateOperationalCosts(recipe.cost_per_portion);
    return recipe.cost_per_portion + opCosts.totalOperational;
  }, [calculateOperationalCosts]);

  /** All active recipes enriched with sync status */
  const syncableRecipes: SyncableRecipe[] = recipes
    .filter(r => r.is_active)
    .map(r => {
      const linked = menuProducts.find(p => (p as any).recipe_id === r.id);
      const fullCost = getFullCost(r);
      const currentMargin = linked ? ((linked.price - fullCost) / fullCost) * 100 : undefined;
      return {
        ...r,
        linkedProductId: linked?.id,
        currentMenuPrice: linked?.price,
        currentMargin,
        fullCost,
        suggestedPrice: fullCost * 4, // default 300% margin
      };
    });

  const alreadySyncedCount = syncableRecipes.filter(r => r.linkedProductId).length;

  /** Sync selected recipes to menu products */
  const syncRecipes = useCallback(async (opts: SyncOptions) => {
    if (!activeUnitId) return;
    setSyncing(true);
    try {
      const toSync = recipes.filter(r => opts.recipeIds.includes(r.id));
      let created = 0;
      let updated = 0;

      for (const recipe of toSync) {
        const fullCost = getFullCost(recipe);
        const price = Math.round(fullCost * (1 + opts.margin / 100) * 100) / 100;
        const existingProduct = menuProducts.find(p => (p as any).recipe_id === recipe.id);

        if (existingProduct) {
          if (opts.overrideExisting) {
            await supabase.from('tablet_products').update({
              name: recipe.name,
              price,
              cost_per_portion: fullCost,
              profit_margin: opts.margin,
              is_active: recipe.is_active,
              group_id: opts.groupId || existingProduct.group_id,
              updated_at: new Date().toISOString(),
            }).eq('id', existingProduct.id);
            updated++;
          }
        } else {
          // Determine sort_order
          const groupProducts = menuProducts.filter(p => p.group_id === opts.groupId);
          const maxOrder = groupProducts.length > 0 
            ? Math.max(...groupProducts.map(p => p.sort_order)) + 1 
            : 0;

          await supabase.from('tablet_products').insert({
            unit_id: activeUnitId,
            name: recipe.name,
            price,
            cost_per_portion: fullCost,
            profit_margin: opts.margin,
            recipe_id: recipe.id,
            group_id: opts.groupId,
            category: recipe.category?.name || 'Geral',
            description: recipe.preparation_notes || '',
            is_active: true,
            sort_order: maxOrder + created,
            availability: { tablet: true, delivery: true },
            price_type: 'fixed',
          });
          created++;
        }
      }

      toast.success(`Sincronizado! ${created} criados, ${updated} atualizados.`);
      onRefresh();
    } catch (err: any) {
      console.error('[RecipeSync]', err);
      toast.error('Erro ao sincronizar: ' + err.message);
    } finally {
      setSyncing(false);
    }
  }, [activeUnitId, recipes, menuProducts, getFullCost, onRefresh]);

  /** Update price/margin for a single linked product */
  const updateProductPrice = useCallback(async (productId: string, price: number, margin: number) => {
    await supabase.from('tablet_products').update({
      price,
      profit_margin: margin,
      updated_at: new Date().toISOString(),
    }).eq('id', productId);
    onRefresh();
  }, [onRefresh]);

  /** Refresh costs from recipes (batch) */
  const refreshCosts = useCallback(async () => {
    if (!activeUnitId) return;
    setSyncing(true);
    try {
      const linkedProducts = menuProducts.filter(p => (p as any).recipe_id);
      let count = 0;
      for (const prod of linkedProducts) {
        const recipe = recipes.find(r => r.id === (prod as any).recipe_id);
        if (!recipe) continue;
        const fullCost = getFullCost(recipe);
        const margin = (prod as any).profit_margin ?? 300;
        const newPrice = Math.round(fullCost * (1 + margin / 100) * 100) / 100;
        await supabase.from('tablet_products').update({
          cost_per_portion: fullCost,
          price: newPrice,
          updated_at: new Date().toISOString(),
        }).eq('id', prod.id);
        count++;
      }
      toast.success(`${count} produto(s) atualizados com novos custos.`);
      onRefresh();
    } catch (err: any) {
      toast.error('Erro ao atualizar custos: ' + err.message);
    } finally {
      setSyncing(false);
    }
  }, [activeUnitId, menuProducts, recipes, getFullCost, onRefresh]);

  return {
    syncableRecipes,
    alreadySyncedCount,
    syncing,
    syncRecipes,
    updateProductPrice,
    refreshCosts,
    getFullCost,
  };
}
