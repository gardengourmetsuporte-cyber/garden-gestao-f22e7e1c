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

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  const cellHeight = compact ? 'min-h-[2.75rem]' : 'min-h-[3.5rem]';
  const fontSize = compact ? 'text-[10px]' : 'text-[11px]';
  const dotSize = compact ? 'w-[5px] h-[5px]' : 'w-[6px] h-[6px]';
  const headerFontSize = compact ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className={cn('rounded-2xl border border-border/40 bg-card overflow-hidden', className)}>
      {/* Week headers */}
      <div className="grid grid-cols-7 border-b border-border/20">
        {WEEK_DAYS.map(d => (
          <div
            key={d}
            className={cn(
              'text-center font-semibold text-muted-foreground/70 uppercase tracking-wider',
              headerFontSize,
              compact ? 'py-1.5' : 'py-2'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {isLoading
          ? Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  cellHeight,
                  'p-1.5 border-b border-r border-border/10 animate-pulse'
                )}
              >
                <div className="h-3 w-4 rounded bg-secondary/40 mb-1" />
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

              return (
                <button
                  key={i}
                  onClick={() => !disabled && onSelectDate?.(selected ? '' : dateKey)}
                  disabled={disabled}
                  className={cn(
                    'relative text-left transition-all duration-200',
                    cellHeight,
                    compact ? 'p-1' : 'p-1.5',
                    'border-b border-r border-border/10',
                    // States
                    disabled && 'opacity-20 pointer-events-none',
                    !disabled && inMonth && isPast && !disablePast && 'opacity-50',
                    !disabled && 'hover:bg-secondary/40',
                    today && 'bg-primary/5',
                    selected && 'bg-primary/10 ring-1 ring-primary/30'
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      fontSize,
                      'font-semibold leading-none block mb-0.5',
                      today && 'text-primary font-bold',
                      selected && !today && 'text-primary font-bold',
                      !today && !selected && 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Custom content or indicators */}
                  {renderDayContent ? (
                    renderDayContent(day, dateKey)
                  ) : indicators.length > 0 ? (
                    <div className="flex flex-wrap gap-[2px]">
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
