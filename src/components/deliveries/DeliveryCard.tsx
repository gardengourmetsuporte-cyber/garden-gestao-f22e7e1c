import { MapPin, Package, Clock, Truck, CheckCircle2, XCircle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
  out: { label: 'Em rota', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Truck className="w-3 h-3" /> },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <XCircle className="w-3 h-3" /> },
};

interface Props {
  delivery: Delivery;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
}

export function DeliveryCard({ delivery, onStatusChange }: Props) {
  const addr = delivery.address;
  const cfg = STATUS_CONFIG[delivery.status];

  const nextStatus: DeliveryStatus | null =
    delivery.status === 'pending' ? 'out' :
    delivery.status === 'out' ? 'delivered' : null;

  const hasCoords = addr?.lat && addr?.lng;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${addr!.lat},${addr!.lng}`
    : null;

  return (
    <div className="rounded-xl border border-border/30 bg-background/60 p-3 space-y-2 hover:bg-background/80 transition-colors">
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {addr?.customer_name || 'Sem nome'}
          </p>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[11px] truncate">{addr?.full_address || '—'}</span>
          </div>
          {addr?.reference && (
            <p className="text-[10px] text-muted-foreground/60 italic mt-0.5 truncate">
              Ref: {addr.reference}
            </p>
          )}
        </div>
        <Badge variant="outline" className={`shrink-0 ${cfg.color} text-[10px] gap-1 h-5 px-1.5 border`}>
          {cfg.icon} {cfg.label}
        </Badge>
      </div>

      {/* Items */}
      {delivery.items_summary && (
        <div className="flex items-start gap-1.5 text-muted-foreground">
          <Package className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="text-[11px] line-clamp-2">{delivery.items_summary}</span>
        </div>
      )}

      {/* Footer: time + value + actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/20">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
            {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          {delivery.total > 0 && (
            <span className="text-xs font-bold text-primary whitespace-nowrap tabular-nums">
              R$ {delivery.total.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {mapsUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              asChild
            >
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
          {nextStatus && (
            <Button
              size="sm"
              variant={nextStatus === 'delivered' ? 'default' : 'outline'}
              className="h-7 text-[11px] px-2.5 gap-1"
              onClick={() => onStatusChange(delivery.id, nextStatus)}
            >
              {nextStatus === 'out' ? (
                <><Truck className="w-3 h-3" /> Saiu</>
              ) : (
                <><CheckCircle2 className="w-3 h-3" /> Entregue</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
