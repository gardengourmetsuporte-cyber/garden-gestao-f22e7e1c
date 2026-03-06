import { useState, useMemo } from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { UnifiedMonthGrid } from '@/components/ui/unified-month-grid';
import { UnifiedMonthNav } from '@/components/ui/unified-month-nav';
import type { ManagerTask } from '@/types/agenda';

interface AgendaCalendarViewProps {
  tasks: ManagerTask[];
  onTaskClick: (task: ManagerTask) => void;
  onToggleTask?: (id: string) => void;
}

export function AgendaCalendarView({ tasks, onTaskClick, onToggleTask }: AgendaCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group tasks by date — only pending tasks
  const tasksByDate = useMemo(() => {
    const today = startOfDay(new Date());
    const map = new Map<string, ManagerTask[]>();
    tasks.forEach(task => {
      if (!task.due_date) return;
      if (task.is_completed) return;
      const key = task.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const getDayIndicators = (dateKey: string) => {
    const dayTasks = tasksByDate.get(dateKey) || [];
    if (dayTasks.length === 0) return [];
    const taskDate = new Date(dateKey + 'T12:00:00');
    const today = startOfDay(new Date());
    const isOverdue = isBefore(taskDate, today) && !isToday(taskDate);
    return dayTasks.slice(0, 3).map((task) => ({
      color: isOverdue ? 'hsl(348, 83%, 65%)' : (task.category?.color || 'hsl(var(--primary))'),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <UnifiedMonthNav
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      {/* Calendar Grid */}
      <UnifiedMonthGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={(key) => setSelectedDate(key || null)}
        getDayIndicators={getDayIndicators}
      />

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-lg"
              onClick={() => setSelectedDate(null)}
            >
              <AppIcon name="X" size={16} />
            </Button>
          </div>

          {(tasksByDate.get(selectedDate) || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa neste dia
            </p>
          ) : (
            <div className="space-y-2">
              {(tasksByDate.get(selectedDate) || []).map(task => (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 rounded-xl card-surface hover:shadow-card-hover border-white/5 transition-all',
                    task.is_completed && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {onToggleTask && (
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => onToggleTask(task.id)}
                        className="w-5 h-5 mt-0.5 rounded-full border-2 data-[state=checked]:bg-success data-[state=checked]:border-success"
                      />
                    )}
                    <button
                      onClick={() => onTaskClick(task)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        {task.category && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.category.color }}
                          />
                        )}
                        <span className={cn(
                          'text-sm font-medium truncate',
                          task.is_completed && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </span>
                      </div>
                      {task.due_time && (
                        <span className="text-xs text-muted-foreground">
                          às {task.due_time}
                        </span>
                      )}
                      {task.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {task.notes}
                        </p>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
