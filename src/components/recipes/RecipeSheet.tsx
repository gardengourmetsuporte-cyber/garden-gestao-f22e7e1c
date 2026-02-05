 import { useState, useEffect } from 'react';
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
 import { formatCurrency, calculateIngredientCost, type Recipe, type RecipeCategory, type RecipeUnitType } from '@/types/recipe';
 
 interface LocalIngredient {
   id?: string;
   item_id: string;
   item_name: string;
   item_unit: string;
   item_price: number;
   quantity: number;
   unit_type: RecipeUnitType;
   total_cost: number;
 }
 
 interface InventoryItem {
   id: string;
   name: string;
   unit_type: string;
   unit_price: number;
   category?: { id: string; name: string; color: string } | null;
 }
 
 interface RecipeSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   recipe: Recipe | null;
   categories: RecipeCategory[];
   inventoryItems: InventoryItem[];
   onSave: (data: any) => Promise<void>;
   isSaving: boolean;
 }
 
 export function RecipeSheet({
   open,
   onOpenChange,
   recipe,
   categories,
   inventoryItems,
   onSave,
   isSaving,
 }: RecipeSheetProps) {
   const [name, setName] = useState('');
   const [categoryId, setCategoryId] = useState<string>('');
   const [yieldQuantity, setYieldQuantity] = useState('1');
   const [yieldUnit, setYieldUnit] = useState('unidade');
   const [notes, setNotes] = useState('');
   const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
   const [pickerOpen, setPickerOpen] = useState(false);
   
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
           item_id: ing.item_id,
           item_name: ing.item?.name || '',
           item_unit: ing.item?.unit_type || 'unidade',
           item_price: ing.item?.unit_price || 0,
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
   }, [recipe, open]);
   
   const totalCost = ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
   const costPerPortion = parseFloat(yieldQuantity) > 0 ? totalCost / parseFloat(yieldQuantity) : totalCost;
   
   const handleAddIngredient = (item: InventoryItem) => {
     const defaultUnit = item.unit_type as RecipeUnitType;
     const defaultQuantity = 1;
     const cost = calculateIngredientCost(item.unit_price || 0, item.unit_type, defaultQuantity, defaultUnit);
     
     setIngredients((prev) => [
       ...prev,
       {
         item_id: item.id,
         item_name: item.name,
         item_unit: item.unit_type,
         item_price: item.unit_price || 0,
         quantity: defaultQuantity,
         unit_type: defaultUnit,
         total_cost: cost,
       },
     ]);
   };
   
   const handleIngredientChange = (
     index: number,
     updates: { quantity: number; unit_type: RecipeUnitType; total_cost: number }
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
         unit_cost: ing.item_price,
         total_cost: ing.total_cost,
       })),
     };
     
     await onSave(data);
     onOpenChange(false);
   };
   
   return (
     <>
       <Sheet open={open} onOpenChange={onOpenChange}>
         <SheetContent side="right" className="w-full sm:max-w-lg p-0">
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
                         key={ingredient.item_id}
                         ingredient={ingredient}
                         onChange={(updates) => handleIngredientChange(index, updates)}
                         onRemove={() => handleRemoveIngredient(index)}
                       />
                     ))}
                   </div>
                 )}
               </div>
               
               {/* Cost Summary */}
               <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
                 <div className="flex justify-between items-center">
                   <span className="text-muted-foreground">Custo Total</span>
                   <span className="text-lg font-bold text-primary">
                     {formatCurrency(totalCost)}
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-muted-foreground">Custo por Porção</span>
                   <span className="text-lg font-bold text-primary">
                     {formatCurrency(costPerPortion)}
                   </span>
                 </div>
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
         excludeIds={ingredients.map((i) => i.item_id)}
         onSelect={handleAddIngredient}
       />
     </>
   );
 }