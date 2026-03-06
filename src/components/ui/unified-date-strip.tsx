import { useRef, useEffect } from 'react';
import { format, isSameDay, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UnifiedDateStripProps {
  days: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  /** Optional trailing element after the date label */
  trailing?: React.ReactNode;
  /** Optional dot indicators per day */
  getDayIndicators?: (day: Date) => { color: string }[];
}

export function UnifiedDateStrip({
  days,
  selectedDate,
  onSelectDate,
  trailing,
  getDayIndicators,
}: UnifiedDateStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const selectedIdx = days.findIndex(d => isSameDay(d, selectedDate));
    if (selectedIdx < 0) return;
    const btnCenter = 16 + selectedIdx * 56 + 24;
    const scrollLeft = btnCenter - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  }, [selectedDate, days]);

  return (
    <div className="space-y-2">
      <div className="-mx-4 overflow-x-auto scrollbar-hide" ref={containerRef}>
        <div className="flex gap-1.5 px-4 py-1.5">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isDateToday(day);
            const indicators = getDayIndicators?.(day) || [];

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className="flex flex-col items-center gap-1 shrink-0 w-[48px] group"
              >
                {/* Day label */}
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide leading-none transition-colors",
                  isSelected
                    ? "text-primary"
                    : isDayToday
                      ? "text-primary/60"
                      : "text-muted-foreground/70"
                )}>
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>

                {/* Day number circle */}
                <div className={cn(
                  "w-[40px] h-[40px] rounded-[14px] flex items-center justify-center transition-all duration-300 relative",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.35)]"
                    : isDayToday
                      ? "bg-primary/10 ring-1 ring-primary/25"
                      : "bg-transparent group-hover:bg-secondary/60"
                )}>
                  <span className={cn(
                    "text-[15px] font-bold leading-none transition-colors",
                    isSelected
                      ? "text-primary-foreground"
                      : isDayToday
                        ? "text-primary"
                        : "text-foreground/80"
                  )}>
                    {format(day, 'dd')}
                  </span>
                </div>

                {/* Indicator dots */}
                <div className="h-[5px] flex items-center gap-[3px]">
                  {!isSelected && isDayToday && indicators.length === 0 && (
                    <div className="w-[5px] h-[5px] rounded-full bg-primary" />
                  )}
                  {indicators.slice(0, 3).map((ind, i) => (
                    <div
                      key={i}
                      className="w-[4px] h-[4px] rounded-full"
                      style={{ backgroundColor: ind.color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date label */}
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-center text-xs text-muted-foreground font-medium">
          {isDateToday(selectedDate) ? '📍 ' : ''}
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
        </p>
        {trailing}
      </div>
    </div>
  );
}
