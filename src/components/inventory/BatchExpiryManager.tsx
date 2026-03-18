import { useState } from 'react';
import { useInventoryBatches } from '@/hooks/useInventoryBatches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, AlertTriangle, Plus, Calendar } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  itemId?: string;
  itemName?: string;
}

export function BatchExpiryManager({ itemId, itemName }: Props) {
  const { batches, expiringBatches, addBatch, consumeBatch } = useInventoryBatches(itemId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    batch_number: '',
    quantity: '',
    expiry_date: '',
    cost_per_unit: '',
    notes: '',
  });

  const handleAdd = () => {
    if (!itemId) return;
    addBatch.mutate({
      item_id: itemId,
      batch_number: form.batch_number || null,
      quantity: parseFloat(form.quantity) || 0,
      expiry_date: form.expiry_date || null,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
      notes: form.notes || null,
    } as any, {
      onSuccess: () => {
        setOpen(false);
        setForm({ batch_number: '', quantity: '', expiry_date: '', cost_per_unit: '', notes: '' });
      }
    });
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return <Badge variant="destructive">Vencido</Badge>;
    if (days <= 3) return <Badge className="bg-red-500">Vence em {days}d</Badge>;
    if (days <= 7) return <Badge className="bg-amber-500">Vence em {days}d</Badge>;
    return <Badge variant="outline">{format(parseISO(expiryDate), 'dd/MM/yyyy')}</Badge>;
  };

  const displayBatches = itemId ? batches : expiringBatches;

  return (
    <div className="bg-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-semibold text-sm">
            {itemId ? `Lotes — ${itemName || ''}` : 'Lotes Próximos ao Vencimento'}
          </span>
        </div>
        {itemId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-primary">
                <Plus className="w-3.5 h-3.5 mr-1" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Lote</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nº do Lote</Label>
                  <Input value={form.batch_number} onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))} placeholder="Ex: LT-2026-001" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantidade</Label>
                    <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Custo unitário (R$)</Label>
                    <Input type="number" step="0.01" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Data de Validade</Label>
                  <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!form.quantity}>
                  Adicionar Lote
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {displayBatches.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {itemId ? 'Nenhum lote registrado' : 'Nenhum lote próximo ao vencimento 🎉'}
        </p>
      ) : (
        <div className="space-y-2">
          {displayBatches.map((batch: any) => {
            const days = batch.expiry_date ? differenceInDays(parseISO(batch.expiry_date), new Date()) : null;
            const isExpired = days !== null && days < 0;
            const isUrgent = days !== null && days <= 3 && !isExpired;

            return (
              <div key={batch.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isExpired ? 'bg-destructive/10' :
                isUrgent ? 'bg-amber-500/10' :
                'bg-secondary/40'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isExpired ? 'bg-destructive/20' :
                  isUrgent ? 'bg-amber-500/20' :
                  'bg-muted'
                }`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${
                    isExpired ? 'text-destructive' :
                    isUrgent ? 'text-amber-500' :
                    'text-muted-foreground'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {batch.batch_number || 'Sem nº'}
                    </span>
                    {!itemId && batch.item && (
                      <span className="text-[11px] text-muted-foreground">• {batch.item.name}</span>
                    )}
                    {getExpiryBadge(batch.expiry_date)}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    <span>Qtd: {batch.quantity}</span>
                    {batch.cost_per_unit > 0 && <span>R$ {Number(batch.cost_per_unit).toFixed(2)}/un</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(batch.received_at), 'dd/MM/yy')}
                    </span>
                  </div>
                </div>

                {itemId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => consumeBatch.mutate({ id: batch.id, quantity: batch.quantity })}
                  >
                    Consumir
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
