 export type RecipeUnitType = 'unidade' | 'kg' | 'g' | 'litro' | 'ml';
export type IngredientSourceType = 'inventory' | 'recipe';
 
 export interface RecipeCategory {
   id: string;
   name: string;
   color: string;
   icon: string | null;
   sort_order: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface Recipe {
   id: string;
   name: string;
   category_id: string | null;
   yield_quantity: number;
   yield_unit: string;
   preparation_notes: string | null;
   is_active: boolean;
   total_cost: number;
   cost_per_portion: number;
   cost_updated_at: string | null;
   created_at: string;
   updated_at: string;
   // Joined data
   category?: RecipeCategory;
   ingredients?: RecipeIngredient[];
 }
 
 export interface RecipeIngredient {
   id: string;
   recipe_id: string;
  item_id: string | null;
   quantity: number;
   unit_type: RecipeUnitType;
   unit_cost: number;
   total_cost: number;
   sort_order: number;
   created_at: string;
  source_type: IngredientSourceType;
  source_recipe_id: string | null;
   // Joined data
   item?: {
     id: string;
     name: string;
     unit_type: string;
     unit_price: number;
    recipe_unit_type?: string | null;
    recipe_unit_price?: number | null;
     category?: { name: string; color: string } | null;
   };
  source_recipe?: {
    id: string;
    name: string;
    yield_unit: string;
    cost_per_portion: number;
    category?: { name: string; color: string } | null;
  };
 }
 
 // Unit conversion utilities
 export const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
   kg: { kg: 1, g: 1000 },
   g: { kg: 0.001, g: 1 },
   litro: { litro: 1, ml: 1000 },
   ml: { litro: 0.001, ml: 1 },
   unidade: { unidade: 1 },
 };
 
 export function convertUnit(
   quantity: number,
   fromUnit: string,
   toUnit: string
 ): number {
   // Same unit, no conversion needed
   if (fromUnit === toUnit) return quantity;
   
   // Check if conversion exists
   const conversions = UNIT_CONVERSIONS[fromUnit];
   if (!conversions || !conversions[toUnit]) {
     // Try reverse conversion
     const reverseConversions = UNIT_CONVERSIONS[toUnit];
     if (reverseConversions && reverseConversions[fromUnit]) {
       return quantity / reverseConversions[fromUnit];
     }
     // No conversion available, return as is
     return quantity;
   }
   
   return quantity * conversions[toUnit];
 }
 
 export function calculateIngredientCost(
   itemPrice: number,
   itemUnit: string,
   recipeQuantity: number,
   recipeUnit: string
 ): number {
   // Convert recipe quantity to item's unit
   const convertedQty = convertUnit(recipeQuantity, recipeUnit, itemUnit);
   return convertedQty * itemPrice;
 }
 
 export function formatCurrency(value: number): string {
   return new Intl.NumberFormat('pt-BR', {
     style: 'currency',
     currency: 'BRL',
   }).format(value);
 }

// Calculate cost for sub-recipe ingredient
export function calculateSubRecipeCost(
  subRecipeCostPerPortion: number,
  subRecipeYieldUnit: string,
  recipeQuantity: number,
  recipeUnit: string
): number {
  // Convert recipe quantity to sub-recipe's yield unit
  const convertedQty = convertUnit(recipeQuantity, recipeUnit, subRecipeYieldUnit);
  return convertedQty * subRecipeCostPerPortion;
}

// Get compatible units for a base unit
export function getCompatibleUnits(baseUnit: string): RecipeUnitType[] {
  if (baseUnit === 'kg' || baseUnit === 'g') return ['kg', 'g'];
  if (baseUnit === 'litro' || baseUnit === 'ml') return ['litro', 'ml'];
  return ['unidade'];
}