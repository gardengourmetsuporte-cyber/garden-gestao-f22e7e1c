import { useState, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { PDVDeliveryAddress } from '@/components/pdv/PDVDeliveryAddress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

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
  initialSource?: SaleSource;
  initialCustomerName?: string;
  initialTableNumber?: number | null;
}

interface CustomerSuggestion {
  id: string;
  name: string;
  phone: string | null;
}

const sources = [
  { key: 'balcao' as const, label: 'Balcão', icon: 'Store' },
  { key: 'mesa' as const, label: 'Mesa', icon: 'UtensilsCrossed' },
  { key: 'delivery' as const, label: 'Delivery', icon: 'two_wheeler' },
];

function useCustomerSearch(unitId: string | undefined) {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((field: 'name' | 'phone', term: string) => {
    clearTimeout(debounceRef.current);
    if (!unitId || term.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const query = supabase
        .from('customers')
        .select('id, name, phone')
        .eq('unit_id', unitId)
        .is('deleted_at', null)
        .limit(6);

      if (field === 'name') {
        query.ilike('name', `%${term}%`);
      } else {
        query.ilike('phone', `%${term.replace(/\D/g, '')}%`);
      }

      const { data } = await query;
      setSuggestions((data as CustomerSuggestion[]) || []);
    }, 250);
  }, [unitId]);

  const clear = useCallback(() => setSuggestions([]), []);

  return { suggestions, search, clear };
}

function SuggestionsList({
  suggestions,
  onSelect,
  visible,
}: {
  suggestions: CustomerSuggestion[];
  onSelect: (c: CustomerSuggestion) => void;
  visible: boolean;
}) {
  if (!visible || suggestions.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
      {suggestions.map(c => (
        <button
          key={c.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-left"
        >
          <span className="font-medium text-foreground truncate">{c.name}</span>
          {c.phone && <span className="text-muted-foreground ml-2 shrink-0">{c.phone}</span>}
        </button>
      ))}
    </div>
  );
}

export function SaleSourceSheet({ open, onOpenChange, onConfirm, initialSource, initialCustomerName, initialTableNumber }: SaleSourceSheetProps) {
  const { activeUnit } = useUnit();
  const [source, setSource] = useState<SaleSource>(initialSource ?? 'balcao');
  const [customerName, setCustomerName] = useState(initialCustomerName ?? '');
  const [customerDocument, setCustomerDocument] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(initialTableNumber ?? null);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const { suggestions, search, clear } = useCustomerSearch(activeUnit?.id);

  useEffect(() => {
    if (open) {
      setSource(initialSource ?? 'balcao');
      setCustomerName(initialCustomerName ?? '');
      setCustomerDocument('');
      setTableNumber(initialTableNumber ?? null);
      setDeliveryPhone('');
      setDeliveryAddress('');
      clear();
    }
  }, [open, initialSource, initialCustomerName, initialTableNumber]);

  const handleSelectCustomer = (c: CustomerSuggestion) => {
    setCustomerName(c.name);
    if (c.phone) setDeliveryPhone(c.phone);
    clear();
    setNameFocused(false);
    setPhoneFocused(false);
  };

  const handleConfirm = () => {
    onConfirm({ source, customerName, customerDocument, tableNumber, deliveryPhone, deliveryAddress });
  };

  const nameInput = (placeholder: string, flex = 'flex-1') => (
    <div className={`relative ${flex}`}>
      <Input
        placeholder={placeholder}
        value={customerName}
        onChange={e => { setCustomerName(e.target.value); search('name', e.target.value); }}
        onFocus={() => { setNameFocused(true); if (customerName.length >= 2) search('name', customerName); }}
        onBlur={() => setTimeout(() => setNameFocused(false), 150)}
        className="h-10 text-sm"
      />
      <SuggestionsList suggestions={suggestions} onSelect={handleSelectCustomer} visible={nameFocused} />
    </div>
  );

  const phoneInput = () => (
    <div className="relative w-28">
      <Input
        placeholder="Telefone"
        value={deliveryPhone}
        onChange={e => { setDeliveryPhone(e.target.value); search('phone', e.target.value); }}
        onFocus={() => { setPhoneFocused(true); if (deliveryPhone.length >= 2) search('phone', deliveryPhone); }}
        onBlur={() => setTimeout(() => setPhoneFocused(false), 150)}
        className="h-10 text-sm"
        inputMode="tel"
      />
      <SuggestionsList suggestions={suggestions} onSelect={handleSelectCustomer} visible={phoneFocused} />
    </div>
  );

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
              {nameInput('Nome do cliente (opcional)')}
              <Input placeholder="CPF" value={customerDocument} onChange={e => setCustomerDocument(e.target.value)} className="h-10 text-sm w-28" />
            </div>
          )}

          {source === 'mesa' && (
            <div className="flex gap-2">
              <Input type="number" placeholder="Nº mesa" value={tableNumber ?? ''} onChange={e => setTableNumber(e.target.value ? Number(e.target.value) : null)} className="h-10 text-sm w-24" inputMode="numeric" />
              {nameInput('Nome (opcional)')}
            </div>
          )}

          {source === 'delivery' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {nameInput('Nome do cliente')}
                {phoneInput()}
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
