 import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Package, Soup } from 'lucide-react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/types/recipe';
 import { cn } from '@/lib/utils';
 
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

 interface IngredientPickerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   items: InventoryItem[];
  subRecipes: SubRecipeItem[];
   excludeIds: string[];
  excludeRecipeIds: string[];
  onSelectItem: (item: InventoryItem) => void;
  onSelectSubRecipe: (recipe: SubRecipeItem) => void;
 }
 
 export function IngredientPicker({
   open,
   onOpenChange,
   items,
  subRecipes,
   excludeIds,
  excludeRecipeIds,
  onSelectItem,
  onSelectSubRecipe,
 }: IngredientPickerProps) {
   const [search, setSearch] = useState('');
   const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes'>('inventory');
   
   // Filter and group items by category
   const groupedItems = useMemo(() => {
     const filtered = items.filter(
       (item) =>
         !excludeIds.includes(item.id) &&
         item.name.toLowerCase().includes(search.toLowerCase())
     );
     
     const groups: Record<string, { name: string; color: string; items: InventoryItem[] }> = {};
     
     filtered.forEach((item) => {
       const categoryId = item.category?.id || 'sem-categoria';
       const categoryName = item.category?.name || 'Sem categoria';
       const categoryColor = item.category?.color || '#6b7280';
       
       if (!groups[categoryId]) {
         groups[categoryId] = { name: categoryName, color: categoryColor, items: [] };
       }
       groups[categoryId].items.push(item);
     });
     
     return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name));
   }, [items, excludeIds, search]);
   
  // Filter and group sub-recipes by category
  const groupedSubRecipes = useMemo(() => {
    const filtered = subRecipes.filter(
      (recipe) =>
        !excludeRecipeIds.includes(recipe.id) &&
        recipe.name.toLowerCase().includes(search.toLowerCase())
    );
    
    const groups: Record<string, { name: string; color: string; items: SubRecipeItem[] }> = {};
    
    filtered.forEach((recipe) => {
      const categoryId = recipe.category?.id || 'sem-categoria';
      const categoryName = recipe.category?.name || 'Sem categoria';
      const categoryColor = recipe.category?.color || '#6b7280';
      
      if (!groups[categoryId]) {
        groups[categoryId] = { name: categoryName, color: categoryColor, items: [] };
      }
      groups[categoryId].items.push(recipe);
    });
    
    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [subRecipes, excludeRecipeIds, search]);
  
  // Get the effective unit and price for recipe (prefer recipe-specific values)
  const getRecipeDisplay = (item: InventoryItem) => {
    const unit = item.recipe_unit_type || item.unit_type;
    const price = item.recipe_unit_price ?? item.unit_price;
    return { unit, price };
  };

   const toggleCategory = (categoryId: string) => {
     setExpandedCategories((prev) => {
       const next = new Set(prev);
       if (next.has(categoryId)) {
         next.delete(categoryId);
       } else {
         next.add(categoryId);
       }
       return next;
     });
   };
   
  const handleSelectItem = (item: InventoryItem) => {
    onSelectItem(item);
     onOpenChange(false);
     setSearch('');
   };
   
  const handleSelectSubRecipe = (recipe: SubRecipeItem) => {
    onSelectSubRecipe(recipe);
    onOpenChange(false);
    setSearch('');
  };
  
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
         <SheetHeader className="pb-4">
           <SheetTitle>Adicionar Ingrediente</SheetTitle>
         </SheetHeader>
         
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inventory' | 'recipes')} className="flex flex-col h-[calc(80vh-80px)]">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <Soup className="h-4 w-4" />
              Sub-Receitas
            </TabsTrigger>
          </TabsList>
          
         <div className="relative mb-4">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
              placeholder={activeTab === 'inventory' ? 'Buscar no estoque...' : 'Buscar sub-receitas...'}
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-10"
           />
         </div>
         
          <TabsContent value="inventory" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(80vh-220px)]">
              <div className="space-y-2 pb-6">
                {groupedItems.length === 0 ? (
               <p className="text-center text-muted-foreground py-8">
                 Nenhum item encontrado
               </p>
             ) : (
               groupedItems.map(([categoryId, category]) => (
                 <Collapsible
                   key={categoryId}
                   open={expandedCategories.has(categoryId) || search.length > 0}
                   onOpenChange={() => toggleCategory(categoryId)}
                 >
                   <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                     {expandedCategories.has(categoryId) || search.length > 0 ? (
                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
                     ) : (
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     )}
                     <div
                       className="w-3 h-3 rounded-full"
                       style={{ backgroundColor: category.color }}
                     />
                     <span className="font-medium">{category.name}</span>
                     <span className="text-sm text-muted-foreground ml-auto">
                       ({category.items.length})
                     </span>
                   </CollapsibleTrigger>
                   
                   <CollapsibleContent>
                     <div className="ml-6 space-y-1 mt-1">
                       {category.items.map((item) => (
                         <button
                           key={item.id}
                              onClick={() => handleSelectItem(item)}
                           className={cn(
                             'flex items-center justify-between w-full p-3 rounded-xl',
                             'hover:bg-secondary transition-colors text-left'
                           )}
                         >
                           <span className="font-medium">{item.name}</span>
                           <span className="text-sm text-muted-foreground">
                             {formatCurrency(getRecipeDisplay(item).price || 0)}/{getRecipeDisplay(item).unit}
                           </span>
                         </button>
                       ))}
                     </div>
                   </CollapsibleContent>
                 </Collapsible>
               ))
             )}
           </div>
         </ScrollArea>
          </TabsContent>
          
          <TabsContent value="recipes" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(80vh-220px)]">
              <div className="space-y-2 pb-6">
                {groupedSubRecipes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma sub-receita disponível
                  </p>
                ) : (
                  groupedSubRecipes.map(([categoryId, category]) => (
                    <Collapsible
                      key={categoryId}
                      open={expandedCategories.has(categoryId) || search.length > 0}
                      onOpenChange={() => toggleCategory(categoryId)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                        {expandedCategories.has(categoryId) || search.length > 0 ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          ({category.items.length})
                        </span>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1 mt-1">
                          {category.items.map((recipe) => (
                            <button
                              key={recipe.id}
                              onClick={() => handleSelectSubRecipe(recipe)}
                              className={cn(
                                'flex items-center justify-between w-full p-3 rounded-xl',
                                'hover:bg-secondary transition-colors text-left'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Soup className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">{recipe.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(recipe.cost_per_portion)}/{recipe.yield_unit}
                              </span>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
       </SheetContent>
     </Sheet>
   );
 }