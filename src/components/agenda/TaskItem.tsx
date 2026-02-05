import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface TaskItemProps {
  task: ManagerTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'border-primary',
  medium: 'border-warning',
  high: 'border-destructive',
};

function formatDueDate(dateStr: string | null, timeStr: string | null): string | null {
  if (!dateStr) return null;
  
  const date = parseISO(dateStr);
  
  if (isToday(date)) {
    return timeStr ? `Hoje às ${timeStr}` : 'Hoje';
  }
  if (isTomorrow(date)) {
    return timeStr ? `Amanhã às ${timeStr}` : 'Amanhã';
  }
  
  const formatted = format(date, "d 'de' MMM", { locale: ptBR });
  return timeStr ? `${formatted} às ${timeStr}` : formatted;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const dueLabel = formatDueDate(task.due_date || null, task.due_time || null);
  const overdue = !task.is_completed && isOverdue(task.due_date || null);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all group',
        'bg-card border shadow-sm hover:shadow-md',
        task.is_completed && 'opacity-60 bg-muted'
      )}
    >
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={() => onToggle(task.id)}
        className={cn(
          'w-6 h-6 rounded-full border-2',
          priorityColors[task.priority]
        )}
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground truncate',
          task.is_completed && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        
        {dueLabel && (
          <p className={cn(
            'text-xs mt-0.5 flex items-center gap-1',
            overdue ? 'text-destructive' : 'text-muted-foreground'
          )}>
            <CalendarDays className="w-3 h-3" />
            {dueLabel}
          </p>
        )}

        {task.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {task.notes}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(task.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}