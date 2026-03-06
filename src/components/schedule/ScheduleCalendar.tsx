import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkSchedule } from '@/types/database';
import { cn } from '@/lib/utils';
import { UnifiedMonthGrid, DayIndicator } from '@/components/ui/unified-month-grid';
import { UnifiedMonthNav } from '@/components/ui/unified-month-nav';

interface ScheduleCalendarProps {
  schedules: WorkSchedule[];
  currentUserId?: string;
  onDayClick?: (day: number, month: number, year: number) => void;
  selectedDay?: number;
}

export function ScheduleCalendar({ 
  schedules, 
  currentUserId,
  onDayClick, 
  selectedDay 
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const selectedDateKey = selectedDay
    ? `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;

  const getScheduleForDay = (day: number): WorkSchedule | undefined => {
    return schedules.find(s => s.day_off === day && s.month === month && s.year === year);
  };

  const getDayIndicators = (dateKey: string): DayIndicator[] => {
    const dayNum = parseInt(dateKey.split('-')[2], 10);
    const dateMonth = parseInt(dateKey.split('-')[1], 10);
    const dateYear = parseInt(dateKey.split('-')[0], 10);
    if (dateMonth !== month || dateYear !== year) return [];

    const schedule = schedules.find(
      s => s.day_off === dayNum && s.month === month && s.year === year
    );
    if (!schedule) return [];

    const color = schedule.status === 'approved'
      ? '#22c55e'
      : schedule.status === 'pending'
        ? '#f59e0b'
        : '#ef4444';

    return [{ color }];
  };

  const handleSelectDate = (dateKey: string) => {
    if (!dateKey) return;
    const parts = dateKey.split('-');
    const day = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[0], 10);
    onDayClick?.(day, m, y);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <UnifiedMonthNav
        currentMonth={currentDate}
        onMonthChange={setCurrentDate}
      />

      {/* Calendar Grid */}
      <UnifiedMonthGrid
        currentMonth={currentDate}
        selectedDate={selectedDateKey}
        onSelectDate={handleSelectDate}
        getDayIndicators={getDayIndicators}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Aprovado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Recusado</span>
        </div>
      </div>
    </div>
  );
}
