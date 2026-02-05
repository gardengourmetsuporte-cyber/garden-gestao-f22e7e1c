import { useState } from 'react';
import { X, Pencil } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onChange: (updates: { quantity?: number; unit_type?: RecipeUnitType; total_cost?: number; item_price?: number }) => void;
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
  const [priceOpen, setPriceOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState(ingredient.item_price.toString());
   
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
   
  const handlePriceSave = () => {
    const newPrice = parseFloat(tempPrice) || 0;
    const total_cost = calculateIngredientCost(
      newPrice,
      ingredient.item_unit,
      ingredient.quantity,
      ingredient.unit_type
    );
    onChange({ item_price: newPrice, total_cost });
    setPriceOpen(false);
  };
  
   return (
    <div className="p-3 bg-secondary/30 rounded-xl space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{ingredient.item_name}</p>
          <Popover open={priceOpen} onOpenChange={(o) => {
            setPriceOpen(o);
            if (o) setTempPrice(ingredient.item_price.toString());
          }}>
            <PopoverTrigger asChild>
              <button className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 flex items-center gap-1">
                {formatCurrency(ingredient.item_price)}/{ingredient.item_unit}
                <Pencil className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Preço por {ingredient.item_unit}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  className="h-9"
                  placeholder="0,00"
                />
                <Button size="sm" className="w-full" onClick={handlePriceSave}>
                  Salvar Preço
                </Button>
              </div>
            </PopoverContent>
          </Popover>
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
       
      <div className="flex items-center gap-2">
         <Input
           type="number"
           value={ingredient.quantity || ''}
           onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-20 h-9 text-center flex-shrink-0"
           placeholder="Qtd"
           min="0"
           step="0.01"
         />
         
         <Select value={ingredient.unit_type} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-16 h-9 flex-shrink-0">
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
         
        <div className="flex-1 text-right">
          <span className="text-sm font-semibold text-primary">
             {formatCurrency(ingredient.total_cost)}
           </span>
         </div>
       </div>
     </div>
   );
 }