import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useProductionOrders, ProductionItem } from '@/hooks/useProductionOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProductionTab() {
  const {
    productionItems, needsProduction, history,
    isLoading, produce, isProducing, productionCategory, ensureCategory,
  } = useProductionOrders();

  const [showHistory, setShowHistory] = useState(false);
  const [produceSheet, setProduceSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductionItem | null>(null);
  const [produceQty, setProduceQty] = useState(0);
  const [produceNotes, setProduceNotes] = useState('');

  const handleOpenProduce = (item: ProductionItem) => {
    setSelectedItem(item);
    const deficit = Math.max(0, item.min_stock - item.current_stock);
    setProduceQty(deficit);
    setProduceNotes('');
    setProduceSheet(true);
  };

  const handleConfirmProduce = async () => {
    if (!selectedItem || produceQty <= 0) return;
    await produce(selectedItem.id, produceQty, produceNotes || undefined);
    setProduceSheet(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          needsProduction.length > 0 ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"
        )}>
          <AppIcon name={needsProduction.length > 0 ? "AlertTriangle" : "CheckCircle2"} size={14} />
          {needsProduction.length > 0
            ? `${needsProduction.length} ite${needsProduction.length !== 1 ? 'ns' : 'm'} abaixo do mínimo`
            : 'Produção em dia!'
          }
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            showHistory ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <AppIcon name="Clock" size={14} />
          Histórico
        </button>
      </div>

      {showHistory ? (
        /* History View */
        history.length === 0 ? (
          <EmptyState icon="Clock" title="Sem histórico" subtitle="Nenhuma produção registrada ainda" />
        ) : (
          <div className="space-y-2">
            {history.map(order => (
              <div key={order.id} className="bg-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{order.item?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">+{order.quantity}</span>
                    <span className="text-xs text-muted-foreground">{order.item?.unit_type || ''}</span>
                  </div>
                </div>
                {order.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{order.notes}</p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Production List */
        !productionCategory ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <AppIcon name="ChefHat" size={28} className="text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Categoria "Produção" não encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma categoria chamada <strong>Produção</strong> no estoque e adicione os itens que você produz internamente.
              </p>
            </div>
            <Button onClick={() => ensureCategory()} className="gap-2 rounded-xl">
              <AppIcon name="Plus" size={14} />
              Criar categoria Produção
            </Button>
          </div>
        ) : productionItems.length === 0 ? (
          <EmptyState
            icon="Package"
            title="Nenhum item de produção"
            subtitle="Adicione itens à categoria 'Produção' no estoque com estoque mínimo configurado"
          />
        ) : (
          <div className="space-y-2">
            {productionItems.map((item, i) => {
              const current = item.current_stock;
              const min = item.min_stock;
              const deficit = Math.max(0, min - current);
              const isBelowMin = current < min;
              const percentage = min > 0 ? Math.min(100, (current / min) * 100) : 100;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-card rounded-2xl overflow-hidden transition-all animate-fade-in"
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={cn(
                            "text-sm font-bold tabular-nums",
                            isBelowMin ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {current} / {min}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.unit_type}</span>
                        </div>
                      </div>

                      {isBelowMin ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenProduce(item)}
                          className="gap-1.5 rounded-xl shadow-lg shadow-primary/20 shrink-0"
                        >
                          <AppIcon name="Plus" size={14} />
                          +{deficit}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
                          <AppIcon name="CheckCircle2" size={14} className="text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-400">OK</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isBelowMin ? "bg-amber-400" : "bg-emerald-400"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Produce Sheet */}
      <Sheet open={produceSheet} onOpenChange={setProduceSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">Produzir: {selectedItem?.name}</SheetTitle>
          </SheetHeader>

          {selectedItem && (
            <div className="space-y-4 mt-4">
              {/* Current status */}
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estoque atual</span>
                  <span className="font-bold text-foreground">{selectedItem.current_stock} {selectedItem.unit_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Estoque mínimo</span>
                  <span className="font-bold text-foreground">{selectedItem.min_stock} {selectedItem.unit_type}</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quantidade produzida</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline" size="icon"
                    onClick={() => setProduceQty(q => Math.max(1, q - 1))}
                  >
                    <AppIcon name="Minus" size={16} />
                  </Button>
                  <Input
                    type="number"
                    value={produceQty}
                    onChange={e => setProduceQty(Math.max(0, Number(e.target.value)))}
                    className="text-center text-lg font-bold w-24"
                  />
                  <Button
                    variant="outline" size="icon"
                    onClick={() => setProduceQty(q => q + 1)}
                  >
                    <AppIcon name="Plus" size={16} />
                  </Button>
                  <span className="text-sm text-muted-foreground">{selectedItem.unit_type}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Observações (opcional)</label>
                <Input
                  placeholder="Ex: Lote da manhã"
                  value={produceNotes}
                  onChange={e => setProduceNotes(e.target.value)}
                />
              </div>

              {/* Confirm */}
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleConfirmProduce}
                disabled={isProducing || produceQty <= 0}
              >
                <AppIcon name="ChefHat" size={18} />
                {isProducing ? 'Registrando...' : `Confirmar Produção (+${produceQty} ${selectedItem.unit_type})`}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
