import { useState, useRef } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface TaskItemProps {
  task: ManagerTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
  onInlineUpdate?: (id: string, title: string, notes: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  key?: React.Key;
}

function formatDueDate(dateStr: string | null, timeStr: string | null): string | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date)) return timeStr ? `Hoje ${timeStr}` : 'Hoje';
  if (isTomorrow(date)) return timeStr ? `Amanhã ${timeStr}` : 'Amanhã';
  const formatted = format(date, "d MMM", { locale: ptBR });
  return timeStr ? `${formatted} ${timeStr}` : formatted;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
}

export function TaskItem({ task, onToggle, onDelete, onClick, onInlineUpdate, isDragging, dragHandleProps }: TaskItemProps) {
  const dueLabel = formatDueDate(task.due_date || null, task.due_time || null);
  const overdue = !task.is_completed && isOverdue(task.due_date || null);
  const clockUrgency = !task.is_completed && overdue
    ? { colorClass: 'text-destructive', pulse: true }
    : { colorClass: 'text-muted-foreground', pulse: false };
  const categoryColor = task.category?.color;

  const [completing, setCompleting] = useState(false);

  const handleToggle = () => {
    if (!task.is_completed) {
      setCompleting(true);
      try { navigator.vibrate?.(10); } catch { }
      setTimeout(() => { onToggle(task.id); setCompleting(false); }, 300);
    } else {
      onToggle(task.id);
    }
  };

  return (
    <div
      className={cn("relative rounded-xl", completing && "animate-task-complete")}
      {...dragHandleProps}
    >
      <div
        className={cn(
          'card-surface rounded-xl overflow-hidden transition-all duration-300',
          task.is_completed && 'opacity-45',
          isDragging && 'shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-primary/40 scale-[1.02]',
        )}
      >
        <div className="flex items-start gap-2.5 p-3">
          <Checkbox
            checked={task.is_completed}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-[18px] h-[18px] rounded-full border-2 mt-0.5 shrink-0 transition-all duration-300",
              "data-[state=checked]:bg-success data-[state=checked]:border-success",
              completing && "animate-check-pop"
            )}
          />

          <button
            className="flex-1 min-w-0 text-left"
            onClick={() => onClick?.()}
          >
            <div className="flex items-center gap-1.5">
              {categoryColor && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColor }} />
              )}
              <p className={cn(
                'font-medium text-[13px] leading-snug text-foreground flex-1',
                task.is_completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </p>
            </div>

            {task.notes && !task.is_completed && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                {task.notes}
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {dueLabel && (
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1.5 border tracking-wide uppercase',
                  overdue
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm'
                    : dueLabel.includes('Hoje')
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm'
                      : dueLabel.includes('Amanhã')
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm'
                        : 'bg-secondary/40 text-muted-foreground border-white/5'
                )}>
                  <AppIcon name="Clock" size={9} className={cn(clockUrgency.colorClass, clockUrgency.pulse && 'animate-pulse')} />
                  {dueLabel}
                </span>
              )}
            </div>
          </button>

          {/* Inline actions */}
          <div className="flex items-center shrink-0 mt-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              className="p-1 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/8 transition-colors"
            >
              <AppIcon name="Edit" size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-colors"
            >
              <AppIcon name="Trash2" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
