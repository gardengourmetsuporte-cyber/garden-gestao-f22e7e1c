import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subscription, SubscriptionInsert, SUBSCRIPTION_CATEGORIES } from '@/hooks/useSubscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Subscription | null;
  onSave: (data: SubscriptionInsert) => Promise<void>;
  onUpdate?: (data: Partial<Subscription> & { id: string }) => Promise<void>;
  isSaving: boolean;
}

export function SubscriptionSheet({ open, onOpenChange, editItem, onSave, onUpdate, isSaving }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('outros');
  const [type, setType] = useState<'assinatura' | 'conta_fixa'>('assinatura');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual' | 'semanal'>('mensal');
  const [nextDate, setNextDate] = useState('');
  const [managementUrl, setManagementUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setType(editItem.type);
      setPrice(String(editItem.price));
      setBillingCycle(editItem.billing_cycle);
      setNextDate(editItem.next_payment_date || '');
      setManagementUrl(editItem.management_url || '');
      setNotes(editItem.notes || '');
    } else {
      setName(''); setCategory('outros'); setType('assinatura');
      setPrice(''); setBillingCycle('mensal'); setNextDate('');
      setManagementUrl(''); setNotes('');
    }
  }, [editItem, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;
    const data: SubscriptionInsert = {
      name: name.trim(),
      category,
      type,
      price: parseFloat(price),
      billing_cycle: billingCycle,
      next_payment_date: nextDate || null,
      status: editItem?.status || 'ativo',
      management_url: managementUrl.trim() || null,
      notes: notes.trim() || null,
      icon: null,
      color: null,
    };

    if (editItem && onUpdate) {
      await onUpdate({ id: editItem.id, ...data });
    } else {
      await onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{editItem ? 'Editar' : 'Nova assinatura / conta'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Netflix, Aluguel..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assinatura">Assinatura</SelectItem>
                  <SelectItem value="conta_fixa">Conta fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Próximo vencimento</Label>
            <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>

          <div>
            <Label>Link de gerenciamento</Label>
            <Input value={managementUrl} onChange={(e) => setManagementUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações..." />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={isSaving || !name.trim() || !price}>
            {isSaving ? 'Salvando...' : editItem ? 'Salvar alterações' : 'Adicionar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
