 import { X, Package, Soup, AlertTriangle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { formatCurrency, type RecipeUnitType, type IngredientSourceType, calculateIngredientCost, calculateSubRecipeCost, getCompatibleUnits } from '@/types/recipe';
 import { cn } from '@/lib/utils';
 
 interface IngredientRowProps {
   ingredient: {
     source_type: IngredientSourceType;
     item_id: string | null;
     item_name: string | null;
     item_unit: string | null;
     item_price: number | null;
     original_item_price?: number;
     source_recipe_id: string | null;
     source_recipe_name: string | null;
     source_recipe_unit: string | null;
     source_recipe_cost: number | null;
     quantity: number;
     unit_type: RecipeUnitType;
     total_cost: number;
   };
   onChange: (updates: Partial<IngredientRowProps['ingredient']>) => void;
   onRemove: () => void;
 }
 
 const UNIT_OPTIONS: { value: RecipeUnitType; label: string }[] = [
   { value: 'unidade', label: 'un' },
   { value: 'kg', label: 'kg' },
   { value: 'g', label: 'g' },
   { value: 'litro', label: 'L' },
   { value: 'ml', label: 'ml' },
 ];
 
 export function IngredientRow({ ingredient, onChange, onRemove }: IngredientRowProps) {
   const isSubRecipe = ingredient.source_type === 'recipe';
   const baseUnit = isSubRecipe ? ingredient.source_recipe_unit : ingredient.item_unit;
   const compatibleUnits = getCompatibleUnits(baseUnit || 'unidade');
   
   const basePrice = isSubRecipe 
     ? ingredient.source_recipe_cost || 0 
     : ingredient.item_price || 0;
   
   const displayName = isSubRecipe 
     ? ingredient.source_recipe_name 
     : ingredient.item_name;
   
   const displayUnit = baseUnit || 'unidade';
   
   const hasPriceChanged = !isSubRecipe && 
     ingredient.original_item_price !== undefined && 
     ingredient.item_price !== ingredient.original_item_price;
   
   const handleQuantityChange = (value: string) => {
     const quantity = parseFloat(value) || 0;
     const total_cost = isSubRecipe
       ? calculateSubRecipeCost(basePrice, displayUnit, quantity, ingredient.unit_type)
       : calculateIngredientCost(basePrice, displayUnit, quantity, ingredient.unit_type);
     onChange({ quantity, total_cost });
   };
   
   const handleUnitChange = (unit_type: RecipeUnitType) => {
     const total_cost = isSubRecipe
       ? calculateSubRecipeCost(basePrice, displayUnit, ingredient.quantity, unit_type)
       : calculateIngredientCost(basePrice, displayUnit, ingredient.quantity, unit_type);
     onChange({ unit_type, total_cost });
   };
   
   const handlePriceChange = (value: string) => {
     if (isSubRecipe) return;
     const newPrice = parseFloat(value) || 0;
     const total_cost = calculateIngredientCost(newPrice, displayUnit, ingredient.quantity, ingredient.unit_type);
     onChange({ item_price: newPrice, total_cost });
   };
   
   return (
     <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
       {/* Header */}
       <div className="flex items-center justify-between gap-2">
         <div className="flex items-center gap-2 flex-1 min-w-0">
           <div className={cn(
             "p-1.5 rounded-lg shrink-0",
             isSubRecipe ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-primary/10 text-primary"
           )}>
             {isSubRecipe ? <Soup className="h-4 w-4" /> : <Package className="h-4 w-4" />}
           </div>
           <div className="min-w-0">
             <p className="font-medium text-sm truncate">{displayName}</p>
             <p className="text-xs text-muted-foreground">
               {isSubRecipe ? 'Sub-receita' : 'Estoque'}
             </p>
           </div>
         </div>
         <Button
           type="button"
           variant="ghost"
           size="icon"
           className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
           onClick={onRemove}
         >
           <X className="h-4 w-4" />
         </Button>
       </div>
       
       {/* Price Row */}
       <div className="space-y-1">
         <Label className="text-xs text-muted-foreground">
           {isSubRecipe ? 'Custo por porção (ficha técnica)' : 'Preço base'}
         </Label>
         <div className="flex items-center gap-2">
           {isSubRecipe ? (
             <div className="flex-1 h-9 px-3 flex items-center bg-muted/50 rounded-md text-sm">
               {formatCurrency(basePrice)}/{displayUnit}
             </div>
           ) : (
             <div className="flex-1 flex items-center gap-1">
               <span className="text-muted-foreground text-sm">R$</span>
               <Input
                 type="number"
                 step="0.01"
                 min="0"
                 value={ingredient.item_price || ''}
                 onChange={(e) => handlePriceChange(e.target.value)}
                 className="h-9"
               />
               <span className="text-muted-foreground text-sm">/{displayUnit}</span>
             </div>
           )}
         </div>
         {hasPriceChanged && (
           <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
             <AlertTriangle className="h-3 w-3" />
             <span>Estoque: {formatCurrency(ingredient.original_item_price || 0)}</span>
           </div>
         )}
       </div>
       
       {/* Quantity Row */}
       <div className="flex items-end gap-3">
         <div className="flex-1 space-y-1">
           <Label className="text-xs text-muted-foreground">Quantidade</Label>
           <div className="flex gap-2">
             <Input
               type="number"
               value={ingredient.quantity || ''}
               onChange={(e) => handleQuantityChange(e.target.value)}
               className="h-9 flex-1"
               placeholder="0"
               min="0"
               step="0.01"
             />
             <Select value={ingredient.unit_type} onValueChange={handleUnitChange}>
               <SelectTrigger className="w-20 h-9">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {UNIT_OPTIONS.filter((u) => compatibleUnits.includes(u.value)).map((unit) => (
                   <SelectItem key={unit.value} value={unit.value}>
                     {unit.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
         
         <div className="text-right pb-1">
           <p className="text-xs text-muted-foreground">Custo</p>
           <p className="text-lg font-bold text-primary">{formatCurrency(ingredient.total_cost)}</p>
         </div>
       </div>
     </div>
   );
 }