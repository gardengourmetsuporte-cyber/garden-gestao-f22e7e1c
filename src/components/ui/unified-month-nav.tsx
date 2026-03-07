import * as React from 'react';
import { format, addMonths, subMonths, setMonth, setYear, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface UnifiedMonthNavProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  /** Show "Hoje" shortcut */
  showToday?: boolean;
  onTodayClick?: () => void;
  /** Compact variant for inline/widget usage */
  compact?: boolean;
  className?: string;
}

export function UnifiedMonthNav({
  currentMonth,
  onMonthChange,
  showToday = false,
  onTodayClick,
  compact = false,
  className,
}: UnifiedMonthNavProps) {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(currentMonth.getFullYear());

  React.useEffect(() => {
    if (open) setViewYear(currentMonth.getFullYear());
  }, [open, currentMonth]);

  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(viewYear, i, 1), 'MMM', { locale: ptBR }).replace('.', ''),
    value: i,
  }));

  const handleMonthSelect = (monthIndex: number) => {
    onMonthChange(setMonth(setYear(currentMonth, viewYear), monthIndex));
    setOpen(false);
  };

  const chevronSize = compact ? 14 : 16;
  const chevronBtn = cn(
    "flex items-center justify-center rounded-xl transition-all active:scale-90",
    compact ? "w-7 h-7" : "w-9 h-9",
    "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
  );

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <button className={chevronBtn} onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
        <AppIcon name="ChevronLeft" size={chevronSize} />
      </button>

      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "relative capitalize font-bold tracking-tight transition-all rounded-xl",
              "hover:bg-secondary/40 active:scale-[0.97]",
              compact
                ? "text-xs px-3 py-1.5 min-w-[90px]"
                : "text-sm px-5 py-2 min-w-[160px]"
            )}
          >
            {format(currentMonth, compact ? 'MMM yyyy' : 'MMMM yyyy', { locale: ptBR })}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[260px] p-3 rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl"
          align="center"
          sideOffset={8}
          avoidCollisions={false}
        >
          {/* Year row */}
          <div className="flex items-center justify-between mb-3">
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary/60 transition-colors active:scale-90"
              onClick={() => setViewYear(y => y - 1)}
            >
              <AppIcon name="ChevronLeft" size={14} className="text-muted-foreground" />
            </button>
            <span className="text-sm font-bold text-foreground tabular-nums">{viewYear}</span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary/60 transition-colors active:scale-90"
              onClick={() => setViewYear(y => y + 1)}
            >
              <AppIcon name="ChevronRight" size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {months.map((m) => {
              const isSelected = currentMonth.getMonth() === m.value && currentMonth.getFullYear() === viewYear;
              const isCurrent = new Date().getMonth() === m.value && new Date().getFullYear() === viewYear;

              return (
                <button
                  key={m.value}
                  onClick={() => handleMonthSelect(m.value)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-semibold capitalize transition-all active:scale-95",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-glow-primary"
                      : isCurrent
                        ? "ring-1 ring-primary/30 text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Today shortcut inside popover */}
          {!isCurrentMonth && (
            <button
              className="w-full mt-2.5 py-1.5 text-xs font-semibold text-primary rounded-lg hover:bg-primary/10 transition-colors"
              onClick={() => {
                onMonthChange(new Date());
                onTodayClick?.();
                setOpen(false);
              }}
            >
              Ir para hoje
            </button>
          )}
        </PopoverContent>
      </Popover>

      <button className={chevronBtn} onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
        <AppIcon name="ChevronRight" size={chevronSize} />
      </button>

      {showToday && onTodayClick && !isCurrentMonth && (
        <button
          className="text-[11px] font-semibold text-primary px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors ml-0.5"
          onClick={onTodayClick}
        >
          Hoje
        </button>
      )}
    </div>
  );
}
