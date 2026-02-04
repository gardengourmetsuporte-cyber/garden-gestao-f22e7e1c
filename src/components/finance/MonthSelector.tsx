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
    <div className="flex items-center justify-center gap-2 py-3">
      <Button variant="ghost" size="icon" onClick={handlePrev}>
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <span className="text-lg font-semibold min-w-[140px] text-center capitalize">
        {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <Button variant="ghost" size="icon" onClick={handleNext}>
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
