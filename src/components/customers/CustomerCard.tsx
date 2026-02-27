import { AppIcon } from '@/components/ui/app-icon';
import type { Customer } from '@/types/customer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ORIGIN_LABELS: Record<string, { label: string; icon: string }> = {
  manual: { label: 'Manual', icon: 'PenSquare' },
  pdv: { label: 'PDV', icon: 'Monitor' },
  mesa: { label: 'Mesa', icon: 'Armchair' },
  ifood: { label: 'iFood', icon: 'Bike' },
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle' },
  csv: { label: 'CSV', icon: 'FileSpreadsheet' },
};

interface Props {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: Props) {
  const originInfo = ORIGIN_LABELS[customer.origin] || ORIGIN_LABELS.manual;

  return (
    <div className="rounded-xl bg-card border p-4 space-y-2 active:scale-[0.98] transition-transform" onClick={onEdit}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{customer.name}</p>
          {customer.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <AppIcon name="Phone" size={12} />
              {customer.phone}
            </p>
          )}
          {customer.email && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <AppIcon name="Mail" size={12} />
              {customer.email}
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

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60">
          <AppIcon name={originInfo.icon} size={11} />
          {originInfo.label}
        </span>
        {customer.total_orders > 0 && (
          <span>{customer.total_orders} pedidos</span>
        )}
        {customer.total_spent > 0 && (
          <span>R$ {Number(customer.total_spent).toFixed(2)}</span>
        )}
        {customer.last_purchase_at && (
          <span>Última: {format(new Date(customer.last_purchase_at), "dd/MM/yy", { locale: ptBR })}</span>
        )}
      </div>
    </div>
  );
}
