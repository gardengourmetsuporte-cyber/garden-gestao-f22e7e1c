import { useStockPrediction } from '@/hooks/useStockPrediction';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function StockPredictionWidget() {
  const { predictions } = useStockPrediction();
  const navigate = useNavigate();

  if (predictions.length === 0) return null;

  return (
    <button
      onClick={() => navigate('/inventory')}
      className="card-command col-span-2 p-0 text-left animate-slide-up overflow-hidden relative"
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'hsl(var(--destructive) / 0.15)', border: '1px solid hsl(var(--destructive) / 0.25)' }}
            >
              <AppIcon name="TrendingDown" size={18} className="text-destructive" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Previsão de Estoque</span>
              <span className="text-[10px] text-muted-foreground block">Itens que podem acabar em breve</span>
            </div>
          </div>
          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
        </div>

        <div className="space-y-1.5">
          {predictions.slice(0, 5).map(p => (
            <div
              key={p.itemId}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl",
                p.daysUntilEmpty !== null && p.daysUntilEmpty <= 2
                  ? "bg-destructive/8"
                  : "bg-warning/8"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                p.daysUntilEmpty !== null && p.daysUntilEmpty <= 2
                  ? "bg-destructive/15"
                  : "bg-warning/15"
              )}>
                <AppIcon
                  name="Package"
                  size={14}
                  className={p.daysUntilEmpty !== null && p.daysUntilEmpty <= 2 ? "text-destructive" : "text-warning"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground truncate block">{p.itemName}</span>
                {p.supplierName && (
                  <span className="text-[10px] text-muted-foreground truncate block">{p.supplierName}</span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                p.daysUntilEmpty !== null && p.daysUntilEmpty <= 2
                  ? "bg-destructive/15 text-destructive"
                  : "bg-warning/15 text-warning"
              )}>
                ~{p.daysUntilEmpty}d
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
