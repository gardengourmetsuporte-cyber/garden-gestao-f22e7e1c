import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, Check, Loader2 } from 'lucide-react';
import { FinanceTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';
import { useState } from 'react';

interface TransactionItemProps {
  transaction: FinanceTransaction;
  onClick?: () => void;
  onTogglePaid?: (id: string, isPaid: boolean) => Promise<void>;
}

export function TransactionItem({ transaction, onClick, onTogglePaid }: TransactionItemProps) {
  const { type, amount, description, category, account, is_paid } = transaction;
  const [isToggling, setIsToggling] = useState(false);

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

  const handleTogglePaid = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTogglePaid || isToggling) return;
    
    setIsToggling(true);
    await onTogglePaid(transaction.id, !is_paid);
    setIsToggling(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border transition-all w-full",
        !is_paid && "opacity-60"
      )}
    >
      {/* Quick pay toggle */}
      <button
        onClick={handleTogglePaid}
        disabled={isToggling}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
          is_paid 
            ? "bg-success border-success text-success-foreground" 
            : "border-muted-foreground/30 hover:border-success hover:bg-success/10",
          isToggling && "opacity-50"
        )}
      >
        {isToggling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : is_paid ? (
          <Check className="w-4 h-4" />
        ) : null}
      </button>

      {/* Content - clickable area for editing */}
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left min-w-0"
      >
        {/* Type icon */}
        <div className="flex-shrink-0">
          {getTypeIcon()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{description}</p>
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
    </div>
  );
}
