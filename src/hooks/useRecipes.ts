 import { useState } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeUnitType, IngredientSourceType } from '@/types/recipe';
 
 export function useRecipes() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Fetch all recipe categories
   const { data: categories = [], isLoading: categoriesLoading } = useQuery({
     queryKey: ['recipe-categories'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('recipe_categories')
         .select('*')
         .order('sort_order');
       
       if (error) throw error;
       return data as RecipeCategory[];
     },
   });
 
   // Fetch all recipes with ingredients
   const { data: recipes = [], isLoading: recipesLoading } = useQuery({
     queryKey: ['recipes'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('recipes')
         .select(`
           *,
           category:recipe_categories(*),
           ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(
             *,
             item:inventory_items(
               id,
               name,
               unit_type,
               unit_price,
              recipe_unit_type,
              recipe_unit_price,
               category:categories(name, color)
            ),
            source_recipe:recipes!recipe_ingredients_source_recipe_id_fkey(
              id,
              name,
              yield_unit,
              cost_per_portion,
              category:recipe_categories(name, color)
             )
           )
         `)
         .order('name');
       
       if (error) throw error;
       return data as Recipe[];
     },
   });
 
  // Get available sub-recipes (excluding current recipe to avoid cycles)
  const getAvailableSubRecipes = (excludeRecipeId?: string) => {
    return recipes.filter(r => 
      r.id !== excludeRecipeId && 
      r.is_active &&
      !hasCircularDependency(r.id, excludeRecipeId)
    );
  };

  // Check for circular dependency
  const hasCircularDependency = (subRecipeId: string, parentRecipeId?: string): boolean => {
    if (!parentRecipeId) return false;
    
    const subRecipe = recipes.find(r => r.id === subRecipeId);
    if (!subRecipe?.ingredients) return false;
    
    for (const ing of subRecipe.ingredients) {
      if (ing.source_type === 'recipe' && ing.source_recipe_id) {
        if (ing.source_recipe_id === parentRecipeId) return true;
        if (hasCircularDependency(ing.source_recipe_id, parentRecipeId)) return true;
      }
    }
    
    return false;
  };

   // Fetch inventory items for ingredient picker
   const { data: inventoryItems = [] } = useQuery({
     queryKey: ['inventory-items-for-recipes'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('inventory_items')
         .select(`
           id,
           name,
           unit_type,
           unit_price,
          recipe_unit_type,
          recipe_unit_price,
           category:categories(id, name, color)
         `)
         .order('name');
       
       if (error) throw error;
       return data;
     },
   });
 
   // Add recipe mutation
   const addRecipeMutation = useMutation({
     mutationFn: async (data: {
       name: string;
       category_id: string | null;
       yield_quantity: number;
       yield_unit: string;
       preparation_notes?: string;
       ingredients: Array<{
        item_id: string | null;
         quantity: number;
         unit_type: RecipeUnitType;
         unit_cost: number;
         total_cost: number;
        source_type: IngredientSourceType;
        source_recipe_id: string | null;
       }>;
     }) => {
       const { ingredients, ...recipeData } = data;
       
       // Calculate total cost
       const total_cost = ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
       const cost_per_portion = data.yield_quantity > 0 ? total_cost / data.yield_quantity : total_cost;
       
       // Insert recipe
       const { data: recipe, error: recipeError } = await supabase
         .from('recipes')
         .insert({
           ...recipeData,
           total_cost,
           cost_per_portion,
           cost_updated_at: new Date().toISOString(),
         })
         .select()
         .single();
       
       if (recipeError) throw recipeError;
       
       // Insert ingredients
       if (ingredients.length > 0) {
         const { error: ingredientsError } = await supabase
           .from('recipe_ingredients')
           .insert(
             ingredients.map((ing, index) => ({
               recipe_id: recipe.id,
               item_id: ing.item_id,
               quantity: ing.quantity,
               unit_type: ing.unit_type,
               unit_cost: ing.unit_cost,
               total_cost: ing.total_cost,
               sort_order: index,
              source_type: ing.source_type,
              source_recipe_id: ing.source_recipe_id,
             }))
           );
         
         if (ingredientsError) throw ingredientsError;
       }
       
       return recipe;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['recipes'] });
       toast({ title: 'Ficha técnica criada com sucesso!' });
     },
     onError: () => {
       toast({ title: 'Erro ao criar ficha técnica', variant: 'destructive' });
     },
   });
 
   // Update recipe mutation
   const updateRecipeMutation = useMutation({
     mutationFn: async (data: {
       id: string;
       name: string;
       category_id: string | null;
       yield_quantity: number;
       yield_unit: string;
       preparation_notes?: string;
       ingredients: Array<{
         id?: string;
        item_id: string | null;
         quantity: number;
         unit_type: RecipeUnitType;
         unit_cost: number;
         total_cost: number;
        source_type: IngredientSourceType;
        source_recipe_id: string | null;
       }>;
     }) => {
       const { id, ingredients, ...recipeData } = data;
       
       // Calculate total cost
       const total_cost = ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
       const cost_per_portion = data.yield_quantity > 0 ? total_cost / data.yield_quantity : total_cost;
       
       // Update recipe
       const { error: recipeError } = await supabase
         .from('recipes')
         .update({
           ...recipeData,
           total_cost,
           cost_per_portion,
           cost_updated_at: new Date().toISOString(),
         })
         .eq('id', id);
       
       if (recipeError) throw recipeError;
       
       // Delete existing ingredients
       const { error: deleteError } = await supabase
         .from('recipe_ingredients')
         .delete()
         .eq('recipe_id', id);
       
       if (deleteError) throw deleteError;
       
       // Insert new ingredients
       if (ingredients.length > 0) {
         const { error: ingredientsError } = await supabase
           .from('recipe_ingredients')
           .insert(
             ingredients.map((ing, index) => ({
               recipe_id: id,
               item_id: ing.item_id,
               quantity: ing.quantity,
               unit_type: ing.unit_type,
               unit_cost: ing.unit_cost,
               total_cost: ing.total_cost,
               sort_order: index,
              source_type: ing.source_type,
              source_recipe_id: ing.source_recipe_id,
             }))
           );
         
         if (ingredientsError) throw ingredientsError;
       }
       
       return { id };
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['recipes'] });
       toast({ title: 'Ficha técnica atualizada com sucesso!' });
     },
     onError: () => {
       toast({ title: 'Erro ao atualizar ficha técnica', variant: 'destructive' });
     },
   });
 
   // Toggle active status mutation
   const toggleActiveMutation = useMutation({
     mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
       const { error } = await supabase
         .from('recipes')
         .update({ is_active })
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['recipes'] });
     },
   });
 
   // Duplicate recipe mutation
   const duplicateRecipeMutation = useMutation({
     mutationFn: async (recipeId: string) => {
       // Get existing recipe
       const { data: existing, error: fetchError } = await supabase
         .from('recipes')
         .select(`
           *,
           ingredients:recipe_ingredients(*)
         `)
         .eq('id', recipeId)
         .single();
       
       if (fetchError) throw fetchError;
       
       // Create new recipe
       const { data: newRecipe, error: insertError } = await supabase
         .from('recipes')
         .insert({
           name: `${existing.name} (cópia)`,
           category_id: existing.category_id,
           yield_quantity: existing.yield_quantity,
           yield_unit: existing.yield_unit,
           preparation_notes: existing.preparation_notes,
           is_active: false,
           total_cost: existing.total_cost,
           cost_per_portion: existing.cost_per_portion,
           cost_updated_at: new Date().toISOString(),
         })
         .select()
         .single();
       
       if (insertError) throw insertError;
       
       // Copy ingredients
       if (existing.ingredients && existing.ingredients.length > 0) {
         const { error: ingredientsError } = await supabase
           .from('recipe_ingredients')
           .insert(
             existing.ingredients.map((ing: any, index: number) => ({
               recipe_id: newRecipe.id,
               item_id: ing.item_id,
               quantity: ing.quantity,
               unit_type: ing.unit_type,
               unit_cost: ing.unit_cost,
               total_cost: ing.total_cost,
               sort_order: index,
              source_type: ing.source_type || 'inventory',
              source_recipe_id: ing.source_recipe_id || null,
             }))
           );
         
         if (ingredientsError) throw ingredientsError;
       }
       
       return newRecipe;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['recipes'] });
       toast({ title: 'Ficha técnica duplicada com sucesso!' });
     },
     onError: () => {
       toast({ title: 'Erro ao duplicar ficha técnica', variant: 'destructive' });
     },
   });
 
   // Delete recipe mutation
   const deleteRecipeMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('recipes')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['recipes'] });
       toast({ title: 'Ficha técnica excluída com sucesso!' });
     },
     onError: () => {
       toast({ title: 'Erro ao excluir ficha técnica', variant: 'destructive' });
     },
   });
 
   // Add category mutation
   const addCategoryMutation = useMutation({
     mutationFn: async (data: { name: string; color: string; icon: string }) => {
       const { data: maxOrder } = await supabase
         .from('recipe_categories')
         .select('sort_order')
         .order('sort_order', { ascending: false })
         .limit(1)
         .single();
       
       const { error } = await supabase
         .from('recipe_categories')
         .insert({
           ...data,
           sort_order: (maxOrder?.sort_order ?? 0) + 1,
         });
       
       if (error) throw error;
     },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-categories'] });
      toast({ title: 'Categoria criada com sucesso!' });
    },
  });

  // Reorder recipe categories mutation
  const reorderCategoriesMutation = useMutation({
    mutationFn: async (reorderedCategories: RecipeCategory[]) => {
      const promises = reorderedCategories.map((cat, index) =>
        supabase
          .from('recipe_categories')
          .update({ sort_order: index })
          .eq('id', cat.id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-categories'] });
    },
  });

  // Update inventory item price globally
  const updateItemPriceMutation = useMutation({
    mutationFn: async ({ itemId, price }: { itemId: string; price: number }) => {
      // Check if item has recipe-specific unit/price configured
      const { data: item } = await supabase
        .from('inventory_items')
        .select('recipe_unit_type, recipe_unit_price')
        .eq('id', itemId)
        .single();

      // Update the appropriate price field
      const updateData = item?.recipe_unit_type
        ? { recipe_unit_price: price }
        : { unit_price: price };

      const { error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items-for-recipes'] });
      toast({ title: 'Preço atualizado em todas as receitas!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar preço', variant: 'destructive' });
    },
  });

  return {
    recipes,
    categories,
    inventoryItems,
    isLoading: recipesLoading || categoriesLoading,
    addRecipe: addRecipeMutation.mutateAsync,
    updateRecipe: updateRecipeMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutate,
    duplicateRecipe: duplicateRecipeMutation.mutate,
    deleteRecipe: deleteRecipeMutation.mutate,
    addCategory: addCategoryMutation.mutateAsync,
    reorderCategories: reorderCategoriesMutation.mutate,
    isAddingRecipe: addRecipeMutation.isPending,
    isUpdatingRecipe: updateRecipeMutation.isPending,
    getAvailableSubRecipes,
    hasCircularDependency,
    updateItemPrice: updateItemPriceMutation.mutateAsync,
  };
}