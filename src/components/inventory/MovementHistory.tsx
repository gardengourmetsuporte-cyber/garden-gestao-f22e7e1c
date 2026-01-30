import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { StockMovement, InventoryItem, UnitType } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface MovementHistoryProps {
  movements: StockMovement[];
  items: InventoryItem[];
  showItemName?: boolean;
}

function getUnitLabel(unitType: UnitType): string {
  switch (unitType) {
    case 'unidade': return 'un';
    case 'kg': return 'kg';
    case 'litro': return 'L';
  }
}

export function MovementHistory({ movements, items, showItemName = false }: MovementHistoryProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma movimentação registrada</p>
      </div>
    );
  }

  // Group movements by date
  const groupedMovements = movements.reduce((groups, movement) => {
    const date = format(new Date(movement.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(movement);
    return groups;
  }, {} as Record<string, StockMovement[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedMovements).map(([date, dayMovements]) => {
        const formattedDate = format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR });
        
        return (
          <div key={date}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
              {formattedDate}
            </h3>
            <div className="space-y-2">
              {dayMovements.map((movement) => {
                const item = items.find(i => i.id === movement.itemId);
                if (!item) return null;

                return (
                  <div
                    key={movement.id}
                    className="stock-card flex items-center gap-3 animate-slide-up"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      movement.type === 'entrada' ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      {movement.type === 'entrada' ? (
                        <ArrowUpCircle className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {showItemName && (
                        <p className="font-medium truncate">{item.name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(movement.createdAt), 'HH:mm')}
                        {movement.notes && ` • ${movement.notes}`}
                      </p>
                    </div>

                    <div className={cn(
                      "text-right font-bold",
                      movement.type === 'entrada' ? "text-success" : "text-destructive"
                    )}>
                      {movement.type === 'entrada' ? '+' : '-'}
                      {movement.quantity.toFixed(item.unitType === 'unidade' ? 0 : 2)} {getUnitLabel(item.unitType)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
