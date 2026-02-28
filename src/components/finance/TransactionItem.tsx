import { AppIcon } from '@/components/ui/app-icon';
import { FinanceTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';
import { useState, useRef, useCallback } from 'react';

interface TransactionItemProps {
  transaction: FinanceTransaction;
  onClick?: () => void;
  onTogglePaid?: (id: string, isPaid: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  disableSwipe?: boolean;
}

const MAX_SWIPE = 140;

export function TransactionItem({ transaction, onClick, onTogglePaid, onDelete, disableSwipe }: TransactionItemProps) {
  const { type, amount, description, category, account, is_paid } = transaction;
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isSwiping = useRef(false);
  const isGestureLocked = useRef<null | 'horizontal' | 'vertical'>(null);

  const getTypeColor = () => {
    switch (type) {
      case 'income': return 'var(--color-income)';
      case 'expense': return 'var(--color-expense)';
      case 'transfer': return 'var(--color-transfer)';
      case 'credit_card': return 'var(--color-credit-card)';
    }
  };

  const getTypeIcon = () => {
    const colorVar = getTypeColor();
    const iconMap: Record<string, string> = {
      income: 'ArrowUpCircle',
      expense: 'ArrowDownCircle',
      transfer: 'ArrowLeftRight',
      credit_card: 'CreditCard',
    };
    return (
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: `hsl(${colorVar} / 0.12)`,
          border: `1px solid hsl(${colorVar} / 0.2)`,
        }}
      >
        <AppIcon name={iconMap[type]} size={18} style={{ color: `hsl(${colorVar})` }} />
      </div>
    );
  };

  const getCategoryIcon = () => {
    if (!category?.icon) {
      return (
        <div
          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: category?.color || 'hsl(var(--muted-foreground))' }}
        />
      );
    }
    const isMapped = !!ICON_MAP[category.icon];
    if (!isMapped) {
      return <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />;
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
    navigator.vibrate?.(15);

    // Show micro-animation for paying
    if (!is_paid) {
      setJustPaid(true);
      setTimeout(() => setJustPaid(false), 600);
    }

    await onTogglePaid(transaction.id, !is_paid);
    setIsToggling(false);
    setSwipeOffset(0);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    navigator.vibrate?.([10, 30, 10]);
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
      setSwipeOffset(prev => prev === 0 ? 0 : 0);
      isSwiping.current = false;
      return;
    }

    const clamped = Math.max(0, Math.min(diffX, MAX_SWIPE));
    setSwipeOffset(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isSwiping.current = false;
    isGestureLocked.current = null;
    setSwipeOffset(current => current > MAX_SWIPE / 2 ? MAX_SWIPE : 0);
  }, []);

  return (
    <div className={cn("relative isolate rounded-xl", isDeleting && "animate-delete-out overflow-hidden")}>
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
            is_paid ? 'bg-pending hover:bg-pending/90' : 'bg-income hover:bg-income/90'
          )}
        >
          {isToggling ? (
            <AppIcon name="Progress_activity" size={20} className="text-white animate-spin" />
          ) : (
            <span className="text-white text-sm font-medium">{is_paid ? 'Desfazer' : 'Pagar'}</span>
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-[70px] bg-expense hover:bg-expense/90 flex items-center justify-center transition-colors"
        >
          {isDeleting ? (
            <AppIcon name="Progress_activity" size={20} className="text-white animate-spin" />
          ) : (
            <span className="text-white text-sm font-medium">Apagar</span>
          )}
        </button>
      </div>

      <div
        className={cn(
          'flex items-center gap-3 p-3.5 bg-card/60 backdrop-blur-2xl border border-white/[0.04] rounded-[18px] w-full relative z-10 touch-pan-y transition-all duration-300',
          !is_paid && 'opacity-70',
          swipeOffset === 0 ? 'hover:bg-primary/10 hover:border-primary/30 hover:shadow-glow active:scale-[0.985]' : '',
          swipeOffset === 0 && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: `translate3d(-${swipeOffset}px, 0, 0)`,
          boxShadow: is_paid ? 'inset 0 1px 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.15)' : 'inset 0 1px 1px rgba(255,255,255,0.02)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Quick pay toggle with micro-animation */}
        <button
          onClick={handleTogglePaid}
          disabled={isToggling}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
            is_paid
              ? 'bg-income border-income text-white'
              : 'border-muted-foreground/30 hover:border-income hover:bg-income/10',
            isToggling && 'opacity-50',
            justPaid && 'animate-paid-check animate-ripple-success'
          )}
        >
          {isToggling ? (
            <AppIcon name="Progress_activity" size={16} className="animate-spin" />
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
            <p className="font-semibold font-display truncate text-sm">{description}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              {getCategoryIcon()}
              <span
                className="truncate max-w-[100px] px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: category?.color ? `${category.color}18` : 'hsl(var(--secondary))',
                  color: category?.color || 'hsl(var(--muted-foreground))',
                }}
              >
                {category?.name || 'Sem categoria'}
              </span>
              {account && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="truncate max-w-[70px] text-[10px]">{account.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <p
            className={cn('font-bold font-display tabular-nums flex-shrink-0 text-sm')}
            style={{ color: `hsl(${getTypeColor()})` }}
          >
            {formatAmount()}
          </p>
        </button>
      </div>
    </div>
  );
}
