 import { Plus, X } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Button } from '@/components/ui/button';
 import type { TaskCategory } from '@/types/agenda';
 
 interface CategoryChipsProps {
   categories: TaskCategory[];
   selectedCategoryId: string | null;
   onSelectCategory: (id: string | null) => void;
   onDeleteCategory?: (id: string) => void;
   onAddCategory?: () => void;
 }
 
 export function CategoryChips({
   categories,
   selectedCategoryId,
   onSelectCategory,
   onDeleteCategory,
   onAddCategory,
 }: CategoryChipsProps) {
   return (
     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
       <button
         onClick={() => onSelectCategory(null)}
         className={cn(
           'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
           selectedCategoryId === null
             ? 'bg-primary text-primary-foreground'
             : 'bg-muted text-muted-foreground hover:bg-muted/80'
         )}
       >
         Todos
       </button>
       
       {categories.map((cat) => (
         <button
           key={cat.id}
           onClick={() => onSelectCategory(cat.id)}
           className={cn(
             'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 group',
             selectedCategoryId === cat.id
               ? 'text-white'
               : 'bg-muted text-muted-foreground hover:bg-muted/80'
           )}
           style={selectedCategoryId === cat.id ? { backgroundColor: cat.color } : undefined}
         >
           <span
             className={cn('w-2.5 h-2.5 rounded-full', selectedCategoryId !== cat.id && 'block')}
             style={{ backgroundColor: cat.color }}
           />
           {cat.name}
           {onDeleteCategory && (
             <X
               className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
               onClick={(e) => {
                 e.stopPropagation();
                 onDeleteCategory(cat.id);
               }}
             />
           )}
         </button>
       ))}
 
       {onAddCategory && (
         <Button
           variant="ghost"
           size="sm"
           onClick={onAddCategory}
           className="rounded-full shrink-0 h-8 w-8 p-0"
         >
           <Plus className="w-4 h-4" />
         </Button>
       )}
     </div>
   );
 }