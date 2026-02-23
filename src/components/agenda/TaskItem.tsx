import { useState, useRef } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Info, Trash2, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';
import { getTaskUrgencyColor } from '@/hooks/useTimeBasedUrgency';

interface TaskItemProps {
  task: ManagerTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
  onInlineUpdate?: (id: string, title: string, notes: string) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onUpdateSubtask?: (id: string, title: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

function formatDueDate(dateStr: string | null, timeStr: string | null): string | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date)) return timeStr ? `Hoje às ${timeStr}` : 'Hoje';
  if (isTomorrow(date)) return timeStr ? `Amanhã às ${timeStr}` : 'Amanhã';
  const formatted = format(date, "d 'de' MMM", { locale: ptBR });
  return timeStr ? `${formatted} às ${timeStr}` : formatted;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
}

export function TaskItem({ task, onToggle, onDelete, onClick, onInlineUpdate, onAddSubtask, onUpdateSubtask, isDragging, dragHandleProps }: TaskItemProps) {
  const dueLabel = formatDueDate(task.due_date || null, task.due_time || null);
  const overdue = !task.is_completed && isOverdue(task.due_date || null);
  const clockUrgency = !task.is_completed
    ? getTaskUrgencyColor(task.due_date || null, task.due_time || null)
    : { colorClass: 'text-muted-foreground', pulse: false };
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const categoryColor = task.category?.color;

  // Expand state
  const [expanded, setExpanded] = useState(false);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Inline add subtask
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Inline edit subtask
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubTitle, setEditingSubTitle] = useState('');
  const editSubRef = useRef<HTMLInputElement>(null);

  // Completion animation
  const [completing, setCompleting] = useState(false);

  const SWIPE_THRESHOLD = -70;
  const MAX_SWIPE = -240;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalSwipe.current) return;

    const newX = Math.max(MAX_SWIPE, Math.min(0, dx + (swipeX < SWIPE_THRESHOLD ? SWIPE_THRESHOLD : 0)));
    setSwipeX(newX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    isHorizontalSwipe.current = null;
    if (swipeX < SWIPE_THRESHOLD) {
      setSwipeX(MAX_SWIPE);
    } else {
      setSwipeX(0);
    }
  };

  const closeSwipe = () => setSwipeX(0);

  const handleToggle = () => {
    if (!task.is_completed) {
      // Animate completion
      setCompleting(true);
      try { navigator.vibrate?.(10); } catch {}
      setTimeout(() => {
        onToggle(task.id);
        setCompleting(false);
      }, 300);
    } else {
      onToggle(task.id);
    }
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title || !onAddSubtask) return;
    onAddSubtask(task.id, title);
    setNewSubtaskTitle('');
    subtaskInputRef.current?.focus();
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
    if (e.key === 'Escape') {
      setAddingSubtask(false);
      setNewSubtaskTitle('');
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        completing && "animate-task-complete"
      )}
      style={{ willChange: 'transform' }}
      {...dragHandleProps}
    >
      {/* Swipe background actions */}
      <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
        <button
          onClick={(e) => { e.stopPropagation(); closeSwipe(); setExpanded(true); setAddingSubtask(true); setTimeout(() => subtaskInputRef.current?.focus(), 100); }}
          className="w-20 flex items-center justify-center bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); closeSwipe(); onClick?.(); }}
          className="w-20 flex items-center justify-center bg-muted-foreground/60 text-white text-xs font-semibold"
        >
          <Info className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); closeSwipe(); onDelete(task.id); }}
          className="w-20 flex items-center justify-center bg-destructive text-white text-xs font-semibold"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main content - slides */}
      <div
        className={cn(
          'relative z-10 bg-card border shadow-sm overflow-hidden',
          task.is_completed && 'opacity-50',
          isDragging && 'shadow-xl ring-2 ring-primary/40 scale-[1.03]',
          !isSwiping && 'transition-transform duration-200',
          categoryColor ? 'border-border/50' : 'border-border',
        )}
        style={{
          transform: `translateX(${swipeX}px)`,
          borderLeftWidth: categoryColor ? '3px' : undefined,
          borderLeftColor: categoryColor || undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Parent task row */}
        <div className="flex items-start gap-3 p-4">
          <Checkbox
            checked={task.is_completed}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-6 h-6 rounded-full border-2 mt-0.5 shrink-0 transition-all duration-300",
              "data-[state=checked]:bg-success data-[state=checked]:border-success",
              completing && "animate-check-pop"
            )}
          />

          <button 
            className="flex-1 min-w-0 text-left"
            onClick={() => {
              if (hasSubtasks) {
                setExpanded(!expanded);
              } else {
                onClick?.();
              }
            }}
          >
            <div className="flex items-center gap-2">
              <p className={cn(
                'font-medium text-foreground flex-1',
                task.is_completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </p>
              {hasSubtasks && (
                <ChevronRight className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                  expanded && 'rotate-90'
                )} />
              )}
            </div>

            {/* Notes preview */}
            {task.notes && !task.is_completed && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {task.notes}
              </p>
            )}

            {/* Subtask counter badge */}
            {hasSubtasks && !expanded && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedSubtasks}/{subtasks.length} subtarefa{subtasks.length !== 1 ? 's' : ''}
              </p>
            )}
          </button>

          <div className="flex items-center gap-2 flex-wrap mt-1 shrink-0">
            {dueLabel && (
              <span className={cn(
                'text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1',
                overdue
                  ? 'bg-destructive/10 text-destructive'
                  : dueLabel.includes('Hoje')
                    ? 'bg-warning/10 text-warning'
                    : dueLabel.includes('Amanhã')
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
              )}>
                <CalendarDays className={cn(
                  'w-3 h-3',
                  clockUrgency.colorClass,
                  clockUrgency.pulse && 'animate-pulse'
                )} />
                {dueLabel}
              </span>
            )}
          </div>
        </div>

        {/* Expanded subtasks */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-border/50">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/30 last:border-b-0">
                <div className="w-4" />
                <Checkbox
                  checked={sub.is_completed}
                  onCheckedChange={() => onToggle(sub.id)}
                  className="w-5 h-5 rounded-full border-2 shrink-0 data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                {editingSubId === sub.id ? (
                  <input
                    ref={editSubRef}
                    value={editingSubTitle}
                    onChange={(e) => setEditingSubTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const t = editingSubTitle.trim();
                        if (t && t !== sub.title) onUpdateSubtask?.(sub.id, t);
                        setEditingSubId(null);
                      }
                      if (e.key === 'Escape') setEditingSubId(null);
                    }}
                    onBlur={() => {
                      const t = editingSubTitle.trim();
                      if (t && t !== sub.title) onUpdateSubtask?.(sub.id, t);
                      setEditingSubId(null);
                    }}
                    className="flex-1 text-sm bg-transparent border-none outline-none caret-primary"
                    autoFocus
                  />
                ) : (
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      if (sub.is_completed) return;
                      setEditingSubId(sub.id);
                      setEditingSubTitle(sub.title);
                      setTimeout(() => editSubRef.current?.focus(), 50);
                    }}
                  >
                    <span className={cn(
                      'text-sm',
                      sub.is_completed && 'line-through text-muted-foreground'
                    )}>
                      {sub.title}
                    </span>
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(sub.id); }}
                  className="p-1 rounded-lg text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add subtask inline */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-4" />
              <Plus className="w-4 h-4 text-primary shrink-0" />
              <input
                ref={subtaskInputRef}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                onFocus={() => setAddingSubtask(true)}
                onBlur={() => {
                  if (newSubtaskTitle.trim()) handleAddSubtask();
                  setAddingSubtask(false);
                }}
                placeholder="Nova subtarefa..."
                className="flex-1 text-sm bg-transparent border-none outline-none caret-primary placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
