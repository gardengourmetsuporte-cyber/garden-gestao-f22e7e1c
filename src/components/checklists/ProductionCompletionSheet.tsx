import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InventoryItemInfo {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit_type: string;
}

interface ProductionCompletionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItemId: string;
  checklistItemName: string;
  onConfirm: (quantity: number) => void;
  isLoading?: boolean;
}

export function ProductionCompletionSheet({
  open,
  onOpenChange,
  inventoryItemId,
  checklistItemName,
  onConfirm,
  isLoading = false,
}: ProductionCompletionSheetProps) {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();
  const [inventoryItem, setInventoryItem] = useState<InventoryItemInfo | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !inventoryItemId) return;
    supabase
      .from('inventory_items')
      .select('id, name, current_stock, min_stock, unit_type')
      .eq('id', inventoryItemId)
      .single()
      .then(({ data }) => {
        if (data) {
          setInventoryItem(data as InventoryItemInfo);
          const deficit = Math.max(0, data.min_stock - data.current_stock);
          setQuantity(deficit || 1);
        }
      });
  }, [open, inventoryItemId]);

  const handleConfirm = async () => {
    if (!inventoryItem || quantity <= 0 || !user?.id || !activeUnitId) return;
    setSubmitting(true);
    try {
      // 1. Create stock movement (entrada) — triggers auto-update stock
      const { error: movError } = await supabase.from('stock_movements').insert({
        item_id: inventoryItem.id,
        type: 'entrada',
        quantity,
        notes: `Produção via checklist: ${checklistItemName}`,
        user_id: user.id,
        unit_id: activeUnitId,
      });
      if (movError) throw movError;

      // 2. Register production order for history
      const { error: prodError } = await supabase.from('production_orders').insert({
        item_id: inventoryItem.id,
        quantity,
        produced_by: user.id,
        notes: `Via checklist`,
        unit_id: activeUnitId,
      });
      if (prodError) console.error('Production order error:', prodError);

      // 3. Callback to complete the checklist item
      onConfirm(quantity);
    } catch (err: any) {
      console.error('Production error:', err);
      toast.error('Erro ao registrar produção');
    } finally {
      setSubmitting(false);
    }
  };

  if (!inventoryItem) return null;

  const current = inventoryItem.current_stock;
  const min = inventoryItem.min_stock;
  const isBelowMin = current < min;
  const percentage = min > 0 ? Math.min(100, (current / min) * 100) : 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left flex items-center gap-2">
            <AppIcon name="precision_manufacturing" size={20} className="text-primary" />
            Produzir: {inventoryItem.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Current status */}
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estoque atual</span>
              <span className={cn("font-bold", isBelowMin ? "text-amber-400" : "text-emerald-400")}>
                {current} {inventoryItem.unit_type}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estoque mínimo</span>
              <span className="font-bold text-foreground">{min} {inventoryItem.unit_type}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", isBelowMin ? "bg-amber-400" : "bg-emerald-400")}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Quantidade produzida</label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <AppIcon name="Minus" size={16} />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(0, Number(e.target.value)))}
                className="text-center text-lg font-bold w-24"
              />
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}>
                <AppIcon name="Plus" size={16} />
              </Button>
              <span className="text-sm text-muted-foreground">{inventoryItem.unit_type}</span>
            </div>
          </div>

          {/* Confirm */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleConfirm}
            disabled={submitting || isLoading || quantity <= 0}
          >
            <AppIcon name="precision_manufacturing" size={18} />
            {submitting ? 'Registrando...' : `Confirmar Produção (+${quantity} ${inventoryItem.unit_type})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
