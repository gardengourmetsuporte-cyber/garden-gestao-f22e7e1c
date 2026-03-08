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
  onEditRecipe?: (product: MenuProduct) => void;
  viewMode?: 'menu' | 'ficha';
}

const formatPrice = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProductCard({ product, optionCount, onEdit, onDelete, onLinkOptions, onImageUpload, onToggleAvailability, onEditRecipe, viewMode = 'menu' }: Props) {
  if (viewMode === 'ficha') {
    return (
      <FichaTecnicaCard
        product={product}
        onEditRecipe={onEditRecipe}
        onEdit={onEdit}
      />
    );
  }

  return (
    <MenuModeCard
      product={product}
      optionCount={optionCount}
      onEdit={onEdit}
      onDelete={onDelete}
      onLinkOptions={onLinkOptions}
      onImageUpload={onImageUpload}
      onToggleAvailability={onToggleAvailability}
    />
  );
}

/* ====== MENU MODE (original) ====== */
function MenuModeCard({
  product, optionCount, onEdit, onDelete, onLinkOptions, onImageUpload, onToggleAvailability,
}: Omit<Props, 'viewMode' | 'onEditRecipe'>) {
  const avail = product.availability as any;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onImageUpload) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) onImageUpload(product.id, file);
    e.target.value = '';
  };

  return (
    <div className="card-interactive flex items-center gap-3 p-3 group">
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
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
          {product.is_highlighted && <AppIcon name="Star" size={12} className="text-primary shrink-0" fill={1} />}
        </div>
        {product.description && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{product.description}</p>}
        <div className="flex items-center gap-1.5 mt-1.5">
          {product.codigo_pdv && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-secondary text-muted-foreground">PDV: {product.codigo_pdv}</span>
          )}
          {onToggleAvailability ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleAvailability(product, 'tablet'); }}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors active:scale-95 min-h-[28px]",
                avail?.tablet ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50 line-through"
              )}
            >Mesa</button>
          ) : avail?.tablet ? (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-success/15 text-success">Mesa</span>
          ) : null}
          {onToggleAvailability ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleAvailability(product, 'delivery'); }}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors active:scale-95 min-h-[28px]",
                avail?.delivery ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50 line-through"
              )}
            >Delivery</button>
          ) : avail?.delivery ? (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-success/15 text-success">Delivery</span>
          ) : null}
          {optionCount > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">{optionCount} {optionCount === 1 ? 'opcional' : 'opcionais'}</span>
          )}
          {!product.is_active && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">Inativo</span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-1">
        <span className="font-bold text-sm text-primary">{formatPrice(product.price)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-secondary/60 transition-opacity">
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

/* ====== FICHA TÉCNICA MODE ====== */
function FichaTecnicaCard({
  product,
  onEditRecipe,
  onEdit,
}: {
  product: MenuProduct;
  onEditRecipe?: (product: MenuProduct) => void;
  onEdit: () => void;
}) {
  const cost = (product as any).cost_per_portion || 0;
  const hasRecipe = !!(product as any).recipe_id;
  const price = product.price;
  const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
  const profit = price - cost;


  const marginBg = margin >= 200
    ? 'bg-success/15 text-success'
    : margin >= 100
      ? 'bg-warning/15 text-warning'
      : 'bg-destructive/15 text-destructive';

  return (
    <div className="card-interactive p-3 space-y-2.5">
      {/* Row 1: Name + margin badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
            {!product.is_active && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive shrink-0">Inativo</span>
            )}
          </div>
          {product.codigo_pdv && (
            <span className="text-[10px] text-muted-foreground">PDV: {product.codigo_pdv}</span>
          )}
        </div>
        {hasRecipe && cost > 0 ? (
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold shrink-0", marginBg)}>
            {margin.toFixed(0)}% margem
          </span>
        ) : (
          <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-muted text-muted-foreground shrink-0">
            Sem ficha
          </span>
        )}
      </div>

      {/* Row 2: Price breakdown */}
      {hasRecipe && cost > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Custo</p>
            <p className="text-sm font-bold text-destructive mt-0.5">{formatPrice(cost)}</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Venda</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{formatPrice(price)}</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Lucro</p>
            <p className={cn("text-sm font-bold mt-0.5", profit >= 0 ? 'text-success' : 'text-destructive')}>
              {formatPrice(profit)}
            </p>
          </div>
        </div>
      ) : hasRecipe ? (
        <div className="rounded-xl bg-warning/10 border border-warning/20 p-2.5 flex items-center gap-2">
          <AppIcon name="AlertTriangle" size={14} className="text-warning shrink-0" />
          <p className="text-[11px] text-warning">Ficha vinculada mas sem custo calculado. Atualize os custos.</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">Preço de venda: <span className="font-bold text-foreground">{formatPrice(price)}</span></p>
          </div>
        </div>
      )}

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        {hasRecipe ? (
          <button
            onClick={() => onEditRecipe?.(product)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold transition-colors hover:bg-primary/20 active:scale-[0.97]"
          >
            <AppIcon name="FileEdit" size={14} />
            Editar Ficha
          </button>
        ) : (
          <button
            onClick={() => onEditRecipe?.(product)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold transition-colors hover:bg-primary/20 active:scale-[0.97]"
          >
            <AppIcon name="Link" size={14} />
            Vincular Ficha
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/60 text-muted-foreground text-xs font-semibold transition-colors hover:bg-secondary active:scale-[0.97]"
        >
          <AppIcon name="Pencil" size={14} />
          Produto
        </button>
      </div>
    </div>
  );
}
