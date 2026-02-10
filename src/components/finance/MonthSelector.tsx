import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const handlePrev = () => onMonthChange(subMonths(selectedMonth, 1));
  const handleNext = () => onMonthChange(addMonths(selectedMonth, 1));

  return (
    <div className="flex items-center justify-center gap-1 py-1">
      <Button variant="ghost" size="icon" onClick={handlePrev} className="w-8 h-8 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold min-w-[130px] text-center capitalize text-foreground/80">
        {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <Button variant="ghost" size="icon" onClick={handleNext} className="w-8 h-8 text-muted-foreground hover:text-foreground">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}