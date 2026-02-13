import { Star, MoreVertical, Pencil, Trash2, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      className="list-command flex items-center gap-3 group"
      onClick={onEdit}
    >
      {/* Image */}
      <div className="w-14 h-14 rounded-xl bg-secondary/60 shrink-0 overflow-hidden flex items-center justify-center">
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
          {product.is_highlighted && <Star className="w-3.5 h-3.5 text-warning fill-warning shrink-0" />}
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground truncate">{product.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {product.codigo_pdv && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">PDV: {product.codigo_pdv}</Badge>
          )}
          {avail?.tablet && <Badge variant="secondary" className="text-[8px] px-1 py-0">Mesa</Badge>}
          {avail?.delivery && <Badge variant="secondary" className="text-[8px] px-1 py-0">Delivery</Badge>}
          {optionCount > 0 && (
            <Badge className="text-[8px] px-1.5 py-0 bg-primary/15 text-primary border-0">
              {optionCount} {optionCount === 1 ? 'opcional' : 'opcionais'}
            </Badge>
          )}
          {!product.is_active && <Badge variant="destructive" className="text-[8px] px-1 py-0">Inativo</Badge>}
        </div>
      </div>

      {/* Price + Actions */}
      <div className="text-right shrink-0 flex items-center gap-1">
        <span className="font-bold text-primary text-sm">{formatPrice(product.price)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="p-1.5 rounded-lg hover:bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onLinkOptions(); }}>
              <Link2 className="w-3.5 h-3.5 mr-2" /> Opcionais
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
