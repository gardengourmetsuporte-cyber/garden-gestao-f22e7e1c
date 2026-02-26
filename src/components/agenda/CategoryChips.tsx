import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { TaskCategory } from '@/types/agenda';

interface CategoryChipsProps {
  categories: TaskCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryChips({ categories, selectedCategoryId, onSelectCategory }: CategoryChipsProps) {
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
    return () => { el?.removeEventListener('scroll', updateFades); };
  }, [categories]);

  return (
    <div className="relative">
      {showLeftFade && <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />}
      {showRightFade && <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />}
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0",
            selectedCategoryId === null
              ? "bg-foreground text-background"
              : "bg-secondary/70 text-muted-foreground hover:text-foreground"
          )}
        >
          Todos
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5",
                isSelected
                  ? "text-white shadow-sm"
                  : "bg-secondary/70 text-muted-foreground hover:text-foreground"
              )}
              style={isSelected ? { backgroundColor: cat.color } : undefined}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
