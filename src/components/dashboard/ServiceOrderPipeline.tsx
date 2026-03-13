import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { ActiveOrder, PipelineGroups } from '@/hooks/useServiceDashboard';

const COLUMNS = [
  { key: 'pending' as const, label: 'Pendente', icon: 'schedule', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { key: 'preparing' as const, label: 'Preparando', icon: 'skillet', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { key: 'ready' as const, label: 'Pronto', icon: 'check_circle', color: 'text-success', bg: 'bg-success/15' },
];

function OrderCard({ order }: { order: ActiveOrder }) {
  const isLong = order.minutesAgo > 30;
  const isWarning = order.minutesAgo > 15;

  return (
    <div className={cn(
      'flex flex-col gap-1 p-2.5 rounded-xl bg-muted/20 border text-xs min-w-[130px] shrink-0',
      isLong ? 'border-destructive/40' : isWarning ? 'border-amber-500/30' : 'border-border/10'
    )}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground tabular-nums">
          {order.source === 'balcao' ? `#${order.order_number || '—'}` : `M${order.table_number}`}
        </span>
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
          isLong ? 'bg-destructive/15 text-destructive' :
          isWarning ? 'bg-amber-500/15 text-amber-400' :
          'bg-muted/60 text-muted-foreground'
        )}>
          {order.minutesAgo}min
        </span>
      </div>
      <span className="font-semibold text-foreground tabular-nums">{formatCurrency(order.total)}</span>
      {order.customer_name && (
        <span className="text-[10px] text-muted-foreground truncate">{order.customer_name}</span>
      )}
    </div>
  );
}

export function ServiceOrderPipeline({ pipeline }: { pipeline: PipelineGroups }) {
  const total = pipeline.pending.length + pipeline.preparing.length + pipeline.ready.length;

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <AppIcon name="view_kanban" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground flex-1">Pipeline de Pedidos</h3>
        {total > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
            {total}
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <AppIcon name="check_circle" size={20} className="text-success" />
          </div>
          <p className="text-xs text-muted-foreground">Nenhum pedido ativo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {COLUMNS.map(col => {
            const items = pipeline[col.key];
            if (items.length === 0) return null;
            return (
              <div key={col.key}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', col.bg, col.color)}>
                    <AppIcon name={col.icon} size={11} />
                    {col.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{items.length}</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 snap-x">
                  {items.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
