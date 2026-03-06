import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem } from '@/types/database';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  categories: Category[];
  onConfirm: (entries: { itemId: string; quantity: number }[], type: 'entrada' | 'saida', notes?: string) => Promise<void>;
}

export function BatchMovementSheet({ open, onOpenChange, items, categories, onConfirm }: Props) {
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q) || i.category?.name?.toLowerCase().includes(q));
  }, [items, search]);

  const grouped = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    filteredItems.forEach(item => {
      const cat = item.category?.name || 'Sem Categoria';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [filteredItems]);

  const sortedCats = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const catA = categories.find(c => c.name === a);
      const catB = categories.find(c => c.name === b);
      return (catA?.sort_order ?? 999) - (catB?.sort_order ?? 999);
    });
  }, [grouped, categories]);

  const filledCount = useMemo(() => {
    let count = 0;
    quantities.forEach(v => { if (v > 0) count++; });
    return count;
  }, [quantities]);

  const getQty = (id: string) => quantities.get(id) || 0;

  const setQty = (id: string, value: number) => {
    setQuantities(prev => {
      const next = new Map(prev);
      if (value <= 0) next.delete(id);
      else next.set(id, value);
      return next;
    });
  };

  const addQty = (id: string, amount: number) => {
    setQty(id, getQty(id) + amount);
  };

  const handleConfirm = async () => {
    const entries = Array.from(quantities.entries())
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (entries.length === 0) {
      toast.warning('Nenhum item com quantidade preenchida');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(entries, type, notes || undefined);
      toast.success(`${entries.length} movimentações registradas`);
      resetAndClose();
    } catch {
      toast.error('Erro ao registrar movimentações');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setQuantities(new Map());
    setSearch('');
    setNotes('');
    setType('entrada');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-[95dvh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="px-4 pt-4 pb-2 space-y-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-display">Lançamento em Lote</SheetTitle>
            {filledCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filledCount} {filledCount === 1 ? 'item' : 'itens'}
              </Badge>
            )}
          </div>

          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setType('entrada')}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                type === 'entrada'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              <AppIcon name="ArrowDown" size={14} className="inline mr-1" />
              Entrada
            </button>
            <button
              onClick={() => setType('saida')}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                type === 'saida'
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              <AppIcon name="ArrowUp" size={14} className="inline mr-1" />
              Saída
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar item..."
              className="pl-9 h-10 rounded-xl bg-secondary/50 border-border/50"
            />
          </div>
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {sortedCats.map(catName => {
            const catItems = grouped[catName];
            const cat = categories.find(c => c.name === catName);
            const color = cat?.color || '#6b7280';

            return (
              <div key={catName} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{catName}</span>
                </div>
                {catItems.map(item => {
                  const qty = getQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all',
                        qty > 0
                          ? 'bg-primary/5 ring-1 ring-primary/20'
                          : 'bg-secondary/40'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Estoque: {item.current_stock} {item.unit_type}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => addQty(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-xs font-bold text-foreground transition-colors"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => addQty(item.id, 5)}
                          className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-xs font-bold text-foreground transition-colors"
                        >
                          +5
                        </button>
                        <Input
                          type="number"
                          min={0}
                          value={qty || ''}
                          onChange={e => setQty(item.id, Math.max(0, Number(e.target.value) || 0))}
                          placeholder="0"
                          className="w-16 h-8 text-center text-sm rounded-lg border-border/50 bg-background px-1"
                        />
                        {qty > 0 && (
                          <button
                            onClick={() => setQty(item.id, 0)}
                            className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center"
                          >
                            <AppIcon name="X" size={12} className="text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum item encontrado
            </div>
          )}

          {/* Notes */}
          <div className="pt-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação (opcional)</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Lançamento da lousa do dia"
              rows={2}
              className="rounded-xl bg-secondary/50 border-border/50 resize-none"
            />
          </div>

          {/* Bottom spacer for fixed button */}
          <div className="h-20" />
        </div>

        {/* Fixed confirm button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <Button
            onClick={handleConfirm}
            disabled={filledCount === 0 || isSubmitting}
            className="w-full h-12 rounded-xl text-base font-semibold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <AppIcon name="Loader2" size={18} className="animate-spin mr-2" />
                Registrando...
              </>
            ) : (
              <>
                <AppIcon name="Check" size={18} className="mr-2" />
                Confirmar {filledCount > 0 ? `${filledCount} lançamento${filledCount > 1 ? 's' : ''}` : ''}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
