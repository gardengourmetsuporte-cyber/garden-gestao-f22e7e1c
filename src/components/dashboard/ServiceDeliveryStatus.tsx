import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { ActiveDelivery, HubActiveOrder } from '@/hooks/useServiceDashboard';

const PLATFORM_CONFIG: Record<string, { label: string; variant: string }> = {
  ifood: { label: 'iFood', variant: 'bg-red-500/15 text-red-400' },
  rappi: { label: 'Rappi', variant: 'bg-orange-500/15 text-orange-400' },
  uber_eats: { label: 'Uber Eats', variant: 'bg-primary/15 text-primary' },
  aiqfome: { label: 'AiQFome', variant: 'bg-violet-500/15 text-violet-400' },
  manual: { label: 'Manual', variant: 'bg-muted/40 text-muted-foreground' },
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
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' }}>
            <AppIcon name="local_shipping" size={16} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Entregas</h3>
        </div>
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6B7280, #9CA3AF)' }}>
            <AppIcon name="local_shipping" size={20} className="text-white" />
          </div>
          <p className="text-xs text-muted-foreground">Nenhuma entrega ativa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Own deliveries */}
      {deliveries.length > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
              <AppIcon name="two_wheeler" size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground flex-1">Entregas em Rota</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 tabular-nums">
              {deliveries.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {deliveries.map(d => (
              <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/20 border border-border/10 text-xs">
                <span className="font-bold min-w-[44px] tabular-nums text-foreground">#{d.order_number || '—'}</span>
                <span className="truncate flex-1 text-muted-foreground">{d.items_summary || 'Sem itens'}</span>
                <span className="font-semibold tabular-nums text-foreground">{formatCurrency(d.total)}</span>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  d.status === 'out' ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
                )}>
                  {d.status === 'out' ? 'Em rota' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hub orders */}
      {hubOrders.length > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #EF4444, #F472B6)' }}>
              <AppIcon name="hub" size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground flex-1">Delivery Hub</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 tabular-nums">
              {hubOrders.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {hubOrders.map(o => {
              const platform = PLATFORM_CONFIG[o.platform] || PLATFORM_CONFIG.manual;
              return (
                <div key={o.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/20 border border-border/10 text-xs">
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0', platform.variant)}>
                    {platform.label}
                  </span>
                  <span className="truncate flex-1 text-foreground font-medium">{o.customer_name}</span>
                  <span className="font-semibold tabular-nums text-foreground">{formatCurrency(o.total)}</span>
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
                    o.minutesAgo > 15 ? 'bg-amber-500/15 text-amber-400' : 'bg-muted/60 text-muted-foreground'
                  )}>
                    {o.minutesAgo}min
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                    {HUB_STATUS[o.status] || o.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
