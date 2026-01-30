import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryItem, MovementType, UnitType } from '@/types/inventory';

interface QuickMovementSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (itemId: string, type: MovementType, quantity: number, notes?: string) => void;
}

function getUnitLabel(unitType: UnitType): string {
  switch (unitType) {
    case 'unidade': return 'unidades';
    case 'kg': return 'kg';
    case 'litro': return 'litros';
  }
}

const quickValues = [1, 5, 10, 25];

export function QuickMovementSheet({ item, open, onOpenChange, onConfirm }: QuickMovementSheetProps) {
  const [type, setType] = useState<MovementType>('entrada');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!item || !quantity) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;
    
    onConfirm(item.id, type, qty, notes || undefined);
    setQuantity('');
    setNotes('');
    onOpenChange(false);
  };

  const handleQuickValue = (value: number) => {
    setQuantity(value.toString());
  };

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{item.name}</SheetTitle>
          <p className="text-muted-foreground">
            Estoque atual: <span className="font-semibold text-foreground">{item.currentStock.toFixed(item.unitType === 'unidade' ? 0 : 2)} {getUnitLabel(item.unitType)}</span>
          </p>
        </SheetHeader>

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setType('entrada')}
            className={`action-button h-14 ${type === 'entrada' ? 'action-button-entry' : 'bg-secondary text-secondary-foreground'}`}
          >
            <Plus className="w-5 h-5" />
            Entrada
          </button>
          <button
            onClick={() => setType('saida')}
            className={`action-button h-14 ${type === 'saida' ? 'action-button-exit' : 'bg-secondary text-secondary-foreground'}`}
          >
            <Minus className="w-5 h-5" />
            Saída
          </button>
        </div>

        {/* Quick Values */}
        <div className="flex gap-2 mb-4">
          {quickValues.map((value) => (
            <button
              key={value}
              onClick={() => handleQuickValue(value)}
              className="flex-1 h-12 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 active:scale-95 transition-all"
            >
              {value}
            </button>
          ))}
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <Input
            type="number"
            placeholder={`Quantidade em ${getUnitLabel(item.unitType)}`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input-large"
            step={item.unitType === 'unidade' ? 1 : 0.1}
            min={0}
          />
        </div>

        {/* Notes Input */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Observação (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-12 px-4 rounded-xl"
          />
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!quantity || parseFloat(quantity) <= 0}
          className={`w-full h-14 text-lg font-semibold rounded-xl ${type === 'entrada' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}
        >
          Confirmar {type === 'entrada' ? 'Entrada' : 'Saída'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
