import { useState, useRef } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Info, Trash2 } from 'lucide-react';
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

export function TaskItem({ task, onToggle, onDelete, onClick, onInlineUpdate, isDragging, dragHandleProps }: TaskItemProps) {
  const dueLabel = formatDueDate(task.due_date || null, task.due_time || null);
  const overdue = !task.is_completed && isOverdue(task.due_date || null);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const SWIPE_THRESHOLD = -70;
  const MAX_SWIPE = -160;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isEditing) return;
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

  const handleTitleClick = () => {
    if (isDragging || task.is_completed) return;
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setIsEditing(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
    const newTitle = editTitle.trim();
    if (!newTitle) {
      setEditTitle(task.title);
      setEditNotes(task.notes || '');
      return;
    }
    if (newTitle !== task.title || editNotes.trim() !== (task.notes || '').trim()) {
      onInlineUpdate?.(task.id, newTitle, editNotes.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFinishEditing();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(task.title);
      setEditNotes(task.notes || '');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" {...dragHandleProps}>
      {/* Swipe background actions */}
      <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
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
          'relative z-10 flex items-start gap-3 p-4 transition-transform bg-card border border-border shadow-sm',
          task.is_completed && 'opacity-60 bg-muted',
          isDragging && 'shadow-lg ring-2 ring-primary/50',
          !isSwiping && 'transition-transform duration-200',
        )}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={() => onToggle(task.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-6 h-6 rounded-full border-2 mt-0.5 shrink-0 data-[state=checked]:bg-success data-[state=checked]:border-success"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-1" onBlur={handleFinishEditing}>
              <textarea
                ref={titleRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="w-full bg-transparent font-semibold text-foreground resize-none outline-none border-b border-primary/40 pb-1 text-base"
                style={{ minHeight: '1.5em' }}
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Notas..."
                rows={2}
                className="w-full bg-transparent text-sm text-muted-foreground resize-none outline-none placeholder:text-muted-foreground/50"
                style={{ minHeight: '2em' }}
              />
            </div>
          ) : (
            <button onClick={handleTitleClick} className="w-full text-left">
              <p className={cn(
                'font-medium text-foreground',
                task.is_completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </p>

              {/* Notes displayed below title */}
              {task.notes && (
                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
                  {task.notes}
                </p>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-1">
            {dueLabel && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                overdue ? 'text-destructive' : 'text-muted-foreground'
              )}>
                <CalendarDays className="w-3 h-3" />
                {dueLabel}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color }} />
                <span className="text-xs text-muted-foreground">{task.category.name}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
