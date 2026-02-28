import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { BillDueSoon } from '@/hooks/useDashboardStats';

interface Props {
  bills: BillDueSoon[];
}

export function BillsDueWidget({ bills }: Props) {
  if (bills.length === 0) return null;

  const formatCurrency = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const total = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="card-command p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
            <AppIcon name="AlertTriangle" size={16} className="text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
              Contas a Vencer
            </h3>
            <span className="text-[10px] text-muted-foreground">Próximos 7 dias</span>
          </div>
        </div>
        <span className="text-sm font-bold text-warning">{formatCurrency(total)}</span>
      </div>

      <div className="space-y-1.5">
        {bills.map(bill => (
          <div key={bill.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{bill.description}</p>
              <p className="text-[10px] text-muted-foreground">
                {bill.daysUntilDue === 0
                  ? 'Vence hoje'
                  : bill.daysUntilDue === 1
                    ? 'Vence amanhã'
                    : `Vence em ${bill.daysUntilDue} dias`}
              </p>
            </div>
            <span className={cn(
              "text-xs font-bold ml-2 shrink-0",
              bill.daysUntilDue <= 1 ? 'text-destructive' : 'text-warning'
            )}>
              {formatCurrency(bill.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
