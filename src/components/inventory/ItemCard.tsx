import { Package, ChevronRight } from 'lucide-react';
import { InventoryItem, UnitType } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: InventoryItem;
  onClick: () => void;
}

function getUnitLabel(unitType: UnitType): string {
  switch (unitType) {
    case 'unidade': return 'un';
    case 'kg': return 'kg';
    case 'litro': return 'L';
  }
}

function getStockStatus(item: InventoryItem): 'ok' | 'low' | 'out' {
  if (item.currentStock === 0) return 'out';
  if (item.currentStock <= item.minStock) return 'low';
  return 'ok';
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const status = getStockStatus(item);
  const unitLabel = getUnitLabel(item.unitType);

  return (
    <button
      onClick={onClick}
      className="stock-card w-full text-left transition-all hover:shadow-md active:scale-[0.98] animate-slide-up"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          status === 'ok' && "bg-success/10",
          status === 'low' && "bg-warning/10",
          status === 'out' && "bg-destructive/10"
        )}>
          <Package className={cn(
            "w-6 h-6",
            status === 'ok' && "text-success",
            status === 'low' && "text-warning",
            status === 'out' && "text-destructive"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.category}</p>
        </div>

        <div className="text-right shrink-0">
          <p className={cn(
            "text-lg font-bold",
            status === 'ok' && "text-foreground",
            status === 'low' && "text-warning",
            status === 'out' && "text-destructive"
          )}>
            {item.currentStock.toFixed(item.unitType === 'unidade' ? 0 : 2)} {unitLabel}
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

        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}
