import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface AgendaCalendarViewProps {
  tasks: ManagerTask[];
  onTaskClick: (task: ManagerTask) => void;
  onToggleTask?: (id: string) => void;
}

export function AgendaCalendarView({ tasks, onTaskClick, onToggleTask }: AgendaCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ManagerTask[]>();
    tasks.forEach(task => {
      if (task.due_date) {
        const key = task.due_date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Get the first day of the month to calculate padding
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];
          const pendingTasks = dayTasks.filter(t => !t.is_completed);
          const hasCompleted = dayTasks.some(t => t.is_completed);

          return (
            <button
              key={day.toISOString()}
              className={cn(
                'aspect-square flex flex-col items-center justify-start p-1 rounded-xl transition-all',
                'hover:bg-secondary/50',
                isToday(day) && 'bg-primary/10 ring-1 ring-primary/30',
                !isSameMonth(day, currentMonth) && 'opacity-40'
              )}
              onClick={() => {
                setSelectedDate(dateKey);
              }}
            >
              <span className={cn(
                'text-sm font-medium',
                isToday(day) && 'text-primary font-bold'
              )}>
                {format(day, 'd')}
              </span>
              
              {/* Task indicators */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                  {pendingTasks.slice(0, 3).map((task, i) => (
                    <div
                      key={task.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: task.category?.color || 'hsl(var(--primary))' }}
                    />
                  ))}
                  {hasCompleted && pendingTasks.length < 3 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

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
              <X className="w-4 h-4" />
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
                    'p-3 rounded-xl bg-card border border-border transition-all',
                    'hover:border-primary/30 hover:shadow-sm',
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

      {/* Tasks without dates */}
      {tasks.filter(t => !t.due_date && !t.is_completed).length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">Sem data definida</p>
          <div className="space-y-1.5">
            {tasks.filter(t => !t.due_date && !t.is_completed).map(task => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full text-left p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  {task.category && (
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: task.category.color }}
                    />
                  )}
                  <span className="text-sm font-medium truncate">{task.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}