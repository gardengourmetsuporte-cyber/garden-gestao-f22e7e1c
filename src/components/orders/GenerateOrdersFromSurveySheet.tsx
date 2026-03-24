import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { useOrders } from '@/hooks/useOrders';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface SurveyOrderItem {
  itemId: string;
  itemName: string;
  unitType: string;
  currentStock: number;
  minStock: number;
  suggestedQty: number;
  unitPrice: number;
  supplierId: string;
  supplierName: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SurveyOrderItem[];
}

export function GenerateOrdersFromSurveySheet({ open, onOpenChange, items: initialItems }: Props) {
  const { createOrder } = useOrders();
  const [items, setItems] = useState<(SurveyOrderItem & { qty: number })[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset items when sheet opens
  useState(() => {
    if (open) {
      setItems(initialItems.map(i => ({ ...i, qty: Math.max(1, i.suggestedQty) })));
    }
  });

  // Re-sync when initialItems change
  useMemo(() => {
    if (open) {
      setItems(initialItems.map(i => ({ ...i, qty: Math.max(1, i.suggestedQty) })));
    }
  }, [open, initialItems]);

  const grouped = useMemo(() => {
    const map: Record<string, { supplierName: string; supplierId: string; items: typeof items }> = {};
    items.forEach(item => {
      if (!map[item.supplierId]) {
        map[item.supplierId] = { supplierName: item.supplierName, supplierId: item.supplierId, items: [] };
      }
      map[item.supplierId].items.push(item);
    });
    return Object.values(map);
  }, [items]);

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  const updateQty = (itemId: string, qty: number) => {
    setItems(prev => prev.map(i => i.itemId === itemId ? { ...i, qty: Math.max(0, qty) } : i));
  };

  const handleGenerate = async () => {
    const validGroups = grouped.filter(g => g.items.some(i => i.qty > 0));
    if (validGroups.length === 0) {
      toast.error('Nenhum item com quantidade válida');
      return;
    }

    setLoading(true);
    try {
      for (const group of validGroups) {
        const orderItems = group.items
          .filter(i => i.qty > 0)
          .map(i => ({ item_id: i.itemId, quantity: i.qty, unit_price: i.unitPrice }));
        if (orderItems.length > 0) {
          await createOrder(group.supplierId, orderItems);
        }
      }
      toast.success(`${validGroups.length} pedido(s) rascunho criado(s)!`);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao gerar pedidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-base font-bold">Gerar Pedidos</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Itens agrupados pelo fornecedor com melhor preço. Edite as quantidades antes de confirmar.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
          {grouped.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <AppIcon name="Package" size={24} />
              <p className="text-sm">Nenhum item para pedir</p>
            </div>
          )}

          {grouped.map(group => {
            const total = group.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
            return (
              <div key={group.supplierId} className="card-glass rounded-xl overflow-hidden">
                {/* Supplier header */}
                <div className="bg-primary/10 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Truck" size={14} className="text-primary" />
                    <span className="text-sm font-bold text-foreground">{group.supplierName}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-border/20">
                  {group.items.map(item => (
                    <div key={item.itemId} className="px-3 py-2.5 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{item.itemName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            Estoque: {item.currentStock}/{item.minStock} {item.unitType}
                          </span>
                          <span className="text-[10px] font-semibold text-primary tabular-nums">
                            R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={e => updateQty(item.itemId, Number(e.target.value))}
                        className="w-16 h-8 text-center text-sm rounded-lg px-1"
                      />
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors shrink-0"
                      >
                        <AppIcon name="X" size={12} className="text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border/30">
          <Button
            onClick={handleGenerate}
            disabled={loading || items.filter(i => i.qty > 0).length === 0}
            className="w-full h-12 text-sm font-bold"
          >
            {loading ? (
              <AppIcon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <>
                <AppIcon name="ShoppingCart" size={16} />
                Gerar {grouped.filter(g => g.items.some(i => i.qty > 0)).length} Pedido(s)
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
