import * as React from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const handlePrev = () => onMonthChange(subMonths(selectedMonth, 1));
  const handleNext = () => onMonthChange(addMonths(selectedMonth, 1));

  return (
    <div className="flex items-center justify-center gap-1 py-1.5">
      <Button variant="ghost" size="icon" onClick={handlePrev} className="w-8 h-8 text-foreground hover:bg-muted">
        <AppIcon name="ChevronLeft" size={16} />
      </Button>

      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "text-sm font-semibold min-w-[150px] text-center capitalize gap-1.5 h-9 px-4 rounded-full",
              "bg-gradient-to-r from-[hsl(222_50%_10%)] via-[hsl(228_60%_18%)] to-[hsl(222_50%_10%)] text-white/90 hover:text-white",
              "dark:from-white dark:via-[hsl(220_50%_96%)] dark:to-white dark:text-[hsl(220_30%_20%)] dark:hover:text-[hsl(220_30%_10%)]"
            )}
          >
            <AppIcon name="Calendar" size={16} className="shrink-0" />
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center" avoidCollisions={false}>
          <Calendar
            mode="single"
            selected={selectedMonth}
            onSelect={(d) => {
              if (d) {
                onMonthChange(d);
                setOpen(false);
              }
            }}
            initialFocus
            className="p-3 pointer-events-auto"
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={handleNext} className="w-8 h-8 text-foreground hover:bg-muted">
        <AppIcon name="ChevronRight" size={16} />
      </Button>
    </div>
  );
}
