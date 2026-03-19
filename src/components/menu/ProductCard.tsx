import { useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
import type { MenuProduct } from '@/hooks/useMenuAdmin';
...
function FichaTecnicaCard({
  product,
  onEditRecipe,
  onEdit,
}: {
  product: MenuProduct;
  onEditRecipe?: (product: MenuProduct) => void;
  onEdit: () => void;
}) {
  const { calculateOperationalCosts } = useRecipeCostSettings();

  const hasRecipe = !!(product as any).recipe_id;
  const price = Number(product.price || 0);
  const recipeBaseCost = Number((product as any).recipe_base_cost ?? 0);
  const savedCost = Number((product as any).cost_per_portion || 0);

  const realCost = hasRecipe && recipeBaseCost > 0
    ? recipeBaseCost + calculateOperationalCosts(recipeBaseCost, price).totalOperational
    : savedCost;

  const cost = Number.isFinite(realCost) ? realCost : 0;
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
  const profit = price - cost;

  const marginColor = margin >= 30
    ? 'text-success'
    : margin >= 15
      ? 'text-warning'
      : 'text-destructive';

  const cmv = price > 0 && cost > 0 ? (cost / price) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors active:scale-[0.98] cursor-pointer"
      onClick={() => onEditRecipe?.(product)}
    >
      {/* Image */}
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-secondary/60 border border-border/30">
          <span className="text-base font-bold text-muted-foreground">{product.name?.charAt(0)?.toUpperCase() || '?'}</span>
        </div>
      )}

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
        {product.codigo_pdv && (
          <span className="text-[9px] text-muted-foreground">PDV: {product.codigo_pdv}</span>
        )}
      </div>

      {/* Stats */}
      {hasRecipe && cost > 0 ? (
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground uppercase">CMV</p>
            <p className={cn("text-xs font-bold", cmv <= 30 ? 'text-success' : cmv <= 40 ? 'text-warning' : 'text-destructive')}>
              {cmv.toFixed(0)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground uppercase">Margem</p>
            <p className={cn("text-xs font-bold", marginColor)}>{margin.toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground uppercase">Lucro</p>
            <p className={cn("text-xs font-bold", profit >= 0 ? 'text-success' : 'text-destructive')}>{formatPrice(profit)}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{formatPrice(price)}</span>
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded-full font-semibold",
            hasRecipe ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
          )}>
            {hasRecipe ? 'Sem custo' : 'Sem ficha'}
          </span>
        </div>
      )}
    </div>
  );
}
