import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
  onImageUpload?: (productId: string, file: File) => void;
}

export function MenuGroupContent({
  group, products, getOptionCount,
  onNewProduct, onEditProduct, onDeleteProduct, onLinkOptions, onImageUpload,
}: Props) {
  if (!group) {
    return (
      <EmptyState
        icon="Package"
        title="Selecione um grupo"
        subtitle="Escolha um grupo acima para ver seus produtos"
      />
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
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">Mesa</span>
                )}
                {avail?.delivery && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">Delivery</span>
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
        <EmptyState
          icon="ShoppingBag"
          title="Nenhum produto"
          subtitle="Adicione produtos a este grupo"
          actionLabel="Adicionar Produto"
          onAction={onNewProduct}
        />
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
              onImageUpload={onImageUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
}