import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { ActiveDelivery, HubActiveOrder } from '@/hooks/useServiceDashboard';

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
  ifood: { label: 'iFood', color: 'text-red-500' },
  rappi: { label: 'Rappi', color: 'text-orange-500' },
  uber_eats: { label: 'Uber Eats', color: 'text-green-600' },
  aiqfome: { label: 'AiQFome', color: 'text-purple-500' },
  manual: { label: 'Manual', color: 'text-muted-foreground' },
};

const HUB_STATUS: Record<string, string> = {
  new: 'Novo',
  accepted: 'Aceito',
  preparing: 'Preparando',
  ready: 'Pronto',
  dispatched: 'A caminho',
};

export function ServiceDeliveryStatus({ deliveries, hubOrders }: { deliveries: ActiveDelivery[]; hubOrders: HubActiveOrder[] }) {
  const hasContent = deliveries.length > 0 || hubOrders.length > 0;

  if (!hasContent) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <AppIcon name="local_shipping" size={32} className="mx-auto mb-2 opacity-40" />
          Nenhuma entrega ativa
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Own deliveries */}
      {deliveries.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AppIcon name="two_wheeler" size={18} className="text-primary" />
              Entregas em Rota
              <Badge variant="secondary" className="ml-auto text-[10px]">{deliveries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {deliveries.map(d => (
              <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 text-xs">
                <span className="font-semibold min-w-[50px]">#{d.order_number || '—'}</span>
                <span className="truncate flex-1 text-muted-foreground">{d.items_summary || 'Sem itens'}</span>
                <span className="font-medium">{formatCurrency(d.total)}</span>
                <Badge variant={d.status === 'out' ? 'default' : 'secondary'} className="text-[10px]">
                  {d.status === 'out' ? 'Em rota' : 'Pendente'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hub orders */}
      {hubOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AppIcon name="hub" size={18} className="text-primary" />
              Delivery Hub
              <Badge variant="secondary" className="ml-auto text-[10px]">{hubOrders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {hubOrders.map(o => {
              const platform = PLATFORM_ICONS[o.platform] || PLATFORM_ICONS.manual;
              return (
                <div key={o.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 text-xs">
                  <span className={cn('font-bold text-[11px]', platform.color)}>{platform.label}</span>
                  <span className="text-muted-foreground">#{o.platform_display_id || '—'}</span>
                  <span className="truncate flex-1 text-foreground">{o.customer_name}</span>
                  <span className="font-medium">{formatCurrency(o.total)}</span>
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    o.minutesAgo > 15 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'
                  )}>
                    {o.minutesAgo}min
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {HUB_STATUS[o.status] || o.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
