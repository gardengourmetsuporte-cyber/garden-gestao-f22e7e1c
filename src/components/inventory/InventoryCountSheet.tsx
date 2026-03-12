import { useState } from 'react';
import { useInventoryCounts, useCountItems } from '@/hooks/useInventoryCounts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryCountSheet({ open, onOpenChange }: Props) {
  const { countsQuery, startCount, updateCountItem, completeCount } = useInventoryCounts();
  const [activeCountId, setActiveCountId] = useState<string | null>(null);
  const { data: countItems } = useCountItems(activeCountId);

  const counts = countsQuery.data || [];
  const activeCount = counts.find(c => c.id === activeCountId);
  const isInProgress = (activeCount as any)?.status === 'in_progress';

  const handleStartNew = async () => {
    const result = await startCount.mutateAsync();
    setActiveCountId(result.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>Contagem de Estoque</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4 pb-8">
          {!activeCountId ? (
            <>
              <Button onClick={handleStartNew} disabled={startCount.isPending} className="w-full rounded-xl gap-2">
                <AppIcon name="ClipboardList" size={16} />
                {startCount.isPending ? 'Criando...' : 'Iniciar Nova Contagem'}
              </Button>

              {counts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Contagens Anteriores</h3>
                  {counts.map(c => (
                    <Card
                      key={c.id}
                      className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setActiveCountId(c.id)}
                    >
                      <CardContent className="py-3 px-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}</p>
                          <p className="text-xs text-muted-foreground">{(c as any).notes || ''}</p>
                        </div>
                        <Badge variant={(c as any).status === 'completed' ? 'default' : 'secondary'}>
                          {(c as any).status === 'completed' ? 'Finalizada' : 'Em andamento'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setActiveCountId(null)} className="gap-1">
                  <AppIcon name="ArrowLeft" size={14} /> Voltar
                </Button>
                {isInProgress && (
                  <Button
                    size="sm"
                    onClick={() => completeCount.mutate(activeCountId)}
                    disabled={completeCount.isPending}
                    className="gap-1 rounded-xl"
                  >
                    <AppIcon name="Check" size={14} />
                    Ajustar e Finalizar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {countItems?.map((item: any) => {
                  const diff = item.counted_stock != null ? item.counted_stock - item.system_stock : null;
                  return (
                    <Card key={item.id} className="border-border/50">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Sistema: {item.system_stock} {item.item_unit_type}
                            </p>
                          </div>
                          {diff != null && diff !== 0 && (
                            <Badge variant={diff > 0 ? 'default' : 'destructive'} className="text-xs">
                              {diff > 0 ? '+' : ''}{diff}
                            </Badge>
                          )}
                        </div>
                        {isInProgress ? (
                          <Input
                            type="number"
                            placeholder="Contagem física"
                            defaultValue={item.counted_stock ?? ''}
                            className="h-10 rounded-xl"
                            onBlur={e => {
                              const val = e.target.value;
                              if (val !== '') {
                                updateCountItem.mutate({ itemId: item.id, countedStock: Number(val) });
                              }
                            }}
                          />
                        ) : (
                          <p className={cn('text-sm font-medium', diff && diff !== 0 && (diff > 0 ? 'text-emerald-500' : 'text-destructive'))}>
                            Contado: {item.counted_stock ?? '-'} {item.item_unit_type}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
