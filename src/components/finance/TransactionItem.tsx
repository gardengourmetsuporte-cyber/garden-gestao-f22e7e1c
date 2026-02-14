import { Loader2 } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { FinanceTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';
import { useState, useRef, useCallback } from 'react';

interface TransactionItemProps {
  transaction: FinanceTransaction;
  isNew?: boolean;
  onClick?: () => void;
  onTogglePaid?: (id: string, isPaid: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  disableSwipe?: boolean;
}

const MAX_SWIPE = 140;
const DEADZONE = 8;

export function TransactionItem({ transaction, isNew, onClick, onTogglePaid, onDelete, disableSwipe }: TransactionItemProps) {
  const { type, amount, description, category, account, is_paid } = transaction;
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isSwiping = useRef(false);
  const isGestureLocked = useRef<null | 'horizontal' | 'vertical'>(null);

  const getTypeIcon = () => {
    switch (type) {
      case 'income':
        return (
          <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
            <AppIcon name="ArrowUpCircle" size={18} className="text-success" />
          </div>
        );
      case 'expense':
        return (
          <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center">
            <AppIcon name="ArrowDownCircle" size={18} className="text-destructive" />
          </div>
        );
      case 'transfer':
        return (
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="ArrowLeftRight" size={18} className="text-primary" />
          </div>
        );
      case 'credit_card':
        return (
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <AppIcon name="CreditCard" size={18} className="text-primary" />
          </div>
        );
    }
  };

  const getCategoryIcon = () => {
    if (!category?.icon) {
      // Colored dot fallback
      return <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category?.color || 'hsl(var(--muted-foreground))' }} />;
    }
    // Check if icon is mapped; if not, show colored dot
    const isMapped = !!ICON_MAP[category.icon];
    if (!isMapped) {
      return <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />;
    }
    return <AppIcon name={category.icon} size={14} style={{ color: category.color }} className="flex-shrink-0" />;
  };

  const formatAmount = () => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
    setSwipeOffset(0);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disableSwipe) return;
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      isSwiping.current = true;
      isGestureLocked.current = null;
    },
    [disableSwipe]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = startXRef.current - currentX;
    const diffY = startYRef.current - currentY;

    if (!isGestureLocked.current) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      if (absX < 14 && absY < 14) return;

      const isHorizontal = absX > absY * 1.6 && absX >= 18;
      const isVertical = absY > absX * 1.2 && absY >= 14;

      if (isHorizontal) isGestureLocked.current = 'horizontal';
      else if (isVertical) isGestureLocked.current = 'vertical';
      else return;
    }

    if (isGestureLocked.current === 'vertical') {
      setSwipeOffset((prev) => (prev === 0 ? 0 : 0));
      isSwiping.current = false;
      return;
    }

    const clamped = Math.max(0, Math.min(diffX, MAX_SWIPE));
    setSwipeOffset(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isSwiping.current = false;
    isGestureLocked.current = null;

    setSwipeOffset((current) => (current > MAX_SWIPE / 2 ? MAX_SWIPE : 0));
  }, []);

  return (
    <div className="relative isolate rounded-xl">
      {/* Swipe action buttons - behind */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex z-0 transition-opacity overflow-hidden rounded-xl',
          swipeOffset === 0 ? 'pointer-events-none opacity-0' : 'opacity-100'
        )}
        style={{ width: `${MAX_SWIPE}px` }}
      >
        <button
          onClick={handleTogglePaid}
          disabled={isToggling}
          className={cn(
            'w-[70px] flex items-center justify-center transition-colors',
            is_paid ? 'bg-warning hover:bg-warning/90' : 'bg-success hover:bg-success/90'
          )}
        >
          {isToggling ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="text-white text-sm font-medium">{is_paid ? 'Desfazer' : 'Pagar'}</span>
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-[70px] bg-destructive hover:bg-destructive/90 flex items-center justify-center transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="text-white text-sm font-medium">Apagar</span>
          )}
        </button>
      </div>

      {/* Main content - slides left to reveal actions */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-card border rounded-xl w-full relative z-10 touch-pan-y',
          !is_paid && 'opacity-70',
          isNew && 'border-[hsl(var(--neon-cyan)/0.6)] shadow-[0_0_12px_hsl(var(--neon-cyan)/0.3),0_0_4px_hsl(var(--neon-cyan)/0.2)]',
          swipeOffset === 0 && 'transition-transform duration-200 ease-out'
        )}
        style={{ transform: `translate3d(-${swipeOffset}px, 0, 0)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Quick pay toggle */}
        <button
          onClick={handleTogglePaid}
          disabled={isToggling}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
            is_paid
              ? 'bg-success border-success text-success-foreground'
              : 'border-muted-foreground/30 hover:border-success hover:bg-success/10',
            isToggling && 'opacity-50'
          )}
        >
          {isToggling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : is_paid ? (
            <AppIcon name="Check" size={16} />
          ) : null}
        </button>

        {/* Content - clickable area for editing */}
        <button onClick={onClick} className="flex-1 flex items-center gap-3 text-left min-w-0">
          {/* Type icon */}
          <div className="flex-shrink-0">{getTypeIcon()}</div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{description}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              {getCategoryIcon()}
              <span className="truncate max-w-[100px]">{category?.name || 'Sem categoria'}</span>
              {account && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <AppIcon name="Landmark" size={12} className="text-muted-foreground/60 flex-shrink-0" />
                  <span className="truncate max-w-[80px]">{account.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <p
            className={cn(
              'font-bold tabular-nums flex-shrink-0 text-sm',
              type === 'income'
                ? 'text-success'
                : type === 'transfer'
                  ? 'text-primary'
                  : 'text-destructive'
            )}
          >
            {formatAmount()}
          </p>
        </button>
      </div>
    </div>
  );
}
