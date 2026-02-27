import { useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MenuProduct } from '@/hooks/useMenuAdmin';

interface Props {
  product: MenuProduct;
  optionCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onLinkOptions: () => void;
  onImageUpload?: (productId: string, file: File) => void;
  onToggleAvailability?: (product: MenuProduct, channel: 'tablet' | 'delivery') => void;
}

const formatPrice = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProductCard({ product, optionCount, onEdit, onDelete, onLinkOptions, onImageUpload, onToggleAvailability }: Props) {
  const avail = product.availability as any;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onImageUpload) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(product.id, file);
    }
    e.target.value = '';
  };

  return (
    <div
      className="card-interactive flex items-center gap-3 p-3 group"
    >
      {/* Image — clickable for upload */}
      <div
        className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center relative cursor-pointer bg-secondary/60 border border-border/30"
        onClick={handleImageClick}
      >
        {product.image_url ? (
          <>
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <AppIcon name="Camera" size={16} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <AppIcon name="Camera" size={16} className="text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground">Foto</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
          {product.is_highlighted && (
            <AppIcon name="Star" size={12} className="text-primary shrink-0" fill={1} />
          )}
        </div>
        {product.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{product.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {product.codigo_pdv && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-secondary text-muted-foreground">PDV: {product.codigo_pdv}</span>
          )}
          {onToggleAvailability ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleAvailability(product, 'tablet'); }}
              className={cn(
                "text-[8px] px-1.5 py-0.5 rounded-full font-semibold transition-colors",
                avail?.tablet ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50 line-through"
              )}
            >Mesa</button>
          ) : avail?.tablet ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-success/15 text-success">Mesa</span>
          ) : null}
          {onToggleAvailability ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleAvailability(product, 'delivery'); }}
              className={cn(
                "text-[8px] px-1.5 py-0.5 rounded-full font-semibold transition-colors",
                avail?.delivery ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50 line-through"
              )}
            >Delivery</button>
          ) : avail?.delivery ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-success/15 text-success">Delivery</span>
          ) : null}
          {optionCount > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">{optionCount} {optionCount === 1 ? 'opcional' : 'opcionais'}</span>
          )}
          {!product.is_active && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">Inativo</span>
          )}
        </div>
      </div>

      {/* Price + Actions */}
      <div className="text-right shrink-0 flex items-center gap-1">
        <span className="font-bold text-sm text-primary">{formatPrice(product.price)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLinkOptions}>
              <AppIcon name="Link" size={14} className="mr-2" /> Opcionais
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}