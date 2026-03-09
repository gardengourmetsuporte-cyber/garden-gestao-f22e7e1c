import { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Delivery } from '@/hooks/useDeliveries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: Delivery | null;
  onSaved: () => void;
}

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
  };
}

export function DeliveryEditSheet({ open, onOpenChange, delivery, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [reference, setReference] = useState('');
  const [total, setTotal] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [notes, setNotes] = useState('');
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (delivery && open) {
      setOrderNumber(delivery.order_number || '');
      setCustomerName(delivery.address?.customer_name || '');
      setFullAddress(delivery.address?.full_address || '');
      setNeighborhood(delivery.address?.neighborhood || '');
      setReference(delivery.address?.reference || '');
      setTotal(delivery.total > 0 ? delivery.total.toFixed(2) : '');
      setItemsSummary(delivery.items_summary || '');
      setNotes(delivery.notes || '');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [delivery, open]);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: `${query}, Brasil`,
        format: 'json',
        limit: '5',
        countrycodes: 'br',
        addressdetails: '1',
      });
      
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      
      const results = await res.json();
      setSuggestions(results || []);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.warn('Erro ao buscar endereços', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddressChange = (value: string) => {
    setFullAddress(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    const road = addr.road || '';
    const number = addr.house_number || '';
    const formatted = number ? `${road}, ${number}` : road;
    
    setFullAddress(formatted || suggestion.display_name.split(',')[0]);
    setNeighborhood(addr.suburb || neighborhood);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!delivery) return;
    setSaving(true);
    try {
      const { error: delError } = await supabase
        .from('deliveries')
        .update({
          order_number: orderNumber.trim(),
          total: parseFloat(total) || 0,
          items_summary: itemsSummary.trim() || null,
          notes: notes.trim() || null,
        })
        .eq('id', delivery.id);

      if (delError) throw delError;

      if (delivery.address) {
        const { error: addrError } = await supabase
          .from('delivery_addresses')
          .update({
            customer_name: customerName.trim(),
            full_address: fullAddress.trim(),
            neighborhood: neighborhood.trim(),
            reference: reference.trim() || null,
          })
          .eq('id', delivery.address.id);

        if (addrError) throw addrError;
      }

      toast.success('Entrega atualizada!');
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Edit" size={18} className="text-primary" />
            Editar Entrega
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nº Pedido</label>
              <Input
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="#12345"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor (R$)</label>
              <Input
                value={total}
                onChange={e => setTotal(e.target.value)}
                placeholder="0.00"
                type="number"
                inputMode="decimal"
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cliente</label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
              className="rounded-xl"
            />
          </div>

          <div className="relative">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Endereço</label>
            <div className="relative">
              <Input
                value={fullAddress}
                onChange={e => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Rua, número"
                className="rounded-xl pr-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AppIcon name="Loader2" size={16} className="animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm hover:bg-secondary/80 transition-colors",
                      "flex items-start gap-2 border-b border-border/50 last:border-0"
                    )}
                  >
                    <AppIcon name="MapPin" size={14} className="text-primary mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bairro</label>
              <Input
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Bairro"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Referência</label>
              <Input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ponto de referência"
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Itens</label>
            <Textarea
              value={itemsSummary}
              onChange={e => setItemsSummary(e.target.value)}
              placeholder="Resumo dos itens"
              className="rounded-xl min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observações</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas internas"
              className="rounded-xl min-h-[60px]"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl font-bold"
          >
            {saving && <AppIcon name="Loader2" size={18} className="animate-spin mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
