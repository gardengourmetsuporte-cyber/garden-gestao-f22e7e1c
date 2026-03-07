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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <AppIcon name={icon} size={16} style={{ color }} />
          </div>
          <span className="text-xs font-semibold text-foreground truncate">{name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
            {transactions.length}
          </Badge>
          {allPaid ? (
            <div className="w-3 h-3 rounded-full bg-success shrink-0" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-warning shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn(
            "text-xs font-bold font-display",
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
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 mt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
