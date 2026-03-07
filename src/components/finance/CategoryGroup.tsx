import { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { FinanceTransaction, FinanceCategory } from '@/types/finance';
import { cn } from '@/lib/utils';

interface CategoryGroupProps {
  category: FinanceCategory | null;
  isTransfer?: boolean;
  transactions: FinanceTransaction[];
  children: React.ReactNode;
}

export function CategoryGroup({ category, isTransfer, transactions, children }: CategoryGroupProps) {
  const [open, setOpen] = useState(false);

  const subtotal = transactions.reduce((sum, t) => {
    if (t.type === 'income') return sum + Number(t.amount);
    if (t.type === 'expense' || t.type === 'credit_card') return sum - Number(t.amount);
    return sum;
  }, 0);

  const pendingCount = transactions.filter(t => !t.is_paid).length;
  const allPaid = pendingCount === 0;

  const icon = isTransfer ? 'ArrowLeftRight' : category?.icon || 'Category';
  const name = isTransfer ? 'Transferências' : category?.name || 'Sem categoria';
  const color = isTransfer ? 'hsl(var(--muted-foreground))' : category?.color || 'hsl(var(--muted-foreground))';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full bg-card border border-border/40 rounded-2xl overflow-hidden relative hover:bg-secondary/30 transition-colors">
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ backgroundColor: color }} />
        <div className="flex items-center w-full pl-5 pr-4 py-3.5">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <AppIcon name={icon} size={16} style={{ color }} />
            </div>
            <span className="text-xs font-semibold text-foreground truncate" title={name}>{name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {transactions.length}
            </Badge>
            <div className={cn("w-3 h-3 rounded-full", allPaid ? "bg-success" : "bg-warning")} />
            <span className={cn(
              "text-xs font-bold font-display tabular-nums min-w-[80px] text-right",
              subtotal >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {formatCurrency(subtotal)}
            </span>
            <AppIcon
              name="ChevronDown"
              size={14}
              className={cn(
                "text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 mt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
