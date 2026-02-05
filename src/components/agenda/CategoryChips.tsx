 import { Plus, X } from 'lucide-react';
 import { cn } from '@/lib/utils';
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
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
       <button
         onClick={() => onSelectCategory(null)}
         className={cn(
          'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 shadow-sm',
           selectedCategoryId === null
            ? 'bg-primary text-primary-foreground shadow-primary/30'
            : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
         )}
       >
         Todos
       </button>
       
       {categories.map((cat) => (
         <button
           key={cat.id}
           onClick={() => onSelectCategory(cat.id)}
           className={cn(
          'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 group shadow-sm',
             selectedCategoryId === cat.id
            ? 'text-white shadow-lg'
            : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
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
        <button
           onClick={onAddCategory}
          className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0 
            bg-card border border-dashed border-border text-muted-foreground
            hover:border-primary hover:text-primary transition-all"
         >
           <Plus className="w-4 h-4" />
        </button>
       )}
     </div>
   );
 }