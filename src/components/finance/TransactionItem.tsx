 import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, Check, Loader2 } from 'lucide-react';
 import { FinanceTransaction } from '@/types/finance';
 import { cn } from '@/lib/utils';
 import { getLucideIcon } from '@/lib/icons';
import { useState, useRef, useCallback } from 'react';
  
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

    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const isSwiping = useRef(false);
    const isGestureLocked = useRef<null | 'horizontal' | 'vertical'>(null);
    const containerRef = useRef<HTMLDivElement>(null);
  
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

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      isSwiping.current = true;
      isGestureLocked.current = null;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      if (!isSwiping.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const diffX = startXRef.current - currentX; // + = swipe left
      const diffY = startYRef.current - currentY;

      // Lock gesture direction once the user moves a bit
      if (!isGestureLocked.current) {
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        // small deadzone to avoid accidental activation
        if (absX < 8 && absY < 8) return;

        isGestureLocked.current = absX > absY ? 'horizontal' : 'vertical';
      }

      // If user is scrolling vertically, don't open swipe actions
      if (isGestureLocked.current === 'vertical') {
        setSwipeOffset(0);
        isSwiping.current = false;
        return;
      }

      // horizontal swipe: prevent page scroll while swiping
      e.preventDefault();

      // Only allow swipe left (positive diffX)
      if (diffX > 0) {
        setSwipeOffset(Math.min(diffX, 140));
      } else if (diffX < -20) {
        // Reset if swiping right
        setSwipeOffset(0);
      }
    }, []);

    const handleTouchEnd = useCallback(() => {
      isSwiping.current = false;
      isGestureLocked.current = null;

      setSwipeOffset((current) => {
        if (current > 70) return 140;
        return 0;
      });
    }, []);

   return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
       {/* Swipe action buttons - positioned behind */}
       <div 
        className={cn(
          "absolute inset-y-0 right-0 flex",
          swipeOffset === 0 && "pointer-events-none"
        )}
        style={{ width: '140px' }}
       >
         <button
           onClick={handleTogglePaid}
           disabled={isToggling}
           className={cn(
            "w-[70px] flex items-center justify-center transition-colors",
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
          "flex items-center gap-3 p-3 bg-card border rounded-xl w-full relative",
           !is_paid && "opacity-60",
          swipeOffset === 0 && "transition-transform duration-200 ease-out"
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