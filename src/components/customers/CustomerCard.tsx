import { AppIcon } from '@/components/ui/app-icon';
import { Progress } from '@/components/ui/progress';
import type { Customer } from '@/types/customer';
import { SEGMENT_CONFIG } from '@/types/customer';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: Props) {
  const seg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.new;
  const daysSince = customer.last_purchase_at
    ? differenceInDays(new Date(), new Date(customer.last_purchase_at))
    : null;

  return (
    <div
      className="rounded-xl bg-card border p-4 space-y-2.5 active:scale-[0.98] transition-transform"
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{customer.name}</p>
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', seg.bg, seg.color)}>
              <AppIcon name={seg.icon} size={10} />
              {seg.label}
            </span>
          </div>
          {customer.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <AppIcon name="Phone" size={12} />
              {customer.phone}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <AppIcon name="Trash2" size={14} />
        </button>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10">Score</span>
        <Progress value={Math.min(customer.score, 100)} className="h-1.5 flex-1" />
        <span className="text-[10px] font-bold text-foreground w-6 text-right">{customer.score}</span>
      </div>

      {/* Bottom stats */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        {customer.loyalty_points > 0 && (
          <span className="flex items-center gap-1">
            <AppIcon name="Star" size={11} className="text-amber-500" />
            {customer.loyalty_points} pts
          </span>
        )}
        {(Number(customer.total_orders) || 0) > 0 && (
          <span>{customer.total_orders} pedidos</span>
        )}
        {(Number(customer.total_spent) || 0) > 0 && (
          <span>R$ {Number(customer.total_spent).toFixed(0)}</span>
        )}
        {daysSince !== null && (
          <span className={cn(daysSince > 60 && 'text-red-400')}>
            {daysSince === 0 ? 'Hoje' : `${daysSince}d atrás`}
          </span>
        )}
      </div>
    </div>
  );
}
