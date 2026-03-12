import { useState } from 'react';
import { useWaitlist, type WaitlistEntry } from '@/hooks/useWaitlist';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Aguardando', color: 'bg-amber-500/15 text-amber-600' },
  called: { label: 'Chamado', color: 'bg-blue-500/15 text-blue-600' },
  seated: { label: 'Sentado', color: 'bg-emerald-500/15 text-emerald-600' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive' },
};

export function WaitlistManager() {
  const { entries, isLoading, add, updateStatus } = useWaitlist();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', party_size: 2, estimated_wait_minutes: 15, notes: '' });

  const handleAdd = () => {
    if (!form.customer_name.trim()) return;
    add.mutate({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone || null,
      party_size: form.party_size,
      estimated_wait_minutes: form.estimated_wait_minutes,
      notes: form.notes || null,
    });
    setSheetOpen(false);
    setForm({ customer_name: '', customer_phone: '', party_size: 2, estimated_wait_minutes: 15, notes: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Fila de Espera</h2>
          <p className="text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? 'pessoa' : 'pessoas'} aguardando</p>
        </div>
        <Button onClick={() => setSheetOpen(true)} className="rounded-xl gap-2" size="sm">
          <AppIcon name="Plus" size={14} />
          Adicionar
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center">
            <AppIcon name="Users" size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Fila vazia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const st = STATUS_MAP[entry.status] || STATUS_MAP.waiting;
            return (
              <Card key={entry.id} className="border-border/50">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{entry.customer_name}</span>
                        <Badge className={`text-[10px] ${st.color} border-0`}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{entry.party_size} pessoas</span>
                        <span>há {formatDistanceToNow(new Date(entry.created_at), { locale: ptBR })}</span>
                        {entry.estimated_wait_minutes && <span>~{entry.estimated_wait_minutes}min</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {entry.status === 'waiting' && (
                        <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={() => updateStatus.mutate({ id: entry.id, status: 'called' })}>
                          <AppIcon name="Bell" size={14} />
                        </Button>
                      )}
                      {(entry.status === 'waiting' || entry.status === 'called') && (
                        <>
                          <Button variant="ghost" size="sm" className="text-xs h-8 px-2 text-emerald-600" onClick={() => updateStatus.mutate({ id: entry.id, status: 'seated' })}>
                            <AppIcon name="Check" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-8 px-2 text-destructive" onClick={() => updateStatus.mutate({ id: entry.id, status: 'cancelled' })}>
                            <AppIcon name="X" size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader><SheetTitle>Adicionar à Fila</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nome *</label>
              <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Telefone</label>
              <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Pessoas</label>
                <Input type="number" min={1} value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Espera (min)</label>
                <Input type="number" min={5} step={5} value={form.estimated_wait_minutes} onChange={e => setForm(f => ({ ...f, estimated_wait_minutes: Number(e.target.value) }))} className="rounded-xl" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!form.customer_name || add.isPending} className="w-full rounded-xl">
              {add.isPending ? 'Adicionando...' : 'Adicionar à Fila'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
