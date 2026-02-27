import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { DMProduct } from '@/hooks/useDigitalMenu';

interface Props {
  products: DMProduct[];
  onSelectProduct: (product: DMProduct) => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MenuSearch({ products, onSelectProduct }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [query, products]);

  return (
    <div className="px-4 pb-20 space-y-4">
      <div className="relative">
        <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar no cardápio..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 h-12"
          autoFocus
        />
      </div>

      {query.trim() && filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum produto encontrado
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(product => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all active:scale-[0.98] text-left"
          >
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" loading="lazy" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <AppIcon name="Image" size={20} className="text-muted-foreground/40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
              {product.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
              )}
              <p className="text-sm font-bold text-primary mt-1">{formatPrice(product.price)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
