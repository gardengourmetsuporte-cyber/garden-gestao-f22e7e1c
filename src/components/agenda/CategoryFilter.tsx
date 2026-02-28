import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskCategory } from '@/types/agenda';

interface CategoryFilterProps {
  categories: TaskCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelectCategory }: CategoryFilterProps) {
  return (
    <Select
      value={selectedCategoryId || 'all'}
      onValueChange={v => onSelectCategory(v === 'all' ? null : v)}
    >
      <SelectTrigger className="h-11 rounded-xl text-xs font-semibold w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center gap-2">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>category</span>
            Todas as categorias
          </span>
        </SelectItem>
        {categories.map(cat => (
          <SelectItem key={cat.id} value={cat.id}>
            <span className="flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: cat.color }}>{cat.icon || 'label'}</span>
              {cat.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
