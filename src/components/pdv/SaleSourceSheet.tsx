import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { PDVDeliveryAddress } from '@/components/pdv/PDVDeliveryAddress';
import { cn } from '@/lib/utils';

type SaleSource = 'balcao' | 'mesa' | 'delivery';

interface SaleSourceData {
  source: SaleSource;
  customerName: string;
  customerDocument: string;
  tableNumber: number | null;
  deliveryPhone: string;
  deliveryAddress: string;
}

interface SaleSourceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: SaleSourceData) => void;
  /** Pre-selected values (from loaded order, etc.) */
  initialSource?: SaleSource;
  initialCustomerName?: string;
  initialTableNumber?: number | null;
}

const sources = [
  { key: 'balcao' as const, label: 'Balcão', icon: 'Store' },
  { key: 'mesa' as const, label: 'Mesa', icon: 'UtensilsCrossed' },
  { key: 'delivery' as const, label: 'Delivery', icon: 'two_wheeler' },
];

export function SaleSourceSheet({ open, onOpenChange, onConfirm, initialSource, initialCustomerName, initialTableNumber }: SaleSourceSheetProps) {
  const [source, setSource] = useState<SaleSource>(initialSource ?? 'balcao');
  const [customerName, setCustomerName] = useState(initialCustomerName ?? '');
  const [customerDocument, setCustomerDocument] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(initialTableNumber ?? null);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Reset when opening
  useEffect(() => {
    if (open) {
      setSource(initialSource ?? 'balcao');
      setCustomerName(initialCustomerName ?? '');
      setCustomerDocument('');
      setTableNumber(initialTableNumber ?? null);
      setDeliveryPhone('');
      setDeliveryAddress('');
    }
  }, [open, initialSource, initialCustomerName, initialTableNumber]);

  const handleConfirm = () => {
    onConfirm({
      source,
      customerName,
      customerDocument,
      tableNumber,
      deliveryPhone,
      deliveryAddress,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <div className="p-5 space-y-4">
          <SheetHeader>
            <SheetTitle className="text-base">Modo da Venda</SheetTitle>
          </SheetHeader>

          {/* Source buttons */}
          <div className="flex gap-2">
            {sources.map(s => (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all border',
                  source === s.key
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary/50 text-muted-foreground border-transparent'
                )}
              >
                <AppIcon name={s.icon} size={20} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Context fields */}
          {source === 'balcao' && (
            <div className="flex gap-2">
              <Input placeholder="Nome do cliente (opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10 text-sm flex-1" />
              <Input placeholder="CPF" value={customerDocument} onChange={e => setCustomerDocument(e.target.value)} className="h-10 text-sm w-28" />
            </div>
          )}

          {source === 'mesa' && (
            <div className="flex gap-2">
              <Input type="number" placeholder="Nº mesa" value={tableNumber ?? ''} onChange={e => setTableNumber(e.target.value ? Number(e.target.value) : null)} className="h-10 text-sm w-24" inputMode="numeric" />
              <Input placeholder="Nome (opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10 text-sm flex-1" />
            </div>
          )}

          {source === 'delivery' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10 text-sm flex-1" />
                <Input placeholder="Telefone" value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} className="h-10 text-sm w-28" inputMode="tel" />
              </div>
              <PDVDeliveryAddress value={deliveryAddress} onChange={setDeliveryAddress} />
            </div>
          )}

          {/* Confirm */}
          <Button onClick={handleConfirm} className="w-full h-12" size="lg">
            Continuar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
