import { useState, useEffect, useMemo } from 'react';
 import { Plus } from 'lucide-react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { IngredientRow } from './IngredientRow';
 import { IngredientPicker } from './IngredientPicker';
import { OperationalCostsSection } from './OperationalCostsSection';
import { formatCurrency, calculateIngredientCost, calculateSubRecipeCost, type Recipe, type RecipeCategory, type RecipeUnitType, type IngredientSourceType } from '@/types/recipe';
import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
 
 interface LocalIngredient {
   id?: string;
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
 }
 
 interface InventoryItem {
   id: string;
   name: string;
   unit_type: string;
   unit_price: number;
  recipe_unit_type?: string | null;
  recipe_unit_price?: number | null;
   category?: { id: string; name: string; color: string } | null;
 }
 
interface SubRecipeItem {
  id: string;
  name: string;
  yield_unit: string;
  cost_per_portion: number;
  category?: { id: string; name: string; color: string } | null;
}

 interface RecipeSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   recipe: Recipe | null;
   categories: RecipeCategory[];
   inventoryItems: InventoryItem[];
  subRecipes: SubRecipeItem[];
   onSave: (data: any) => Promise<void>;
   isSaving: boolean;
  defaultCategoryId?: string | null;
 }
 
 export function RecipeSheet({
   open,
   onOpenChange,
   recipe,
   categories,
   inventoryItems,
  subRecipes,
   onSave,
   isSaving,
  defaultCategoryId,
 }: RecipeSheetProps) {
   const [name, setName] = useState('');
   const [categoryId, setCategoryId] = useState<string>('');
   const [yieldQuantity, setYieldQuantity] = useState('1');
   const [yieldUnit, setYieldUnit] = useState('unidade');
   const [notes, setNotes] = useState('');
   const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
   const [pickerOpen, setPickerOpen] = useState(false);
  
  // Hook para custos operacionais
  const { settings, calculateOperationalCosts } = useRecipeCostSettings();
   
   // Reset form when recipe changes
   useEffect(() => {
     if (recipe) {
       setName(recipe.name);
       setCategoryId(recipe.category_id || '');
       setYieldQuantity(String(recipe.yield_quantity));
       setYieldUnit(recipe.yield_unit);
       setNotes(recipe.preparation_notes || '');
       setIngredients(
         (recipe.ingredients || []).map((ing) => ({
           id: ing.id,
          source_type: (ing.source_type || 'inventory') as IngredientSourceType,
          item_id: ing.item_id || null,
          item_name: ing.item?.name || null,
         item_unit: ing.item?.recipe_unit_type || ing.item?.unit_type || null,
         item_price: ing.unit_cost || ing.item?.recipe_unit_price || ing.item?.unit_price || null,
         original_item_price: ing.item?.recipe_unit_price ?? ing.item?.unit_price,
          source_recipe_id: ing.source_recipe_id || null,
          source_recipe_name: ing.source_recipe?.name || null,
          source_recipe_unit: ing.source_recipe?.yield_unit || null,
          source_recipe_cost: ing.source_recipe?.cost_per_portion || null,
           quantity: ing.quantity,
           unit_type: ing.unit_type,
           total_cost: ing.total_cost,
         }))
       );
     } else {
       setName('');
       setCategoryId('');
       setYieldQuantity('1');
       setYieldUnit('unidade');
       setNotes('');
       setIngredients([]);
     }
  }, [recipe, open, defaultCategoryId]);
  
  // Apply default category when opening for new recipe
  useEffect(() => {
    if (open && !recipe && defaultCategoryId) {
      setCategoryId(defaultCategoryId);
    }
  }, [open, recipe, defaultCategoryId]);
   
   const totalCost = ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
   const costPerPortion = parseFloat(yieldQuantity) > 0 ? totalCost / parseFloat(yieldQuantity) : totalCost;
  
  // Calcular custos operacionais baseado no custo por porção
  const operationalCosts = useMemo(
    () => calculateOperationalCosts(costPerPortion),
    [costPerPortion, settings]
  );
  
  const totalWithOperational = costPerPortion + operationalCosts.totalOperational;
   
  const handleAddInventoryItem = (item: InventoryItem) => {
     // Use recipe-specific unit and price if available
     const effectiveUnit = (item.recipe_unit_type || item.unit_type) as RecipeUnitType;
     const effectivePrice = item.recipe_unit_price ?? item.unit_price ?? 0;
     const defaultQuantity = 1;
     const cost = calculateIngredientCost(effectivePrice, effectiveUnit, defaultQuantity, effectiveUnit);
     
     setIngredients((prev) => [
       ...prev,
       {
        source_type: 'inventory',
         item_id: item.id,
         item_name: item.name,
         item_unit: effectiveUnit,
         item_price: effectivePrice,
        original_item_price: effectivePrice,
        source_recipe_id: null,
        source_recipe_name: null,
        source_recipe_unit: null,
        source_recipe_cost: null,
         quantity: defaultQuantity,
         unit_type: effectiveUnit,
         total_cost: cost,
       },
     ]);
   };
   
  const handleAddSubRecipe = (subRecipe: SubRecipeItem) => {
    const defaultUnit = subRecipe.yield_unit as RecipeUnitType;
    const defaultQuantity = 1;
    const cost = calculateSubRecipeCost(subRecipe.cost_per_portion, subRecipe.yield_unit, defaultQuantity, defaultUnit);
    
    setIngredients((prev) => [
      ...prev,
      {
        source_type: 'recipe',
        item_id: null,
        item_name: null,
        item_unit: null,
        item_price: null,
        source_recipe_id: subRecipe.id,
        source_recipe_name: subRecipe.name,
        source_recipe_unit: subRecipe.yield_unit,
        source_recipe_cost: subRecipe.cost_per_portion,
        quantity: defaultQuantity,
        unit_type: defaultUnit,
        total_cost: cost,
      },
    ]);
  };
  
   const handleIngredientChange = (
     index: number,
    updates: Partial<LocalIngredient>
   ) => {
     setIngredients((prev) =>
       prev.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
     );
   };
   
   const handleRemoveIngredient = (index: number) => {
     setIngredients((prev) => prev.filter((_, i) => i !== index));
   };
   
   const handleSubmit = async () => {
     if (!name.trim()) return;
     
     const data = {
       ...(recipe?.id && { id: recipe.id }),
       name: name.trim(),
       category_id: categoryId || null,
       yield_quantity: parseFloat(yieldQuantity) || 1,
       yield_unit: yieldUnit,
       preparation_notes: notes.trim() || null,
       ingredients: ingredients.map((ing) => ({
         ...(ing.id && { id: ing.id }),
         item_id: ing.item_id,
         quantity: ing.quantity,
         unit_type: ing.unit_type,
        unit_cost: ing.source_type === 'recipe' ? ing.source_recipe_cost || 0 : ing.item_price || 0,
         total_cost: ing.total_cost,
        source_type: ing.source_type,
        source_recipe_id: ing.source_recipe_id,
       })),
     };
     
     await onSave(data);
     onOpenChange(false);
   };
   
   return (
     <>
      <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 [&>button]:hidden">
            <SheetHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle>{recipe ? 'Editar Ficha' : 'Nova Ficha Técnica'}</SheetTitle>
                <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </SheetHeader>
           
           <ScrollArea className="h-[calc(100vh-80px)]">
             <div className="p-4 space-y-6">
               {/* Basic Info */}
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="name">Nome da Receita</Label>
                   <Input
                     id="name"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder="Ex: X-Burguer Tradicional"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label>Categoria</Label>
                   <Select value={categoryId} onValueChange={setCategoryId}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione..." />
                     </SelectTrigger>
                     <SelectContent>
                       {categories.map((cat) => (
                         <SelectItem key={cat.id} value={cat.id}>
                           {cat.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="yield">Rendimento</Label>
                     <Input
                       id="yield"
                       type="number"
                       value={yieldQuantity}
                       onChange={(e) => setYieldQuantity(e.target.value)}
                       min="1"
                       step="1"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Unidade</Label>
                     <Select value={yieldUnit} onValueChange={setYieldUnit}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="unidade">Unidades</SelectItem>
                         <SelectItem value="porção">Porções</SelectItem>
                         <SelectItem value="kg">kg</SelectItem>
                         <SelectItem value="litro">Litros</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>
               
               {/* Ingredients */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <Label className="text-base font-semibold">Ingredientes</Label>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => setPickerOpen(true)}
                   >
                     <Plus className="h-4 w-4 mr-1" />
                     Adicionar
                   </Button>
                 </div>
                 
                 {ingredients.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                     <p>Nenhum ingrediente adicionado</p>
                     <p className="text-sm">Clique em "Adicionar" para começar</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {ingredients.map((ingredient, index) => (
                       <IngredientRow
                      key={ingredient.source_type === 'recipe' 
                        ? `recipe-${ingredient.source_recipe_id}` 
                        : `item-${ingredient.item_id}-${index}`}
                         ingredient={ingredient}
                         onChange={(updates) => handleIngredientChange(index, updates)}
                         onRemove={() => handleRemoveIngredient(index)}
                       />
                     ))}
                   </div>
                 )}
               </div>
               
              {/* Operational Costs Section */}
              <OperationalCostsSection
                operationalCosts={operationalCosts}
                settings={settings}
              />
              
               {/* Cost Summary */}
               <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Custo Ingredientes</span>
                   <span className="text-lg font-bold text-primary">
                     {formatCurrency(totalCost)}
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Custo por Porção (ingredientes)</span>
                  <span className="text-sm font-medium">
                     {formatCurrency(costPerPortion)}
                   </span>
                 </div>
                {operationalCosts.totalOperational > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                    <span className="text-muted-foreground font-semibold">Custo Total por Porção</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(totalWithOperational)}
                    </span>
                  </div>
                )}
               </div>
               
               {/* Notes */}
               <div className="space-y-2">
                 <Label htmlFor="notes">Observações (opcional)</Label>
                 <Textarea
                   id="notes"
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                   placeholder="Modo de preparo, dicas..."
                   rows={4}
                 />
               </div>
             </div>
           </ScrollArea>
         </SheetContent>
       </Sheet>
       
       <IngredientPicker
         open={pickerOpen}
         onOpenChange={setPickerOpen}
         items={inventoryItems}
          subRecipes={subRecipes}
          excludeIds={ingredients.filter(i => i.source_type === 'inventory' && i.item_id).map((i) => i.item_id!)}
          excludeRecipeIds={[...(recipe?.id ? [recipe.id] : []), ...ingredients.filter(i => i.source_type === 'recipe' && i.source_recipe_id).map((i) => i.source_recipe_id!)]}
          onSelectItem={handleAddInventoryItem}
          onSelectSubRecipe={handleAddSubRecipe}
       />
     </>
   );
 }