import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';
import type { MenuGroup, MenuProduct } from '@/hooks/useMenuAdmin';

const formatPrice = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  group: MenuGroup | null;
  products: MenuProduct[];
  getOptionCount: (productId: string) => number;
  onNewProduct: () => void;
  onEditProduct: (product: MenuProduct) => void;
  onDeleteProduct: (id: string) => void;
  onLinkOptions: (productId: string) => void;
  onImageUpload?: (productId: string, file: File) => void;
  onToggleProductAvailability?: (product: MenuProduct, channel: 'tablet' | 'delivery') => void;
  onEditRecipe?: (product: MenuProduct) => void;
  viewMode?: 'menu' | 'ficha';
}

export function MenuGroupContent({
  group, products, getOptionCount,
  onNewProduct, onEditProduct, onDeleteProduct, onLinkOptions, onImageUpload, onToggleProductAvailability,
  onEditRecipe, viewMode = 'menu',
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

  if (viewMode === 'ficha') {
    return (
      <FichaGroupContent
        group={group}
        products={products}
        onEditProduct={onEditProduct}
        onEditRecipe={onEditRecipe}
      />
    );
  }

  const avail = group.availability as any;

  return (
    <div className="space-y-3">
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
              onToggleAvailability={onToggleProductAvailability}
              viewMode="menu"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ====== FICHA TÉCNICA GROUP VIEW ====== */
function FichaGroupContent({
  group,
  products,
  onEditProduct,
  onEditRecipe,
}: {
  group: MenuGroup;
  products: MenuProduct[];
  onEditProduct: (product: MenuProduct) => void;
  onEditRecipe?: (product: MenuProduct) => void;
}) {
  const linked = products.filter(p => !!(p as any).recipe_id);
  const withCost = linked.filter(p => (p as any).cost_per_portion > 0);
  const totalCost = withCost.reduce((s, p) => s + ((p as any).cost_per_portion || 0), 0);
  const totalSale = withCost.reduce((s, p) => s + p.price, 0);
  const avgMargin = withCost.length > 0
    ? withCost.reduce((sum, p) => {
        const cost = (p as any).cost_per_portion || 0;
        return sum + (cost > 0 ? ((p.price - cost) / cost) * 100 : 0);
      }, 0) / withCost.length
    : 0;

  const marginColor = avgMargin >= 200 ? 'text-success' : avgMargin >= 100 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-3">
      {/* Group Header — ficha focused */}
      <div className="card-base p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="icon-glow icon-glow-md icon-glow-primary">
            <AppIcon name="ChefHat" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{group.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              {linked.length}/{products.length} com ficha · {withCost.length} com custo
            </p>
          </div>
          {avgMargin > 0 && (
            <span className={cn("text-sm font-bold", marginColor)}>
              ~{avgMargin.toFixed(0)}%
            </span>
          )}
        </div>

        {withCost.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-destructive/10 p-2 text-center">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Custo méd.</p>
              <p className="text-xs font-bold text-destructive">{formatPrice(totalCost / withCost.length)}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-2 text-center">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Venda méd.</p>
              <p className="text-xs font-bold text-foreground">{formatPrice(totalSale / withCost.length)}</p>
            </div>
            <div className="rounded-xl bg-success/10 p-2 text-center">
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Lucro méd.</p>
              <p className="text-xs font-bold text-success">{formatPrice((totalSale - totalCost) / withCost.length)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <EmptyState
          icon="ChefHat"
          title="Nenhum produto"
          subtitle="Este grupo não possui produtos"
        />
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              optionCount={0}
              onEdit={() => onEditProduct(p)}
              onDelete={() => {}}
              onLinkOptions={() => {}}
              onEditRecipe={onEditRecipe}
              viewMode="ficha"
            />
          ))}
        </div>
      )}
    </div>
  );
}
