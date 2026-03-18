import { useState, useEffect, forwardRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Order, OrderItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ReceivedItem {
  orderItemId: string;
  itemId: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitType: string;
  received: boolean;
}

interface ReceiveOrderSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmReceive: (orderId: string, items: { itemId: string; quantity: number }[]) => Promise<void>;
  onSmartReceive?: () => void;
}

export const ReceiveOrderSheet = forwardRef<HTMLDivElement, ReceiveOrderSheetProps>(function ReceiveOrderSheet({
  order,
  open,
  onOpenChange,
  onConfirmReceive,
  onSmartReceive,
}, ref) {
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order?.order_items) {
      setReceivedItems(
        order.order_items.map(oi => ({
          orderItemId: oi.id,
          itemId: oi.item_id,
          itemName: oi.item?.name || 'Item desconhecido',
          orderedQuantity: oi.quantity,
          receivedQuantity: oi.quantity,
          unitType: oi.item?.unit_type || 'unidade',
          received: true,
        }))
      );
    }
  }, [order]);

  const handleQuantityChange = (orderItemId: string, value: number) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, receivedQuantity: Math.max(0, value) }
          : item
      )
    );
  };

  const handleReceivedToggle = (orderItemId: string) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, received: !item.received, receivedQuantity: !item.received ? item.orderedQuantity : 0 }
          : item
      )
    );
  };

  const handleConfirm = async () => {
    if (!order) return;

    const itemsToAdd = receivedItems
      .filter(item => item.received && item.receivedQuantity > 0)
      .map(item => ({
        itemId: item.itemId,
        quantity: item.receivedQuantity,
      }));

    if (itemsToAdd.length === 0) {
      toast.error('Nenhum item selecionado para receber');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmReceive(order.id, itemsToAdd);
      onOpenChange(false);
    } catch (error) {
      console.error('Error receiving order:', error);
      toast.error('Erro ao receber pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasDiscrepancies = receivedItems.some(
    item => item.received && item.receivedQuantity !== item.orderedQuantity
  );

  const formatUnit = (unit: string) => {
    switch (unit) {
      case 'kg': return 'kg';
      case 'litro': return 'L';
      default: return 'un';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={ref} side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AppIcon name="inventory_2" size={20} className="text-primary" />
            Receber Pedido — {order?.supplier?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Confira os itens recebidos e ajuste as quantidades se necessário.
          </p>

          {/* Smart Receiving Button */}
          {onSmartReceive && (
            <button
              onClick={() => {
                onOpenChange(false);
                onSmartReceive();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name="document_scanner" size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-primary">Escanear Nota Fiscal</p>
                <p className="text-[11px] text-primary/60">Usar IA para ler a DANFE</p>
              </div>
            </button>
          )}

          {/* Items list */}
          <div className="space-y-2">
            {receivedItems.map(item => (
              <div
                key={item.orderItemId}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.received
                    ? 'bg-card border-border/30'
                    : 'bg-secondary/20 border-border/10 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.received}
                    onCheckedChange={() => handleReceivedToggle(item.orderItemId)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-foreground">{item.itemName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        Pedido: {item.orderedQuantity} {formatUnit(item.unitType)}
                      </span>
                    </div>
                    
                    {item.received && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Recebido:</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.receivedQuantity}
                          onChange={(e) => handleQuantityChange(item.orderItemId, Number(e.target.value))}
                          className="w-24 h-8 text-center text-sm rounded-lg"
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatUnit(item.unitType)}
                        </span>
                        
                        {item.receivedQuantity !== item.orderedQuantity && (
                          <AppIcon name="warning" size={14} className="text-warning ml-1" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasDiscrepancies && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning">
              <AppIcon name="warning" size={14} />
              <span className="text-xs font-medium">Algumas quantidades foram ajustadas</span>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || receivedItems.every(i => !i.received)}
            className="w-full h-12 gap-2 rounded-2xl text-sm font-semibold"
          >
            <AppIcon name="check_circle" size={18} />
            {isSubmitting ? 'Processando...' : 'Confirmar Recebimento'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
