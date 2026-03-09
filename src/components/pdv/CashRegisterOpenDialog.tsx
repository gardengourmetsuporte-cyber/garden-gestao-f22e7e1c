import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';

interface CashRegisterOpenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onOpen: (initialCash: number) => Promise<boolean>;
}

export function CashRegisterOpenDialog({ open, onOpenChange, saving, onOpen }: CashRegisterOpenDialogProps) {
  const [initialCash, setInitialCash] = useState('');

  const handleSubmit = async () => {
    const value = parseFloat(initialCash.replace(',', '.')) || 0;
    const success = await onOpen(value);
    if (success) {
      setInitialCash('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Unlock" size={20} className="text-primary" />
            Abrir Caixa
          </SheetTitle>
          <SheetDescription>
            Informe o valor inicial em dinheiro no caixa para começar a operar.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Troco inicial (R$)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={initialCash}
              onChange={e => setInitialCash(e.target.value)}
              className="text-lg h-12 font-mono"
              autoFocus
            />
          </div>

          {initialCash && (
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground">Valor inicial:</span>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(parseFloat(initialCash.replace(',', '.')) || 0)}
              </p>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={saving} className="w-full h-11">
            {saving ? (
              <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <AppIcon name="Unlock" size={16} className="mr-2" />
            )}
            Abrir Caixa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
