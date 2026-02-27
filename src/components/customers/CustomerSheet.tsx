import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer } from '@/types/customer';

const ORIGINS = [
  { value: 'manual', label: 'Manual' },
  { value: 'pdv', label: 'PDV' },
  { value: 'mesa', label: 'Mesa' },
  { value: 'ifood', label: 'iFood' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'csv', label: 'CSV' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSave: (data: Partial<Customer>) => void;
  isSaving?: boolean;
}

export function CustomerSheet({ open, onOpenChange, customer, onSave, isSaving }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [origin, setOrigin] = useState<string>('manual');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setOrigin(customer.origin);
      setBirthday(customer.birthday || '');
      setNotes(customer.notes || '');
    } else {
      setName(''); setPhone(''); setEmail(''); setOrigin('manual'); setBirthday(''); setNotes('');
    }
  }, [customer, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      ...(customer ? { id: customer.id } : {}),
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      origin: origin as Customer['origin'],
      birthday: birthday || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{customer ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGINS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Aniversário</Label>
            <Input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre o cliente..." />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!name.trim() || isSaving}>
            {isSaving ? 'Salvando...' : customer ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
