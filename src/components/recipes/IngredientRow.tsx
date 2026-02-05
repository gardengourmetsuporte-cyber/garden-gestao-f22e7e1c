 import { X } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { formatCurrency, type RecipeUnitType, calculateIngredientCost } from '@/types/recipe';
 
 interface IngredientRowProps {
   ingredient: {
     item_id: string;
     item_name: string;
     item_unit: string;
     item_price: number;
     quantity: number;
     unit_type: RecipeUnitType;
     total_cost: number;
   };
   onChange: (updates: { quantity: number; unit_type: RecipeUnitType; total_cost: number }) => void;
   onRemove: () => void;
 }
 
 const UNIT_OPTIONS: { value: RecipeUnitType; label: string; group: string }[] = [
   { value: 'unidade', label: 'un', group: 'unidade' },
   { value: 'kg', label: 'kg', group: 'peso' },
   { value: 'g', label: 'g', group: 'peso' },
   { value: 'litro', label: 'L', group: 'volume' },
   { value: 'ml', label: 'ml', group: 'volume' },
 ];
 
 // Get compatible units based on item's unit type
 function getCompatibleUnits(itemUnit: string): RecipeUnitType[] {
   if (itemUnit === 'kg') return ['kg', 'g'];
   if (itemUnit === 'litro') return ['litro', 'ml'];
   return ['unidade'];
 }
 
 export function IngredientRow({ ingredient, onChange, onRemove }: IngredientRowProps) {
   const compatibleUnits = getCompatibleUnits(ingredient.item_unit);
   
   const handleQuantityChange = (value: string) => {
     const quantity = parseFloat(value) || 0;
     const total_cost = calculateIngredientCost(
       ingredient.item_price,
       ingredient.item_unit,
       quantity,
       ingredient.unit_type
     );
     onChange({ quantity, unit_type: ingredient.unit_type, total_cost });
   };
   
   const handleUnitChange = (unit_type: RecipeUnitType) => {
     const total_cost = calculateIngredientCost(
       ingredient.item_price,
       ingredient.item_unit,
       ingredient.quantity,
       unit_type
     );
     onChange({ quantity: ingredient.quantity, unit_type, total_cost });
   };
   
   return (
     <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl">
       <div className="flex-1 min-w-0">
         <p className="font-medium text-sm truncate">{ingredient.item_name}</p>
         <p className="text-xs text-muted-foreground">
           {formatCurrency(ingredient.item_price)}/{ingredient.item_unit}
         </p>
       </div>
       
       <div className="flex items-center gap-2">
         <Input
           type="number"
           value={ingredient.quantity || ''}
           onChange={(e) => handleQuantityChange(e.target.value)}
           className="w-20 h-9 text-center"
           placeholder="Qtd"
           min="0"
           step="0.01"
         />
         
         <Select value={ingredient.unit_type} onValueChange={handleUnitChange}>
           <SelectTrigger className="w-16 h-9">
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
         
         <div className="w-20 text-right">
           <span className="text-sm font-medium text-primary">
             {formatCurrency(ingredient.total_cost)}
           </span>
         </div>
         
         <Button
           type="button"
           variant="ghost"
           size="icon"
           className="h-8 w-8 text-muted-foreground hover:text-destructive"
           onClick={onRemove}
         >
           <X className="h-4 w-4" />
         </Button>
       </div>
     </div>
   );
 }