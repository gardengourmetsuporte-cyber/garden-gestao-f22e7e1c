import { useRef, useState, useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { SortableList } from '@/components/ui/sortable-list';
import type { TaskCategory } from '@/types/agenda';

interface CategoryChipsProps {
  categories: TaskCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onDeleteCategory?: (id: string) => void;
  onAddCategory?: () => void;
  onReorderCategories?: (reordered: TaskCategory[]) => void;
}

export function CategoryChips({ categories, selectedCategoryId, onSelectCategory, onDeleteCategory, onAddCategory, onReorderCategories }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 8);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', updateFades, { passive: true });
    return () => {
      el?.removeEventListener('scroll', updateFades);
    };
  }, [categories]);

  const chipClass = (isActive: boolean, isDragging?: boolean) =>
    cn(
      'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 group shadow-sm',
      isDragging && 'shadow-lg ring-2 ring-primary/30 z-50',
      isActive ? 'text-white shadow-lg' : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
    );

  return (
    <div className="relative">
      {showLeftFade && <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />}
      {showRightFade && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <button onClick={() => onSelectCategory(null)} className={cn('px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 shadow-sm', selectedCategoryId === null ? 'bg-primary text-primary-foreground shadow-primary/30' : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground')}>Todos</button>
        {onReorderCategories ? (
          <SortableList items={categories} getItemId={(cat) => cat.id} onReorder={onReorderCategories} direction="horizontal" className="flex gap-2"
            renderItem={(cat, { isDragging, dragHandleProps }) => (
              <button key={cat.id} onClick={() => onSelectCategory(cat.id)} className={chipClass(selectedCategoryId === cat.id, isDragging)} style={selectedCategoryId === cat.id ? { backgroundColor: cat.color } : undefined} {...dragHandleProps}>
                <span className={cn('w-2.5 h-2.5 rounded-full', selectedCategoryId !== cat.id && 'block')} style={{ backgroundColor: cat.color }} />
                {cat.name}
                {onDeleteCategory && (<span className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteCategory(cat.id); }}><AppIcon name="X" size={14} /></span>)}
              </button>
            )} />
        ) : (
          categories.map((cat) => (
            <button key={cat.id} onClick={() => onSelectCategory(cat.id)} className={chipClass(selectedCategoryId === cat.id)} style={selectedCategoryId === cat.id ? { backgroundColor: cat.color } : undefined}>
              <span className={cn('w-2.5 h-2.5 rounded-full', selectedCategoryId !== cat.id && 'block')} style={{ backgroundColor: cat.color }} />
              {cat.name}
              {onDeleteCategory && (<span className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteCategory(cat.id); }}><AppIcon name="X" size={14} /></span>)}
            </button>
          ))
        )}
        {onAddCategory && (<button onClick={onAddCategory} className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0 bg-card border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"><AppIcon name="Plus" size={16} /></button>)}
      </div>
    </div>
  );
}
