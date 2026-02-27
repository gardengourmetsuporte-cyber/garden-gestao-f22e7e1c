import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { RewardProduct } from '@/hooks/useRewards';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: RewardProduct;
  userBalance: number;
  onRedeem: (product: RewardProduct) => void;
  isRedeeming?: boolean;
}

export function ProductCard({ product, userBalance, onRedeem, isRedeeming }: ProductCardProps) {
  const canAfford = userBalance >= product.points_cost;
  const isOutOfStock = product.stock !== null && product.stock <= 0;
  const isDisabled = !canAfford || isOutOfStock || isRedeeming;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onRedeem(product)}
      className={cn(
        "card-base w-full flex items-center gap-4 p-3 text-left transition-all",
        "active:scale-[0.98] hover:shadow-lg hover:border-primary/20",
        isDisabled && "opacity-60 pointer-events-none"
      )}
    >
      {/* Image */}
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <AppIcon name="Gift" size={32} className="text-primary/40" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{product.name}</h3>
          {isOutOfStock && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Esgotado</Badge>
          )}
        </div>
        
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500/15 text-amber-500 dark:text-amber-400 rounded-full px-2 py-0.5">
            <AppIcon name="Star" size={12} />
            <span className="font-bold text-xs">{product.points_cost}</span>
          </div>
          
          {product.stock !== null && product.stock > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {product.stock} restantes
            </span>
          )}

          {!canAfford && !isOutOfStock && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              Faltam {product.points_cost - userBalance}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      {canAfford && !isOutOfStock && (
        <AppIcon name="ChevronRight" size={18} className="text-muted-foreground/50 shrink-0" />
      )}
    </button>
  );
}
