import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { StockMovement, InventoryItem } from '@/types/database';
import { cn } from '@/lib/utils';

interface MovementHistoryProps {
  movements: StockMovement[];
  items: InventoryItem[];
  showItemName?: boolean;
}

function getUnitLabel(unitType: string): string {
  switch (unitType) {
    case 'unidade': return 'un';
    case 'kg': return 'kg';
    case 'litro': return 'L';
    default: return unitType;
  }
}

export function MovementHistoryNew({ movements, items, showItemName = false }: MovementHistoryProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma movimentação registrada</p>
      </div>
    );
  }

  // Group movements by date
  const groupedByDate: Record<string, StockMovement[]> = {};
  movements.forEach(movement => {
    const dateKey = format(new Date(movement.created_at), 'yyyy-MM-dd');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(movement);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([dateKey, dayMovements]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
            {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="space-y-2">
            {dayMovements.map((movement) => {
              const item = movement.item || items.find(i => i.id === movement.item_id);
              if (!item) return null;

              const unitLabel = getUnitLabel(item.unit_type);

              return (
                <div
                  key={movement.id}
                  className="stock-card animate-slide-up"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      movement.type === 'entrada' ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      {movement.type === 'entrada' ? (
                        <ArrowDownCircle className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {showItemName && (
                        <p className="font-semibold text-foreground truncate">{item.name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {movement.type === 'entrada' ? 'Entrada' : 'Saída'} • {format(new Date(movement.created_at), 'HH:mm')}
                        {(movement as any).user_name && (
                          <span> • Por: {(movement as any).user_name}</span>
                        )}
                      </p>
                      {movement.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{movement.notes}</p>
                      )}
                    </div>

                    <div className={cn(
                      "text-lg font-bold shrink-0",
                      movement.type === 'entrada' ? "text-success" : "text-destructive"
                    )}>
                      {movement.type === 'entrada' ? '+' : '-'}
                      {movement.quantity.toFixed(item.unit_type === 'unidade' ? 0 : 2)} {unitLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
