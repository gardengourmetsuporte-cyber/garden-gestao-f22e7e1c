import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './ProductCard';
import type { MenuGroup, MenuProduct } from '@/hooks/useMenuAdmin';

interface Props {
  group: MenuGroup | null;
  products: MenuProduct[];
  getOptionCount: (productId: string) => number;
  onNewProduct: () => void;
  onEditProduct: (product: MenuProduct) => void;
  onDeleteProduct: (id: string) => void;
  onLinkOptions: (productId: string) => void;
}

export function MenuGroupContent({
  group, products, getOptionCount,
  onNewProduct, onEditProduct, onDeleteProduct, onLinkOptions,
}: Props) {
  if (!group) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Selecione um grupo</p>
        <p className="empty-state-text">Escolha um grupo no menu lateral para ver seus produtos</p>
      </div>
    );
  }

  const avail = group.availability as any;

  return (
    <div className="space-y-4">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{group.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {avail?.tablet && <Badge variant="secondary" className="text-[9px]">Mesa</Badge>}
            {avail?.delivery && <Badge variant="secondary" className="text-[9px]">Delivery</Badge>}
            <span className="text-xs text-muted-foreground">{products.length} {products.length === 1 ? 'produto' : 'produtos'}</span>
          </div>
        </div>
        <Button size="sm" onClick={onNewProduct}>
          <Plus className="w-4 h-4 mr-1" /> Novo Produto
        </Button>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="empty-state py-12">
          <p className="empty-state-title">Nenhum produto</p>
          <p className="empty-state-text">Adicione produtos a este grupo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              optionCount={getOptionCount(p.id)}
              onEdit={() => onEditProduct(p)}
              onDelete={() => onDeleteProduct(p.id)}
              onLinkOptions={() => onLinkOptions(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
