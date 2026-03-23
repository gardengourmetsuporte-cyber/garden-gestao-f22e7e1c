import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { Order, InventoryItem } from '@/types/database';
import { toast } from 'sonner';

interface EditDraftOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  inventoryItems: InventoryItem[];
  onUpdateItem: (itemId: string, updates: { quantity?: number }) => Promise<void>;
  onRemoveItem: (orderItemId: string) => Promise<void>;
  onAddItems: (orderId: string, items: { item_id: string; quantity: number }[]) => Promise<void>;
  onRefetch: () => void;
}

export function EditDraftOrderSheet({
  open, onOpenChange, order, inventoryItems,
  onUpdateItem, onRemoveItem, onAddItems, onRefetch
}: EditDraftOrderSheetProps) {
  const [editedQty, setEditedQty] = useState<Record<string, number>>({});
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [addedItems, setAddedItems] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const currentItems = (order.order_items || []).filter(oi => !removedIds.has(oi.id));
  const currentItemIds = new Set(currentItems.map(oi => oi.item_id));

  const suggestedItems = useMemo(() => {
    return inventoryItems.filter(item =>
      item.supplier_id === order.supplier_id &&
      item.current_stock <= item.min_stock &&
      !currentItemIds.has(item.id) &&
      !addedItems[item.id]
    );
  }, [inventoryItems, order.supplier_id, currentItemIds, addedItems]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update changed quantities
      for (const oi of currentItems) {
        const newQty = editedQty[oi.id];
        if (newQty !== undefined && newQty !== oi.quantity) {
          await onUpdateItem(oi.id, { quantity: newQty });
        }
      }
      // Remove items
      for (const id of removedIds) {
        await onRemoveItem(id);
      }
      // Add new items
      const toAdd = Object.entries(addedItems).map(([item_id, quantity]) => ({ item_id, quantity }));
      if (toAdd.length > 0) {
        await onAddItems(order.id, toAdd);
      }
      onRefetch();
      toast.success('Pedido atualizado');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setEditedQty({});
      setRemovedIds(new Set());
      setAddedItems({});
    }
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Rascunho</SheetTitle>
          <p className="text-sm text-muted-foreground">{order.supplier?.name}</p>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Current items */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Itens do Pedido</h3>
            {currentItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum item no pedido</p>
            )}
            <div className="space-y-2">
              {currentItems.map(oi => {
                const qty = editedQty[oi.id] ?? oi.quantity;
                return (
                  <div key={oi.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{oi.item?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {oi.item?.current_stock ?? '?'} / Min: {oi.item?.min_stock ?? '?'}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={e => setEditedQty(p => ({ ...p, [oi.id]: Number(e.target.value) || 1 }))}
                      className="w-20 h-9 text-center"
                    />
                    <span className="text-xs text-muted-foreground w-8">{oi.item?.unit_type}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive h-8 w-8 shrink-0"
                      onClick={() => setRemovedIds(p => new Set([...p, oi.id]))}
                    >
                      <AppIcon name="X" size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Added items (pending) */}
          {Object.keys(addedItems).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Itens Adicionados</h3>
              <div className="space-y-2">
                {Object.entries(addedItems).map(([itemId, qty]) => {
                  const item = inventoryItems.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Estoque: {item.current_stock} / Min: {item.min_stock}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={e => setAddedItems(p => ({ ...p, [itemId]: Number(e.target.value) || 1 }))}
                        className="w-20 h-9 text-center"
                      />
                      <span className="text-xs text-muted-foreground w-8">{item.unit_type}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive h-8 w-8 shrink-0"
                        onClick={() => setAddedItems(p => { const n = { ...p }; delete n[itemId]; return n; })}
                      >
                        <AppIcon name="X" size={16} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Adicionar Itens</h3>
              <p className="text-xs text-muted-foreground mb-2">Itens deste fornecedor com estoque baixo</p>
              <div className="space-y-1.5">
                {suggestedItems.map(item => {
                  const suggested = Math.max(1, item.min_stock - item.current_stock);
                  return (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.current_stock}/{item.min_stock} {item.unit_type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 rounded-xl"
                        onClick={() => setAddedItems(p => ({ ...p, [item.id]: suggested }))}
                      >
                        <AppIcon name="Plus" size={14} />
                        {suggested}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
