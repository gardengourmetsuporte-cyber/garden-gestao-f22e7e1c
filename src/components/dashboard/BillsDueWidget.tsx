import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrencySimple as formatCurrency } from '@/lib/format';
import type { BillDueSoon } from '@/hooks/useDashboardStats';

interface Props {
  bills: BillDueSoon[];
}

function GroupedView({ bills }: { bills: BillDueSoon[] }) {
  const groups: { label: string; items: BillDueSoon[] }[] = [];
  const today: BillDueSoon[] = [];
  const tomorrow: BillDueSoon[] = [];
  const later: BillDueSoon[] = [];

  bills.forEach(b => {
    if (b.daysUntilDue <= 0) today.push(b);
    else if (b.daysUntilDue === 1) tomorrow.push(b);
    else later.push(b);
  });

  if (today.length) groups.push({ label: 'Vence hoje', items: today });
  if (tomorrow.length) groups.push({ label: 'Vence amanhã', items: tomorrow });
  if (later.length) groups.push({ label: 'Próximos dias', items: later });

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const subtotal = group.items.reduce((s, b) => s + b.amount, 0);
        return (
          <div key={group.label} className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label} ({group.items.length})
              </span>
              <span className="text-[10px] font-bold text-warning">{formatCurrency(subtotal)}</span>
            </div>
            <div className="space-y-1">
              {group.items.map(bill => (
                <BillRow key={bill.id} bill={bill} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ bills }: { bills: BillDueSoon[] }) {
  return (
    <div className="space-y-1.5">
      {bills.map(bill => (
        <BillRow key={bill.id} bill={bill} />
      ))}
    </div>
  );
}

function BillRow({ bill }: { bill: BillDueSoon }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{bill.description}</p>
        <p className="text-[10px] text-muted-foreground">
          {bill.daysUntilDue <= 0
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
  );
}

export function BillsDueWidget({ bills }: Props) {
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>(() => {
    return (localStorage.getItem('bills-due-view') as 'grouped' | 'list') || 'list';
  });

  const toggleView = () => {
    const next = viewMode === 'list' ? 'grouped' : 'list';
    setViewMode(next);
    localStorage.setItem('bills-due-view', next);
  };

  if (bills.length === 0) return null;

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
        <div className="flex items-center gap-2">
          <button
            onClick={toggleView}
            className="p-1.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
            title={viewMode === 'list' ? 'Agrupar' : 'Lista'}
          >
            <AppIcon
              name={viewMode === 'list' ? 'LayoutGrid' : 'List'}
              size={14}
              className="text-muted-foreground"
            />
          </button>
          <span className="text-sm font-bold text-warning">{formatCurrency(total)}</span>
        </div>
      </div>

      {viewMode === 'grouped' ? (
        <GroupedView bills={bills} />
      ) : (
        <ListView bills={bills} />
      )}
    </div>
  );
}
