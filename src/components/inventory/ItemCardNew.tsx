import { InventoryItem } from '@/types/database';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface ItemCardProps {
  item: InventoryItem;
  onClick: () => void;
  onEdit?: () => void;
}

function getUnitLabel(unitType: string): string {
  switch (unitType) {
    case 'unidade': return 'un';
    case 'kg': return 'kg';
    case 'litro': return 'L';
    default: return unitType;
  }
}

function getStockStatus(item: InventoryItem): 'ok' | 'low' | 'out' {
  if (item.current_stock === 0) return 'out';
  if (item.current_stock < item.min_stock) return 'low';
  return 'ok';
}

export function ItemCard({ item, onClick, onEdit }: ItemCardProps) {
  const status = getStockStatus(item);
  const unitLabel = getUnitLabel(item.unit_type);
  const categoryColor = item.category?.color || '#6b7280';

  return (
    <div
      onClick={onClick}
      className="card-surface p-3.5 cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        {/* Icon with category color */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${categoryColor}12` }}
        >
          <AppIcon name="Package" size={18} style={{ color: categoryColor }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{item.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColor }} />
            <p className="text-xs text-muted-foreground truncate">
              {item.category?.name || 'Sem categoria'}
            </p>
          </div>
        </div>

        {/* Stock value + badge */}
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <p className={cn(
              "text-base font-bold leading-tight",
              status === 'ok' && "text-foreground",
              status === 'low' && "text-warning",
              status === 'out' && "text-destructive"
            )}>
              {item.current_stock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">{unitLabel}</span>
            </p>
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5",
              status === 'ok' && "bg-success/15 text-success",
              status === 'low' && "bg-warning/15 text-warning",
              status === 'out' && "bg-destructive/15 text-destructive"
            )}>
              {status === 'ok' ? 'OK' : status === 'low' ? 'Baixo' : 'Zerado'}
            </span>
          </div>

          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <AppIcon name="Edit" size={14} />
            </button>
          )}

          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/50 shrink-0" />
        </div>
      </div>
    </div>
  );
}
