import { Package, ChevronRight, Edit2 } from 'lucide-react';
import { InventoryItem } from '@/types/database';
import { cn } from '@/lib/utils';

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
  if (item.current_stock <= item.min_stock) return 'low';
  return 'ok';
}

export function ItemCard({ item, onClick, onEdit }: ItemCardProps) {
  const status = getStockStatus(item);
  const unitLabel = getUnitLabel(item.unit_type);
  const categoryColor = item.category?.color || '#6b7280';

  return (
    <div className="stock-card w-full transition-all hover:shadow-md animate-slide-up">
      <div className="flex items-center gap-3">
        {/* Category Color Indicator */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <Package 
            className="w-6 h-6"
            style={{ color: categoryColor }}
          />
        </div>

        {/* Item Info */}
        <button
          onClick={onClick}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
          <p 
            className="text-sm font-medium truncate"
            style={{ color: categoryColor }}
          >
            {item.category?.name || 'Sem categoria'}
          </p>
        </button>

        {/* Stock Info */}
        <div className="text-right shrink-0">
          <p className={cn(
            "text-lg font-bold",
            status === 'ok' && "text-foreground",
            status === 'low' && "text-warning",
            status === 'out' && "text-destructive"
          )}>
            {item.current_stock.toFixed(item.unit_type === 'unidade' ? 0 : 2)}
            <span className="text-sm font-normal text-muted-foreground ml-1">{unitLabel}</span>
          </p>
          <span className={cn(
            "status-badge",
            status === 'ok' && "status-ok",
            status === 'low' && "status-low",
            status === 'out' && "status-out"
          )}>
            {status === 'ok' && 'OK'}
            {status === 'low' && 'Baixo'}
            {status === 'out' && 'Zerado'}
          </span>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        <button onClick={onClick} className="shrink-0">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
