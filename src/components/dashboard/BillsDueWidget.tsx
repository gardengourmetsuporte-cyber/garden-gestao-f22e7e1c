import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrencySimple as formatCurrency } from '@/lib/format';
import type { BillDueSoon } from '@/hooks/useDashboardStats';

interface Props {
  bills: BillDueSoon[];
  onNavigate?: () => void;
}

function BillRow({ bill }: { bill: BillDueSoon }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
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

function GroupedView({ bills }: { bills: BillDueSoon[] }) {
  const today: BillDueSoon[] = [];
  const tomorrow: BillDueSoon[] = [];
  const later: BillDueSoon[] = [];

  bills.forEach(b => {
    if (b.daysUntilDue <= 0) today.push(b);
    else if (b.daysUntilDue === 1) tomorrow.push(b);
    else later.push(b);
  });

  const groups = [
    { label: 'Vence hoje', items: today },
    { label: 'Vence amanhã', items: tomorrow },
    { label: 'Próximos dias', items: later },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const subtotal = group.items.reduce((s, b) => s + b.amount, 0);
        return (
          <div key={group.label} className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label} ({group.items.length})
              </span>
              <span className="text-[10px] font-bold text-destructive">{formatCurrency(subtotal)}</span>
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
  const sorted = [...bills].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return (
    <div className="space-y-1">
      {sorted.map(bill => (
        <BillRow key={bill.id} bill={bill} />
      ))}
    </div>
  );
}

export function BillsDueWidget({ bills, onNavigate }: Props) {
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>(() => {
    const saved = localStorage.getItem('bills-due-view');
    return saved === 'list' || saved === 'grouped' ? saved : 'grouped';
  });

  const setMode = (mode: 'grouped' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('bills-due-view', mode);
  };

  if (bills.length === 0) return null;

  const total = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="card-command p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigate}
          className={cn("flex items-center gap-2", onNavigate ? 'cursor-pointer' : 'cursor-default')}
          disabled={!onNavigate}
          type="button"
        >
          <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
            <AppIcon name="AlertTriangle" size={16} className="text-warning" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
              Contas a Vencer
            </h3>
            <span className="text-[10px] text-muted-foreground">Próximos 7 dias</span>
          </div>
          {onNavigate && <AppIcon name="ChevronRight" size={12} className="ml-1 text-muted-foreground/40" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-secondary/60 p-0.5">
            <button
              onClick={() => setMode('grouped')}
              className={cn(
                'px-2 py-1 rounded-md transition-colors touch-manipulation',
                viewMode === 'grouped' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Agrupado"
              type="button"
            >
              <AppIcon name="LayoutGrid" size={14} />
            </button>
            <button
              onClick={() => setMode('list')}
              className={cn(
                'px-2 py-1 rounded-md transition-colors touch-manipulation',
                viewMode === 'list' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Lista"
              type="button"
            >
              <AppIcon name="List" size={14} />
            </button>
          </div>
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
