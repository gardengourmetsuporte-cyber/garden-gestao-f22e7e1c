import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MenuProduct } from '@/hooks/useMenuAdmin';

interface Props {
  products: MenuProduct[];
  syncing: boolean;
  onRefreshCosts: () => void;
}

const formatPrice = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FichaTecnicaHeader({ products, syncing, onRefreshCosts }: Props) {
  const linked = products.filter(p => (p as any).recipe_id);
  const withCost = linked.filter(p => (p as any).cost_per_portion > 0);

  const avgMargin = withCost.length > 0
    ? withCost.reduce((sum, p) => {
        const cost = (p as any).cost_per_portion || 0;
        const margin = cost > 0 ? ((p.price - cost) / cost) * 100 : 0;
        return sum + margin;
      }, 0) / withCost.length
    : 0;

  const marginColor = avgMargin >= 200
    ? 'text-success'
    : avgMargin >= 100
      ? 'text-warning'
      : 'text-destructive';

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="icon-glow icon-glow-sm icon-glow-primary">
          <AppIcon name="ChefHat" size={16} />
        </div>
        <h3 className="text-sm font-bold text-foreground">Modo Ficha Técnica</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-xl bg-secondary/40">
          <p className="text-lg font-bold text-foreground">{linked.length}</p>
          <p className="text-[10px] text-muted-foreground">Vinculados</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary/40">
          <p className="text-lg font-bold text-foreground">{products.length - linked.length}</p>
          <p className="text-[10px] text-muted-foreground">Sem ficha</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary/40">
          <p className={cn("text-lg font-bold", marginColor)}>
            {avgMargin > 0 ? `${avgMargin.toFixed(0)}%` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">Margem média</p>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={onRefreshCosts}
        disabled={syncing}
      >
        <AppIcon name="RefreshCw" size={14} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Atualizando...' : 'Atualizar custos das receitas'}
      </Button>
    </div>
  );
}
