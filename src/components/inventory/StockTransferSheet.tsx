import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { useStockTransfers } from '@/hooks/useStockTransfers';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransferItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitType: string;
  maxStock: number;
}

export function StockTransferSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { units, activeUnitId } = useUnit();
  const { transfers, createTransfer, acceptTransfer } = useStockTransfers();
  const [tab, setTab] = useState<'new' | 'history'>('history');
  const [toUnitId, setToUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const otherUnits = units.filter(u => u.id !== activeUnitId);

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items-transfer', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock, unit_type')
        .eq('unit_id', activeUnitId!)
        .gt('current_stock', 0)
        .order('name');
      return data || [];
    },
    enabled: !!activeUnitId && open && tab === 'new',
  });

  const addItem = (itemId: string) => {
    const inv = inventoryItems.find(i => i.id === itemId);
    if (!inv || items.some(i => i.itemId === itemId)) return;
    setItems(prev => [...prev, {
      itemId: inv.id,
      itemName: inv.name,
      quantity: 1,
      unitType: inv.unit_type || 'un',
      maxStock: inv.current_stock,
    }]);
  };

  const handleSubmit = async () => {
    if (!toUnitId || items.length === 0) {
      toast.error('Selecione destino e itens');
      return;
    }
    setSubmitting(true);
    try {
      await createTransfer.mutateAsync({ toUnitId, items, notes });
      toast.success('Transferência criada com sucesso');
      setItems([]);
      setNotes('');
      setToUnitId('');
      setTab('history');
    } catch {
      toast.error('Erro ao criar transferência');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptTransfer.mutateAsync(id);
      toast.success('Transferência aceita e estoque atualizado');
    } catch {
      toast.error('Erro ao aceitar transferência');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-red-500/15 text-red-700 dark:text-red-400',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="ArrowLeftRight" size={20} />
            Transferência de Estoque
          </SheetTitle>
        </SheetHeader>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === 'history' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setTab('new')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === 'new' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
            }`}
          >
            Nova Transferência
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-3">
          {tab === 'history' ? (
            transfers.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhuma transferência realizada
              </div>
            ) : (
              transfers.map(t => (
                <div key={t.id} className="p-3 rounded-xl bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[t.status] || ''}>
                      {t.status === 'pending' ? 'Pendente' : t.status === 'completed' ? 'Concluída' : t.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(t.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {units.find(u => u.id === t.from_unit_id)?.name || 'Unidade'} →{' '}
                    {units.find(u => u.id === t.to_unit_id)?.name || 'Unidade'}
                  </div>
                  <div className="text-xs">
                    {((t as any).stock_transfer_items || []).map((i: any) => (
                      <span key={i.id} className="inline-block mr-2">
                        {i.item_name} ({i.quantity} {i.unit_type})
                      </span>
                    ))}
                  </div>
                  {t.status === 'pending' && t.to_unit_id === activeUnitId && (
                    <Button size="sm" onClick={() => handleAccept(t.id)} className="text-xs">
                      <AppIcon name="Check" size={14} className="mr-1" />
                      Aceitar
                    </Button>
                  )}
                </div>
              ))
            )
          ) : (
            <>
              {otherUnits.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Você precisa ter mais de uma unidade cadastrada para transferir estoque
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-xs">Unidade destino</Label>
                    <Select value={toUnitId} onValueChange={setToUnitId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherUnits.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Adicionar item</Label>
                    <Select onValueChange={addItem}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems
                          .filter(i => !items.some(x => x.itemId === i.id))
                          .map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name} ({i.current_stock} {i.unit_type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {items.map((item, idx) => (
                    <div key={item.itemId} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <div className="flex-1 text-xs font-medium">{item.itemName}</div>
                      <Input
                        type="number"
                        value={item.quantity}
                        min={1}
                        max={item.maxStock}
                        onChange={e => {
                          const val = Math.min(Number(e.target.value), item.maxStock);
                          setItems(prev => prev.map((x, i) => i === idx ? { ...x, quantity: val } : x));
                        }}
                        className="w-20 h-8 text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground">{item.unitType}</span>
                      <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>
                        <AppIcon name="X" size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                  ))}

                  <div>
                    <Label className="text-xs">Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Opcional"
                      className="mt-1 text-xs"
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleSubmit} disabled={submitting || items.length === 0} className="w-full">
                    {submitting ? 'Enviando...' : 'Enviar Transferência'}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
