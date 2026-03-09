import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useProductionOrders, ProductionRecipe } from '@/hooks/useProductionOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProductionTab() {
  const {
    productionRecipes, needsProduction, history,
    isLoading, produce, isProducing, updateReadyStock,
  } = useProductionOrders();

  const [showHistory, setShowHistory] = useState(false);
  const [produceSheet, setProduceSheet] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ProductionRecipe | null>(null);
  const [produceQty, setProduceQty] = useState(0);
  const [produceNotes, setProduceNotes] = useState('');

  const handleOpenProduce = (recipe: ProductionRecipe) => {
    setSelectedRecipe(recipe);
    const deficit = Math.max(0, (recipe.min_ready_stock ?? 0) - (recipe.current_ready_stock ?? 0));
    setProduceQty(deficit);
    setProduceNotes('');
    setProduceSheet(true);
  };

  const handleConfirmProduce = async () => {
    if (!selectedRecipe || produceQty <= 0) return;
    await produce(selectedRecipe.id, produceQty, produceNotes || undefined);
    setProduceSheet(false);
  };

  // Check if ingredients have enough stock
  const getIngredientStatus = (recipe: ProductionRecipe, qty: number) => {
    const multiplier = qty / recipe.yield_quantity;
    return recipe.ingredients
      .filter(i => i.source_type === 'inventory' && i.item)
      .map(ing => {
        const needed = ing.quantity * multiplier;
        const available = ing.item?.current_stock ?? 0;
        return {
          name: ing.item?.name || '',
          needed: Math.round(needed * 100) / 100,
          available: Math.round(available * 100) / 100,
          unit: ing.unit_type,
          sufficient: available >= needed,
        };
      });
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
          needsProduction.length > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
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
              <div key={order.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{order.recipe?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">+{order.quantity}</span>
                    <span className="text-xs text-muted-foreground">{order.recipe?.yield_unit}</span>
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
        productionRecipes.length === 0 ? (
          <EmptyState
            icon="ChefHat"
            title="Nenhuma receita configurada"
            subtitle="Configure o estoque mínimo de produção nas fichas técnicas"
          />
        ) : (
          <div className="space-y-2">
            {productionRecipes.map((recipe, i) => {
              const current = recipe.current_ready_stock ?? 0;
              const min = recipe.min_ready_stock ?? 0;
              const deficit = Math.max(0, min - current);
              const isBelowMin = current < min;
              const percentage = min > 0 ? Math.min(100, (current / min) * 100) : 100;

              return (
                <div
                  key={recipe.id}
                  className={cn(
                    "bg-card rounded-2xl border overflow-hidden transition-all animate-fade-in",
                    isBelowMin ? "border-amber-500/30" : "border-border"
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {recipe.category && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: recipe.category.color }}
                            />
                          )}
                          <p className="font-semibold text-foreground truncate">{recipe.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={cn(
                            "text-sm font-bold tabular-nums",
                            isBelowMin ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {current} / {min}
                          </span>
                          <span className="text-xs text-muted-foreground">{recipe.yield_unit}</span>
                        </div>
                      </div>

                      {isBelowMin ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenProduce(recipe)}
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
            <SheetTitle className="text-left">Produzir: {selectedRecipe?.name}</SheetTitle>
          </SheetHeader>

          {selectedRecipe && (
            <div className="space-y-4 mt-4">
              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quantidade a produzir</label>
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
                  <span className="text-sm text-muted-foreground">{selectedRecipe.yield_unit}</span>
                </div>
              </div>

              {/* Ingredients check */}
              {produceQty > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Ingredientes necessários</p>
                  <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                    {getIngredientStatus(selectedRecipe, produceQty).map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate">{ing.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "font-medium tabular-nums",
                            ing.sufficient ? "text-emerald-400" : "text-destructive"
                          )}>
                            {ing.available}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-medium tabular-nums text-foreground">{ing.needed}</span>
                          <span className="text-xs text-muted-foreground">{ing.unit}</span>
                          {!ing.sufficient && <AppIcon name="AlertTriangle" size={12} className="text-destructive" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                {isProducing ? 'Registrando...' : `Confirmar Produção (+${produceQty} ${selectedRecipe.yield_unit})`}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
