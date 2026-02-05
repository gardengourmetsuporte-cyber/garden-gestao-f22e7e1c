 export type RecipeUnitType = 'unidade' | 'kg' | 'g' | 'litro' | 'ml';
 
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
   item_id: string;
   quantity: number;
   unit_type: RecipeUnitType;
   unit_cost: number;
   total_cost: number;
   sort_order: number;
   created_at: string;
   // Joined data
   item?: {
     id: string;
     name: string;
     unit_type: string;
     unit_price: number;
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