import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, Check } from 'lucide-react';
import { FinanceTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';

interface TransactionItemProps {
  transaction: FinanceTransaction;
  onClick?: () => void;
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const { type, amount, description, category, account, is_paid } = transaction;

  const getTypeIcon = () => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-5 h-5 text-success" />;
      case 'expense':
        return <ArrowDownCircle className="w-5 h-5 text-destructive" />;
      case 'transfer':
        return <ArrowLeftRight className="w-5 h-5 text-primary" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
    }
  };

  const getCategoryIcon = () => {
    if (!category?.icon) return null;
    const IconComponent = getLucideIcon(category.icon);
    if (!IconComponent) return null;
    return <IconComponent className="w-4 h-4" style={{ color: category.color }} />;
  };

  const formatAmount = () => {
    const formatted = new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
    
    if (type === 'income') return `+${formatted}`;
    if (type === 'expense' || type === 'credit_card') return `-${formatted}`;
    return formatted;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border transition-all w-full text-left",
        onClick && "hover:bg-secondary/50",
        !is_paid && "opacity-60"
      )}
    >
      {/* Type icon */}
      <div className="flex-shrink-0">
        {getTypeIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{description}</p>
          {is_paid && <Check className="w-3 h-3 text-success flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {getCategoryIcon()}
          <span className="truncate">{category?.name || 'Sem categoria'}</span>
          {account && (
            <>
              <span>•</span>
              <span className="truncate">{account.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <p className={cn(
        "font-semibold tabular-nums flex-shrink-0",
        type === 'income' ? "text-success" : 
        type === 'transfer' ? "text-primary" : 
        "text-destructive"
      )}>
        {formatAmount()}
      </p>
    </button>
  );
}
