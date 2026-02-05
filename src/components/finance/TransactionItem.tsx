import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, Check, Loader2, Trash2 } from 'lucide-react';
import { FinanceTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';
import { useState, useRef } from 'react';

interface TransactionItemProps {
  transaction: FinanceTransaction;
  onClick?: () => void;
  onTogglePaid?: (id: string, isPaid: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function TransactionItem({ transaction, onClick, onTogglePaid, onDelete }: TransactionItemProps) {
  const { type, amount, description, category, account, is_paid } = transaction;
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

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
    setSwipeOffset(0);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;
    
    setIsDeleting(true);
    await onDelete(transaction.id);
    setIsDeleting(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = startXRef.current - currentXRef.current;
    // Only allow left swipe (negative values)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 150)); // Max 150px
    } else {
      setSwipeOffset(Math.max(diff / 3, -50)); // Resistance when swiping right
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // Snap to action or back
    if (swipeOffset > 75) {
      setSwipeOffset(150);
    } else {
      setSwipeOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action buttons */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={handleTogglePaid}
          disabled={isToggling}
          className={cn(
            "w-[75px] flex items-center justify-center transition-colors",
            is_paid
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-success hover:bg-success/90"
          )}
        >
          {isToggling ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="text-white text-sm font-medium">
              {is_paid ? 'Desfazer' : 'Pagar'}
            </span>
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-[75px] bg-destructive hover:bg-destructive/90 flex items-center justify-center"
        >
          {isDeleting ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="text-white text-sm font-medium">Apagar</span>
          )}
        </button>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex items-center gap-3 p-3 bg-card border transition-transform w-full relative",
          !is_paid && "opacity-60",
          !isSwiping && "transition-transform duration-200"
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
    </div>
  );
}
