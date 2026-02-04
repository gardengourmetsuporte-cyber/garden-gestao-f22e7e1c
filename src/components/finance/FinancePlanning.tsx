import { MonthSelector } from './MonthSelector';
import { Target } from 'lucide-react';

interface FinancePlanningProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function FinancePlanning({ selectedMonth, onMonthChange }: FinancePlanningProps) {
  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="px-4 pt-4">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Coming Soon */}
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Planejamento Financeiro</h2>
        <p className="text-muted-foreground max-w-sm">
          Em breve você poderá definir metas e orçamentos por categoria para acompanhar seus gastos.
        </p>
      </div>
    </div>
  );
}
