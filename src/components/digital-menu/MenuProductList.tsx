import { DMCategory, DMGroup, DMProduct } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Props {
  categories: DMCategory[];
  groups: DMGroup[];
  products: DMProduct[];
  getGroupProducts: (groupId: string) => DMProduct[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectProduct: (product: DMProduct) => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MenuProductList({
  categories, groups, products, getGroupProducts,
  selectedCategory, onSelectCategory, onSelectProduct,
}: Props) {
  // Filter groups by selected category
  const visibleGroups = selectedCategory
    ? groups.filter(g => g.category_id === selectedCategory)
    : groups;

  // Products not in any group
  const ungroupedProducts = selectedCategory
    ? products.filter(p => !p.group_id && p.category === categories.find(c => c.id === selectedCategory)?.name)
    : products.filter(p => !p.group_id);

  return (
    <div className="flex flex-col gap-4">
      {/* Category chips */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 py-1">
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
              !selectedCategory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-secondary'
            )}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-secondary'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Grouped products */}
      <div className="px-4 space-y-6 pb-20">
        {visibleGroups.map(group => {
          const groupProducts = getGroupProducts(group.id);
          if (groupProducts.length === 0) return null;
          return (
            <div key={group.id}>
              <h2 className="text-lg font-bold text-foreground mb-3">{group.name}</h2>
              {group.description && (
                <p className="text-xs text-muted-foreground mb-3 -mt-1">{group.description}</p>
              )}
              <div className="space-y-2">
                {groupProducts.map(product => (
                  <ProductRow key={product.id} product={product} onSelect={onSelectProduct} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Ungrouped */}
        {ungroupedProducts.length > 0 && (
          <div>
            {visibleGroups.length > 0 && (
              <h2 className="text-lg font-bold text-foreground mb-3">Outros</h2>
            )}
            <div className="space-y-2">
              {ungroupedProducts.map(product => (
                <ProductRow key={product.id} product={product} onSelect={onSelectProduct} />
              ))}
            </div>
          </div>
        )}

        {visibleGroups.length === 0 && ungroupedProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AppIcon name="UtensilsCrossed" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum produto disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product, onSelect }: { product: DMProduct; onSelect: (p: DMProduct) => void }) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all active:scale-[0.98] text-left"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <AppIcon name="Image" size={24} className="text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        <p className="text-sm font-bold text-primary mt-1.5">{formatPrice(product.price)}</p>
      </div>
      {product.is_highlighted && (
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-warning/15 text-[hsl(var(--warning))] text-[10px] font-bold">
          ★
        </span>
      )}
    </button>
  );
}
