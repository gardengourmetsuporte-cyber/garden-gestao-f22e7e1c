import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-500', icon: 'schedule' },
  out: { label: 'Em rota', color: 'text-blue-400', icon: 'local_shipping' },
  delivered: { label: 'Entregue', color: 'text-emerald-500', icon: 'check_circle' },
  cancelled: { label: 'Cancelada', color: 'text-destructive', icon: 'cancel' },
};

interface Props {
  delivery: Delivery;
  selected?: boolean;
  compact?: boolean;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onCardClick?: (deliveryId: string) => void;
  onSetLocation?: (delivery: Delivery) => void;
  onEdit?: (delivery: Delivery) => void;
  onArchive?: (delivery: Delivery) => void;
  onSelect?: (deliveryId: string) => void;
}

export function DeliveryCard({ delivery, selected, compact, onStatusChange, onCardClick, onSetLocation, onEdit, onArchive, onSelect }: Props) {
  const addr = delivery.address;
  const cfg = STATUS_CONFIG[delivery.status];
  const hasCoords = addr?.lat && addr?.lng;

  const nextAction = delivery.status === 'pending'
    ? { status: 'out' as DeliveryStatus, label: 'Saiu', icon: 'local_shipping' }
    : delivery.status === 'out'
    ? { status: 'delivered' as DeliveryStatus, label: 'Entregue', icon: 'check_circle' }
    : null;

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${addr!.lat},${addr!.lng}`
    : null;

  return (
    <div
      className={cn(
        'rounded-xl bg-background/50 border transition-all p-3 cursor-pointer active:scale-[0.98]',
        selected
          ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5'
          : 'border-border/20 hover:border-border/40'
      )}
      onClick={() => onSelect ? onSelect(delivery.id) : onCardClick?.(delivery.id)}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          delivery.status === 'pending' && 'bg-amber-500/10',
          delivery.status === 'out' && 'bg-blue-500/10',
          delivery.status === 'delivered' && 'bg-emerald-500/10',
          delivery.status === 'cancelled' && 'bg-destructive/10',
        )}>
          <AppIcon name={cfg.icon} size={18} className={cfg.color} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {delivery.order_number && (
              <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                #{delivery.order_number}
              </span>
            )}
            <span className="text-sm font-semibold text-foreground truncate">
              {addr?.customer_name || 'Sem nome'}
            </span>
          </div>
          {!compact && addr?.full_address && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {addr.full_address}
            </p>
          )}
          {!compact && delivery.items_summary && (
            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
              {delivery.items_summary}
            </p>
          )}
        </div>

        {/* Price */}
        {delivery.total > 0 && (
          <span className="text-sm font-bold text-primary tabular-nums shrink-0">
            {formatCurrency(delivery.total)}
          </span>
        )}
      </div>

      {/* Footer: time + action buttons */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/10">
        <span className="text-[10px] text-muted-foreground/50 tabular-nums">
          {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true, locale: ptBR })}
        </span>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <button onClick={() => onEdit(delivery)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors">
              <AppIcon name="edit" size={14} className="text-muted-foreground" />
            </button>
          )}

          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors">
              <AppIcon name="navigation" size={14} className="text-emerald-400" />
            </a>
          )}

          {!hasCoords && onSetLocation && (
            <button onClick={() => onSetLocation(delivery)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/10 transition-colors">
              <AppIcon name="location_on" size={14} className="text-amber-500" />
            </button>
          )}

          {nextAction && (
            <button
              onClick={() => onStatusChange(delivery.id, nextAction.status)}
              className={cn(
                'h-7 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors',
                nextAction.status === 'out'
                  ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                  : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25',
              )}
            >
              <AppIcon name={nextAction.icon} size={14} />
              {nextAction.label}
            </button>
          )}

          {delivery.status === 'delivered' && onArchive && (
            <button
              onClick={() => onArchive(delivery)}
              className="h-7 px-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-secondary/50 flex items-center gap-1 transition-colors"
            >
              <AppIcon name="archive" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
