 import { useState, useMemo } from 'react';
 import { Search, ChevronDown, ChevronRight } from 'lucide-react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { formatCurrency, type RecipeUnitType } from '@/types/recipe';
 import { cn } from '@/lib/utils';
 
 interface InventoryItem {
   id: string;
   name: string;
   unit_type: string;
   unit_price: number;
   category?: { id: string; name: string; color: string } | null;
 }
 
 interface IngredientPickerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   items: InventoryItem[];
   excludeIds: string[];
   onSelect: (item: InventoryItem) => void;
 }
 
 export function IngredientPicker({
   open,
   onOpenChange,
   items,
   excludeIds,
   onSelect,
 }: IngredientPickerProps) {
   const [search, setSearch] = useState('');
   const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
   
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
   
   const handleSelect = (item: InventoryItem) => {
     onSelect(item);
     onOpenChange(false);
     setSearch('');
   };
   
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
         <SheetHeader className="pb-4">
           <SheetTitle>Adicionar Ingrediente</SheetTitle>
         </SheetHeader>
         
         <div className="relative mb-4">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Buscar no estoque..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-10"
           />
         </div>
         
         <ScrollArea className="h-[calc(80vh-140px)]">
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
                           onClick={() => handleSelect(item)}
                           className={cn(
                             'flex items-center justify-between w-full p-3 rounded-xl',
                             'hover:bg-secondary transition-colors text-left'
                           )}
                         >
                           <span className="font-medium">{item.name}</span>
                           <span className="text-sm text-muted-foreground">
                             {formatCurrency(item.unit_price || 0)}/{item.unit_type}
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
       </SheetContent>
     </Sheet>
   );
 }