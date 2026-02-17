import { useState } from 'react';
import { useAutoOrderSuggestion, AutoOrderSuggestion } from '@/hooks/useAutoOrderSuggestion';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const INITIAL_VISIBLE = 2;

export function AutoOrderWidget() {
  const { dailySuggestions, createDraftOrder } = useAutoOrderSuggestion();
  const [creating, setCreating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (dailySuggestions.length === 0) return null;

  const visibleSuggestions = expanded ? dailySuggestions : dailySuggestions.slice(0, INITIAL_VISIBLE);
  const hasMore = dailySuggestions.length > INITIAL_VISIBLE;

  const handleCreate = async (s: AutoOrderSuggestion) => {
    setCreating(s.supplierId);
    try {
      await createDraftOrder(s);
      toast.success(`Rascunho criado para ${s.supplierName}`);
    } catch {
      toast.error('Erro ao criar pedido');
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="col-span-2 rounded-2xl border border-border bg-card overflow-hidden animate-slide-up">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/50 border border-border">
            <AppIcon name="ShoppingCart" size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-foreground">Pedidos Diários</span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {dailySuggestions.length} fornecedor{dailySuggestions.length > 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {visibleSuggestions.map(s => (
            <div key={s.supplierId} className="rounded-2xl bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{s.supplierName}</span>
                <span className="text-xs text-muted-foreground">{s.items.length} ite{s.items.length > 1 ? 'ns' : 'm'}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.items.slice(0, 4).map(i => (
                  <span key={i.itemId} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground truncate max-w-[120px]">
                    {i.itemName}
                  </span>
                ))}
                {s.items.length > 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                    +{s.items.length - 4}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1.5"
                disabled={creating === s.supplierId}
                onClick={(e) => { e.stopPropagation(); handleCreate(s); }}
              >
                <AppIcon name="Plus" size={14} />
                {creating === s.supplierId ? 'Criando...' : 'Criar Rascunho'}
              </Button>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 mt-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <AppIcon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
            {expanded ? 'Ver menos' : `Ver mais ${dailySuggestions.length - INITIAL_VISIBLE} fornecedor${dailySuggestions.length - INITIAL_VISIBLE > 1 ? 'es' : ''}`}
          </button>
        )}
      </div>
    </div>
  );
}
