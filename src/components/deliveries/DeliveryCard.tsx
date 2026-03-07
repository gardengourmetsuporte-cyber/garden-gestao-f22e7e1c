import { MapPin, Package, Clock, Truck, CheckCircle2, XCircle, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
  out: { label: 'Em rota', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Truck },
  delivered: { label: 'Entregue', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
};

interface Props {
  delivery: Delivery;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onCardClick?: (deliveryId: string) => void;
  onSetLocation?: (delivery: Delivery) => void;
}

export function DeliveryCard({ delivery, onStatusChange, onCardClick, onSetLocation }: Props) {
  const addr = delivery.address;
  const cfg = STATUS_CONFIG[delivery.status];
  const StatusIcon = cfg.icon;

  const nextStatus: DeliveryStatus | null =
    delivery.status === 'pending' ? 'out' :
    delivery.status === 'out' ? 'delivered' : null;

  const hasCoords = addr?.lat && addr?.lng;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${addr!.lat},${addr!.lng}`
    : null;

  return (
    <div
      className="group rounded-xl bg-background/50 hover:bg-background/80 border border-border/20 hover:border-border/40 transition-all duration-200 p-3 cursor-pointer active:scale-[0.98]"
      onClick={() => onCardClick?.(delivery.id)}
    >
      {/* Top row: avatar + info + status */}
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          <StatusIcon className={`w-4 h-4 ${cfg.text}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug truncate">
              {addr?.customer_name || 'Sem nome'}
            </p>
            {delivery.total > 0 && (
              <span className="text-sm font-bold text-primary whitespace-nowrap tabular-nums shrink-0">
                R$ {delivery.total.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[11px] truncate">{addr?.full_address || '—'}</span>
          </div>

          {addr?.reference && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate italic">
              {addr.reference}
            </p>
          )}

          {delivery.items_summary && (
            <div className="flex items-center gap-1 mt-1 text-muted-foreground/70">
              <Package className="w-3 h-3 shrink-0" />
              <span className="text-[10px] line-clamp-1">{delivery.items_summary}</span>
            </div>
          )}
        </div>
      </div>

      {/* No location warning */}
      {!hasCoords && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSetLocation?.(delivery); }}
          className="flex items-center gap-2 mt-2 w-full px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] font-medium">Sem localização — toque para marcar</span>
        </button>
      )}

      {/* Bottom row: time + actions */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-border/10">
        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
          {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true, locale: ptBR })}
        </span>

        <div className="flex items-center gap-1">
          {mapsUrl && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Abrir rota">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              </a>
            </Button>
          )}

          {nextStatus && (
            <Button
              size="sm"
              variant={nextStatus === 'delivered' ? 'default' : 'outline'}
              className="h-7 text-[11px] px-3 gap-1.5 rounded-lg font-semibold"
              onClick={() => onStatusChange(delivery.id, nextStatus)}
            >
              {nextStatus === 'out' ? (
                <><Truck className="w-3.5 h-3.5" /> Saiu</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Entregue</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
