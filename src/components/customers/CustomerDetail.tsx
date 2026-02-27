import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Customer, LoyaltyEvent } from '@/types/customer';
import { SEGMENT_CONFIG } from '@/types/customer';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  events: LoyaltyEvent[];
  eventsLoading: boolean;
  onEdit: () => void;
  onAddPoints: (customerId: string) => void;
}

export function CustomerDetail({ open, onOpenChange, customer, events, eventsLoading, onEdit, onAddPoints }: Props) {
  if (!customer) return null;

  const seg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.new;
  const daysSince = customer.last_purchase_at
    ? differenceInDays(new Date(), new Date(customer.last_purchase_at))
    : null;

  // RFM breakdown (approximate from score)
  const recency = Math.min(30, Math.max(0, customer.score * 0.3));
  const frequency = Math.min(30, Math.max(0, customer.score * 0.3));
  const monetary = Math.min(40, Math.max(0, customer.score * 0.4));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {customer.name}
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', seg.bg, seg.color)}>
              <AppIcon name={seg.icon} size={10} />
              {seg.label}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 mt-4 pb-8">
          {/* Score visual */}
          <div className="rounded-xl bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de Relacionamento</span>
              <span className="text-2xl font-bold">{customer.score}</span>
            </div>
            <Progress value={Math.min(customer.score, 100)} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <p className="font-semibold">{daysSince !== null ? `${daysSince}d` : '-'}</p>
                <p className="text-muted-foreground">Recência</p>
              </div>
              <div>
                <p className="font-semibold">{customer.total_orders || 0}</p>
                <p className="text-muted-foreground">Frequência</p>
              </div>
              <div>
                <p className="font-semibold">R$ {Number(customer.total_spent || 0).toFixed(0)}</p>
                <p className="text-muted-foreground">Monetário</p>
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border p-3 text-center">
              <p className="text-lg font-bold text-amber-500">{customer.loyalty_points}</p>
              <p className="text-[10px] text-muted-foreground">Pontos Fidelidade</p>
            </div>
            <div className="rounded-xl bg-card border p-3 text-center">
              <p className="text-lg font-bold">{customer.visit_frequency_days ? `${Math.round(customer.visit_frequency_days)}d` : '-'}</p>
              <p className="text-[10px] text-muted-foreground">Freq. Visita</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1">
            {customer.phone && (
              <p className="text-sm flex items-center gap-2">
                <AppIcon name="Phone" size={14} className="text-muted-foreground" />
                {customer.phone}
              </p>
            )}
            {customer.email && (
              <p className="text-sm flex items-center gap-2">
                <AppIcon name="Mail" size={14} className="text-muted-foreground" />
                {customer.email}
              </p>
            )}
            {customer.birthday && (
              <p className="text-sm flex items-center gap-2">
                <AppIcon name="Cake" size={14} className="text-muted-foreground" />
                {format(new Date(customer.birthday + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>

          <Separator />

          {/* Loyalty history */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Histórico de Fidelidade</h3>
            {eventsLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AppIcon
                        name={ev.type === 'earn' ? 'Plus' : ev.type === 'redeem' ? 'Minus' : 'Gift'}
                        size={12}
                        className={ev.type === 'earn' ? 'text-emerald-500' : ev.type === 'redeem' ? 'text-red-500' : 'text-amber-500'}
                      />
                      <span>{ev.description || ev.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold', ev.type === 'redeem' ? 'text-red-500' : 'text-emerald-500')}>
                        {ev.type === 'redeem' ? '-' : '+'}{ev.points}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(ev.created_at), 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 pb-4">
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <AppIcon name="PenSquare" size={16} />
              Editar
            </Button>
            <Button className="flex-1" onClick={() => onAddPoints(customer.id)}>
              <AppIcon name="Star" size={16} />
              Adicionar Pontos
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
