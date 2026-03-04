import { MapPin, Package, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
  out: { label: 'Em rota', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <XCircle className="w-3.5 h-3.5" /> },
};

interface Props {
  delivery: Delivery;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
}

export function DeliveryCard({ delivery, onStatusChange }: Props) {
  const addr = delivery.address;
  const cfg = STATUS_CONFIG[delivery.status];

  const nextStatus = (): DeliveryStatus | null => {
    if (delivery.status === 'pending') return 'out';
    if (delivery.status === 'out') return 'delivered';
    return null;
  };

  const next = nextStatus();

  return (
    <div className="card-base p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{addr?.customer_name || 'Sem nome'}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{addr?.full_address || '—'}</span>
          </p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${cfg.color} text-[10px] gap-1`}>
          {cfg.icon} {cfg.label}
        </Badge>
      </div>

      {delivery.items_summary && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Package className="w-3 h-3 shrink-0" />
          <span className="truncate">{delivery.items_summary}</span>
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true, locale: ptBR })}
        </span>

        <div className="flex items-center gap-2">
          {delivery.total > 0 && (
            <span className="text-xs font-semibold text-primary">
              R$ {delivery.total.toFixed(2)}
            </span>
          )}
          {next && (
            <Button
              size="sm"
              variant={next === 'delivered' ? 'default' : 'outline'}
              className="h-7 text-xs px-2.5"
              onClick={() => onStatusChange(delivery.id, next)}
            >
              {next === 'out' ? 'Saiu →' : 'Entregue ✓'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
