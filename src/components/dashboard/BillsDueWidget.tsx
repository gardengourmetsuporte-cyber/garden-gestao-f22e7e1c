import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrencySimple as formatCurrency } from '@/lib/format';
import type { BillDueSoon } from '@/hooks/useDashboardStats';

interface Props {
  bills: BillDueSoon[];
  onNavigate?: () => void;
}

function getBillUrgencyColor(daysUntilDue: number) {
  if (daysUntilDue <= 0) return 'text-destructive';
  if (daysUntilDue <= 2) return 'text-warning';
  return 'text-muted-foreground';
}

function BillRow({ bill }: { bill: BillDueSoon }) {
  const urgency = getBillUrgencyColor(bill.daysUntilDue);
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-secondary/30">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{bill.description}</p>
        <p className={cn("text-[10px] font-medium mt-0.5", urgency)}>
          {bill.daysUntilDue <= 0
            ? '⚠ Vence hoje'
            : bill.daysUntilDue === 1
              ? 'Vence amanhã'
              : `Vence em ${bill.daysUntilDue} dias`}
        </p>
      </div>
      <span className={cn("text-[13px] font-bold ml-3 shrink-0 tabular-nums", urgency)}>
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
    <div className="space-y-2">
      {groups.map(group => {
        const subtotal = group.items.reduce((s, b) => s + b.amount, 0);
        const hasUrgent = group.items.some(b => b.daysUntilDue <= 1);
        const isOpen = openGroups.has(group.name);
        return (
          <div key={group.name}>
            <button
              onClick={() => toggleGroup(group.name)}
              className="flex items-center w-full py-3 px-3 rounded-xl hover:bg-secondary/40 transition-colors touch-manipulation"
              type="button"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${group.color}, ${group.color}cc)`,
                  boxShadow: `0 3px 8px -2px ${group.color}40`,
                }}
              >
                <AppIcon name={group.icon} size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0 ml-3 text-left">
                <span className="text-[13px] font-semibold text-foreground truncate block">{group.name}</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 mr-2 shrink-0">({group.items.length})</span>
              <div className="flex items-center gap-2 shrink-0">
                {hasUrgent && <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />}
                <span className={cn(
                  "text-[13px] font-bold tabular-nums",
                  hasUrgent ? 'text-destructive' : 'text-warning'
                )}>
                  {formatCurrency(subtotal)}
                </span>
                <AppIcon
                  name="ChevronDown"
                  size={12}
                  className={cn("text-muted-foreground/50 transition-transform duration-200", isOpen && "rotate-180")}
                />
              </div>
            </button>
            {isOpen && (
              <div className="space-y-1.5 mt-1 ml-4 pl-3 border-l-2 border-border/20">
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
    <div className="space-y-1.5">
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
  const hasUrgent = bills.some(b => b.daysUntilDue <= 1);

  return (
    <div className="card-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon name="AlertTriangle" size={15} className={hasUrgent ? 'text-destructive' : 'text-warning'} />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contas a Vencer</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-secondary/60 p-0.5">
            <button
              onClick={() => setMode('grouped')}
              className={cn(
                'px-1.5 py-1 rounded-md transition-colors touch-manipulation',
                viewMode === 'grouped' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Agrupado" type="button"
            >
              <AppIcon name="LayoutGrid" size={13} />
            </button>
            <button
              onClick={() => setMode('list')}
              className={cn(
                'px-1.5 py-1 rounded-md transition-colors touch-manipulation',
                viewMode === 'list' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Lista" type="button"
            >
              <AppIcon name="List" size={13} />
            </button>
          </div>
          {onNavigate && (
            <button onClick={onNavigate} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
              <AppIcon name="ArrowRight" size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Total banner */}
      <div className={cn(
        "flex items-center justify-between rounded-2xl p-4",
        hasUrgent ? "bg-destructive/8" : "bg-warning/8"
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            hasUrgent ? "bg-destructive/15" : "bg-warning/15"
          )}>
            <AppIcon name="Receipt" size={17} className={hasUrgent ? "text-destructive" : "text-warning"} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total próximos 7 dias</p>
            <p className="text-[11px] text-muted-foreground">{bills.length} conta{bills.length !== 1 ? 's' : ''} pendente{bills.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className={cn(
          "text-xl font-black tabular-nums",
          hasUrgent ? "text-destructive" : "text-warning"
        )}>
          {formatCurrency(total)}
        </span>
      </div>

      {viewMode === 'grouped' ? (
        <GroupedView bills={bills} />
      ) : (
        <ListView bills={bills} />
      )}
    </div>
  );
}
