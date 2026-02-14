import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
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
      <div className="card-base p-6">
        <div className="empty-state py-8">
          <div className="icon-glow icon-glow-lg icon-glow-muted mx-auto mb-3">
            <AppIcon name="Package" size={24} />
          </div>
          <p className="empty-state-title">Selecione um grupo</p>
          <p className="empty-state-text">Escolha um grupo acima para ver seus produtos</p>
        </div>
      </div>
    );
  }

  const avail = group.availability as any;

  return (
    <div className="space-y-3">
      {/* Group Header */}
      <div className="card-base p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-glow icon-glow-md icon-glow-primary">
              <AppIcon name="Package" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{group.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {avail?.tablet && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                    background: 'hsl(var(--neon-cyan) / 0.1)', color: 'hsl(var(--neon-cyan))',
                  }}>Mesa</span>
                )}
                {avail?.delivery && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                    background: 'hsl(var(--neon-green) / 0.1)', color: 'hsl(var(--neon-green))',
                  }}>Delivery</span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {products.length} {products.length === 1 ? 'produto' : 'produtos'}
                </span>
              </div>
            </div>
          </div>
          <Button size="sm" onClick={onNewProduct} className="gap-1.5">
            <AppIcon name="Plus" size={14} /> Novo
          </Button>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="card-base p-6">
          <div className="empty-state py-6">
            <div className="icon-glow icon-glow-lg icon-glow-muted mx-auto mb-3">
              <AppIcon name="ShoppingBag" size={24} />
            </div>
            <p className="empty-state-title">Nenhum produto</p>
            <p className="empty-state-text mb-4">Adicione produtos a este grupo</p>
            <Button size="sm" onClick={onNewProduct}>
              <AppIcon name="Plus" size={14} className="mr-1.5" /> Adicionar Produto
            </Button>
          </div>
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
