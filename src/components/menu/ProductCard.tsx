import { AppIcon } from '@/components/ui/app-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { MenuProduct } from '@/hooks/useMenuAdmin';

interface Props {
  product: MenuProduct;
  optionCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onLinkOptions: () => void;
}

const formatPrice = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProductCard({ product, optionCount, onEdit, onDelete, onLinkOptions }: Props) {
  const avail = product.availability as any;

  return (
    <div
      className="card-interactive flex items-center gap-3 p-3 group"
      onClick={onEdit}
    >
      {/* Image */}
      <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          background: 'hsl(var(--secondary) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🍽️</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
          {product.is_highlighted && (
            <AppIcon name="Star" size={12} className="text-warning shrink-0" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--neon-amber) / 0.5))' }} />
          )}
        </div>
        {product.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{product.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {product.codigo_pdv && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
              background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))',
            }}>PDV: {product.codigo_pdv}</span>
          )}
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
          {optionCount > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
              background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))',
            }}>{optionCount} {optionCount === 1 ? 'opcional' : 'opcionais'}</span>
          )}
          {!product.is_active && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
              background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))',
            }}>Inativo</span>
          )}
        </div>
      </div>

      {/* Price + Actions */}
      <div className="text-right shrink-0 flex items-center gap-1">
        <span className="font-bold text-sm" style={{ color: 'hsl(var(--neon-green))' }}>{formatPrice(product.price)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="p-1.5 rounded-lg hover:bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(); }}>
              <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onLinkOptions(); }}>
              <AppIcon name="Link" size={14} className="mr-2" /> Opcionais
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-destructive">
              <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
