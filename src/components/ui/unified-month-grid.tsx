import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export interface DayIndicator {
  color: string;
  /** Optional class name instead of inline color */
  className?: string;
}

export interface UnifiedMonthGridProps {
  currentMonth: Date;
  selectedDate?: string | null;
  onSelectDate?: (dateKey: string) => void;
  /** Return dot indicators for a date key (yyyy-MM-dd) */
  getDayIndicators?: (dateKey: string) => DayIndicator[];
  /** Return custom content inside a day cell */
  renderDayContent?: (day: Date, dateKey: string) => React.ReactNode;
  /** Disable past days */
  disablePast?: boolean;
  /** Disable days outside the current month */
  disableOutsideMonth?: boolean;
  /** Compact mode for widgets */
  compact?: boolean;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Additional className for the grid container */
  className?: string;
}

export function UnifiedMonthGrid({
  currentMonth,
  selectedDate,
  onSelectDate,
  getDayIndicators,
  renderDayContent,
  disablePast = false,
  disableOutsideMonth = true,
  compact = false,
  isLoading = false,
  className,
}: UnifiedMonthGridProps) {
  const todayStart = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const cellSize = compact ? 'h-10' : 'h-12';
  const fontSize = compact ? 'text-[12px]' : 'text-[13px]';
  const dotSize = compact ? 'w-[4px] h-[4px]' : 'w-[5px] h-[5px]';

  return (
    <div className={cn('', className)}>
      {/* Week headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={i}
            className={cn(
              'text-center font-semibold text-muted-foreground/50 uppercase tracking-wider',
              compact ? 'text-[10px] py-1' : 'text-[11px] py-1.5'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-[2px]">
        {isLoading
          ? Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className={cn(cellSize, 'rounded-xl animate-pulse flex items-center justify-center')}
              >
                <div className="h-3 w-3 rounded-full bg-secondary/30" />
              </div>
            ))
          : calendarDays.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isPast = isBefore(day, todayStart) && !today;
              const selected = selectedDate === dateKey;
              const disabled =
                (!inMonth && disableOutsideMonth) || (isPast && disablePast);
              const indicators = getDayIndicators?.(dateKey) || [];
              const hasContent = !!renderDayContent;

              return (
                <button
                  key={i}
                  onClick={() => !disabled && onSelectDate?.(selected ? '' : dateKey)}
                  disabled={disabled}
                  className={cn(
                    'relative flex flex-col items-center justify-center transition-all duration-200 rounded-xl',
                    hasContent ? 'min-h-[3.5rem] items-start justify-start p-1' : cellSize,
                    // States
                    disabled && 'opacity-20 pointer-events-none',
                    !disabled && inMonth && isPast && !disablePast && 'opacity-40',
                    !disabled && !selected && !today && 'hover:bg-secondary/30 active:scale-95',
                    today && !selected && 'bg-primary/8',
                    selected && 'bg-primary/12'
                  )}
                >
                  {/* Day number */}
                  <div
                    className={cn(
                      'flex items-center justify-center transition-all duration-200',
                      hasContent ? '' : 'mx-auto',
                      today && !selected && cn(
                        'w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold',
                        fontSize
                      ),
                      selected && !today && cn(
                        'w-7 h-7 rounded-full ring-2 ring-primary/50 bg-primary/15 text-primary font-bold',
                        fontSize
                      ),
                      selected && today && cn(
                        'w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold ring-2 ring-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.4)]',
                        fontSize
                      ),
                      !today && !selected && cn(
                        fontSize,
                        'font-medium text-foreground/80'
                      )
                    )}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Custom content or indicators */}
                  {renderDayContent ? (
                    renderDayContent(day, dateKey)
                  ) : indicators.length > 0 ? (
                    <div className="flex gap-[3px] mt-0.5">
                      {indicators.map((ind, j) => (
                        <div
                          key={j}
                          className={cn(dotSize, 'rounded-full', ind.className)}
                          style={ind.className ? undefined : { backgroundColor: ind.color }}
                        />
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
      </div>
    </div>
  );
}
