import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { useStockTransfers } from '@/hooks/useStockTransfers';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [toUnitId, setToUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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
    enabled: !!activeUnitId && open,
  });

  const availableItems = useMemo(() => {
    const filtered = inventoryItems.filter(i => !items.some(x => x.itemId === i.id));
    if (!search.trim()) return filtered;
    const q = search.toLowerCase().trim();
    return filtered.filter(i => i.name.toLowerCase().includes(q));
  }, [inventoryItems, items, search]);

  const addItem = (inv: typeof inventoryItems[0]) => {
    if (items.some(i => i.itemId === inv.id)) return;
    setItems(prev => [...prev, {
      itemId: inv.id,
      itemName: inv.name,
      quantity: 1,
      unitType: inv.unit_type || 'un',
      maxStock: inv.current_stock,
    }]);
    setSearch('');
    setShowSearch(false);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQty = (idx: number, val: number) => {
    setItems(prev => prev.map((x, i) => i === idx ? { ...x, quantity: Math.max(1, Math.min(val, x.maxStock)) } : x));
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
      toast.success('Transferência aceita!');
    } catch {
      toast.error('Erro ao aceitar');
    }
  };

  const formatUnit = (u: string) => u === 'kg' ? 'kg' : u === 'litro' ? 'L' : 'un';

  const pendingForMe = transfers.filter(t => t.status === 'pending' && t.to_unit_id === activeUnitId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] flex flex-col px-4 pb-6">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AppIcon name="swap_horiz" size={20} className="text-primary" />
            Transferência de Estoque
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-0.5 mb-3">
          <button
            onClick={() => setTab('new')}
            className={cn(
              "flex-1 py-2 px-3 rounded-[10px] text-xs font-semibold transition-all active:scale-[0.97]",
              tab === 'new' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Nova Transferência
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn(
              "flex-1 py-2 px-3 rounded-[10px] text-xs font-semibold transition-all active:scale-[0.97] relative",
              tab === 'history' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Histórico
            {pendingForMe.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {pendingForMe.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {tab === 'new' ? (
            otherUnits.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <AppIcon name="store" size={32} className="text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Cadastre mais de uma unidade para transferir estoque</p>
              </div>
            ) : (
              <>
                {/* Destination */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Unidade destino</label>
                  <Select value={toUnitId} onValueChange={setToUnitId}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherUnits.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add items - search based */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Adicionar itens</label>
                  <div className="relative">
                    <AppIcon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      value={search}
                      onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                      onFocus={() => setShowSearch(true)}
                      placeholder="Buscar item no estoque..."
                      className="pl-9 rounded-xl h-11"
                    />
                  </div>

                  {/* Search results dropdown */}
                  {showSearch && search.trim().length > 0 && (
                    <div className="bg-card border border-border/30 rounded-2xl overflow-hidden max-h-48 overflow-y-auto shadow-lg">
                      {availableItems.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Nenhum item encontrado
                        </div>
                      ) : (
                        availableItems.slice(0, 8).map(inv => (
                          <button
                            key={inv.id}
                            onClick={() => addItem(inv)}
                            className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 active:bg-secondary/70 transition-colors text-left border-b border-border/10 last:border-0"
                          >
                            <span className="text-sm font-medium text-foreground">{inv.name}</span>
                            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                              {inv.current_stock} {formatUnit(inv.unit_type || 'un')}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected items */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Itens selecionados ({items.length})
                    </label>
                    {items.map((item, idx) => (
                      <div key={item.itemId} className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/20">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.itemName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Disponível: {item.maxStock} {formatUnit(item.unitType)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateQty(idx, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <AppIcon name="remove" size={14} className="text-foreground" />
                          </button>
                          <Input
                            type="number"
                            value={item.quantity}
                            min={1}
                            max={item.maxStock}
                            onChange={e => updateQty(idx, Number(e.target.value))}
                            className="w-14 h-8 text-center text-sm rounded-lg p-0"
                          />
                          <button
                            onClick={() => updateQty(idx, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <AppIcon name="add" size={14} className="text-foreground" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(idx)}
                          className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        >
                          <AppIcon name="close" size={14} className="text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Observações</label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Opcional"
                    className="text-sm rounded-xl resize-none"
                    rows={2}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || items.length === 0 || !toUnitId}
                  className="w-full h-12 rounded-2xl gap-2 text-sm font-semibold"
                >
                  <AppIcon name="send" size={16} />
                  {submitting ? 'Enviando...' : `Enviar Transferência (${items.length} ${items.length === 1 ? 'item' : 'itens'})`}
                </Button>
              </>
            )
          ) : (
            /* History */
            transfers.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <AppIcon name="history" size={32} className="text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhuma transferência realizada</p>
              </div>
            ) : (
              transfers.map(t => {
                const isPending = t.status === 'pending';
                const isForMe = t.to_unit_id === activeUnitId;
                const statusLabel = isPending ? 'Pendente' : t.status === 'completed' ? 'Concluída' : 'Cancelada';
                const statusStyle = isPending
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : t.status === 'completed'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-destructive/10 text-destructive border-destructive/20';

                return (
                  <div key={t.id} className="p-3.5 rounded-2xl bg-card border border-border/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusStyle)}>
                        {statusLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(t.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {units.find(u => u.id === t.from_unit_id)?.name || '—'}
                      </span>
                      <AppIcon name="arrow_forward" size={12} className="text-muted-foreground/50" />
                      <span className="font-medium text-foreground">
                        {units.find(u => u.id === t.to_unit_id)?.name || '—'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {((t as any).stock_transfer_items || []).map((i: any) => (
                        <span key={i.id} className="text-[11px] px-2 py-0.5 rounded-lg bg-secondary/50 text-foreground">
                          {i.item_name} · {i.quantity} {formatUnit(i.unit_type)}
                        </span>
                      ))}
                    </div>

                    {isPending && isForMe && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(t.id)}
                        className="w-full h-9 rounded-xl gap-1.5 text-xs"
                      >
                        <AppIcon name="check_circle" size={14} />
                        Aceitar Transferência
                      </Button>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
