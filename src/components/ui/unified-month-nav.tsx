import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UnifiedMonthNavProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  /** Show "Hoje" button */
  showToday?: boolean;
  onTodayClick?: () => void;
  className?: string;
}

export function UnifiedMonthNav({
  currentMonth,
  onMonthChange,
  showToday = false,
  onTodayClick,
  className,
}: UnifiedMonthNavProps) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl text-foreground/60 hover:text-foreground hover:bg-secondary"
        onClick={() => onMonthChange(subMonths(currentMonth, 1))}
      >
        <AppIcon name="ChevronLeft" size={16} />
      </Button>

      <button
        className={cn(
          "text-sm font-bold text-foreground capitalize px-4 py-1.5 rounded-xl",
          "hover:bg-secondary/60 transition-colors min-w-[140px] text-center"
        )}
        onClick={() => {
          onMonthChange(new Date());
          onTodayClick?.();
        }}
      >
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl text-foreground/60 hover:text-foreground hover:bg-secondary"
        onClick={() => onMonthChange(addMonths(currentMonth, 1))}
      >
        <AppIcon name="ChevronRight" size={16} />
      </Button>

      {showToday && onTodayClick && (
        <button
          className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors ml-1"
          onClick={onTodayClick}
        >
          Hoje
        </button>
      )}
    </div>
  );
}
