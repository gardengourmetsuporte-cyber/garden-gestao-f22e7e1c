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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groupMap = new Map<string, { name: string; icon: string; color: string; items: BillDueSoon[] }>();
  bills.forEach(b => {
    const key = b.categoryName;
    if (!groupMap.has(key)) {
      groupMap.set(key, { name: b.categoryName, icon: b.categoryIcon, color: b.categoryColor, items: [] });
    }
    groupMap.get(key)!.items.push(b);
  });

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    const totalA = a.items.reduce((s, i) => s + i.amount, 0);
    const totalB = b.items.reduce((s, i) => s + i.amount, 0);
    return totalB - totalA;
  });

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      {groups.map(group => {
        const subtotal = group.items.reduce((s, b) => s + b.amount, 0);
        const isOpen = openGroups.has(group.name);
        return (
          <div key={group.name}>
            <button
              onClick={() => toggleGroup(group.name)}
              className="flex items-center justify-between w-full p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors touch-manipulation"
              type="button"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: group.color + '20' }}
                >
                  <AppIcon name={group.icon} size={14} style={{ color: group.color }} />
                </div>
                <span className="text-xs font-medium text-foreground truncate">{group.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">({group.items.length})</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {group.items.some(b => b.daysUntilDue <= 0) && (
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                )}
                <span className="text-xs font-bold text-destructive">{formatCurrency(subtotal)}</span>
                <AppIcon
                  name="ChevronDown"
                  size={12}
                  className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </div>
            </button>
            {isOpen && (
              <div className="space-y-1 mt-1 ml-3 border-l-2 border-border/30 pl-2">
                {group.items.map(bill => (
                  <BillRow key={bill.id} bill={bill} />
                ))}
              </div>
            )}
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
