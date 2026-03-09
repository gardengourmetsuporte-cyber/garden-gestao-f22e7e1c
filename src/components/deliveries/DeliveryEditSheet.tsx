import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Delivery } from '@/hooks/useDeliveries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: Delivery | null;
  onSaved: () => void;
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
    }
  }, [delivery, open]);

  const handleSave = async () => {
    if (!delivery) return;
    setSaving(true);
    try {
      // Update delivery
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

      // Update address
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

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Endereço</label>
            <Input
              value={fullAddress}
              onChange={e => setFullAddress(e.target.value)}
              placeholder="Rua, número"
              className="rounded-xl"
            />
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
