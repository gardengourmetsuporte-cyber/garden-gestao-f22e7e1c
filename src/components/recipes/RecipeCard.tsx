import { MoreVertical, Copy, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getLucideIcon } from '@/lib/icons';
import { formatCurrency, type Recipe } from '@/types/recipe';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  onDelete: (id: string) => void;
}

export function RecipeCard({
  recipe,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: RecipeCardProps) {
  const CategoryIcon = getLucideIcon(recipe.category?.icon || 'ChefHat');

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-2xl border bg-card cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]',
        !recipe.is_active && 'opacity-50'
      )}
      onClick={() => onEdit(recipe)}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${recipe.category?.color || '#6366f1'}15` }}
      >
        {CategoryIcon && (
          <CategoryIcon
            className="w-5 h-5"
            style={{ color: recipe.category?.color || '#6366f1' }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-sm text-foreground truncate">{recipe.name}</h3>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{formatCurrency(recipe.cost_per_portion)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{recipe.ingredients?.length ?? 0} itens</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(recipe.id); }}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive(recipe.id, !recipe.is_active); }}>
            {recipe.is_active ? (
              <><ToggleLeft className="h-4 w-4 mr-2" />Inativar</>
            ) : (
              <><ToggleRight className="h-4 w-4 mr-2" />Ativar</>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
