import { Star, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RewardProduct } from '@/hooks/useRewards';

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
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-12 h-12 text-primary/40" />
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
          {isOutOfStock && (
            <Badge variant="secondary" className="shrink-0">Esgotado</Badge>
          )}
        </div>
        
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-bold text-lg">{product.points_cost}</span>
          <span className="text-sm text-muted-foreground">pontos</span>
        </div>
        
        {product.stock !== null && product.stock > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {product.stock} disponíveis
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          disabled={isDisabled}
          onClick={() => onRedeem(product)}
        >
          {isRedeeming ? 'Resgatando...' : 
           isOutOfStock ? 'Esgotado' :
           !canAfford ? `Faltam ${product.points_cost - userBalance} pontos` :
           'Resgatar'}
        </Button>
      </CardFooter>
    </Card>
  );
}
