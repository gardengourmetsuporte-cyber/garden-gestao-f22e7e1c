import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { DndContext, DragOverlay, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import type { ManagerTask } from '@/types/agenda';

interface TimeBlocksViewProps {
  tasks: ManagerTask[];
  onToggleTask: (id: string) => void;
  onTaskClick: (task: ManagerTask) => void;
}

// ── localStorage helpers ──
const getStorageKey = (date: Date) => `timeblocks-${format(date, 'yyyy-MM-dd')}`;

function loadAllocations(date: Date): Record<number, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(date));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAllocations(date: Date, allocs: Record<number, string>) {
  try { localStorage.setItem(getStorageKey(date), JSON.stringify(allocs)); } catch {}
}

// ── Droppable time slot ──
function TimeSlot({ hour, task, isNow, onRemove, onTapEmpty }: {
  hour: number;
  task: ManagerTask | null;
  isNow: boolean;
  onRemove: (hour: number) => void;
  onTapEmpty: (hour: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}` });
  const endHour = (hour + 1) % 24;
  const label = `${String(hour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:00`;
  const isNight = hour < 6 || hour >= 22;
  const isMorning = hour >= 6 && hour < 12;

  return (
    <div
      ref={setNodeRef}
      id={`block-${hour}`}
      onClick={() => !task && onTapEmpty(hour)}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none min-h-[60px]",
        // base
        "bg-card/40 backdrop-blur-sm border-border/50",
        // hover
        !task && "hover:border-[hsl(var(--neon-cyan)/0.4)] hover:bg-card/60",
        // drop target
        isOver && "border-[hsl(var(--neon-cyan))] bg-[hsl(var(--neon-cyan)/0.08)] scale-[1.02]",
        // now indicator
        isNow && "ring-2 ring-[hsl(var(--neon-cyan)/0.6)] border-[hsl(var(--neon-cyan)/0.5)] bg-card/70",
        // filled
        task && "border-[hsl(var(--neon-green)/0.3)] bg-[hsl(var(--neon-green)/0.06)]"
      )}
    >
      {/* Now pulse */}
      {isNow && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[hsl(var(--neon-cyan))] animate-pulse shadow-[0_0_8px_hsl(var(--neon-cyan))]" />
      )}

      {/* Time label */}
      <div className="shrink-0 w-[110px]">
        <span className={cn(
          "font-mono text-xs tracking-wider",
          isNow ? "text-[hsl(var(--neon-cyan))] font-bold" : "text-muted-foreground"
        )}>
          {label}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          {isNight && <AppIcon name="Moon" size={10} className="text-muted-foreground/50" />}
          {isMorning && <AppIcon name="Sun" size={10} className="text-[hsl(var(--neon-amber)/0.6)]" />}
          {!isNight && !isMorning && <AppIcon name="Sunset" size={10} className="text-[hsl(var(--neon-amber)/0.4)]" />}
        </div>
      </div>

      {/* Task content or empty */}
      {task ? (
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {task.category?.color && (
              <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_var(--cat-color)]"
                style={{ backgroundColor: task.category.color, '--cat-color': task.category.color } as React.CSSProperties} />
            )}
            <span className={cn("text-sm font-medium truncate", task.is_completed && "line-through text-muted-foreground")}>
              {task.title}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(hour); }}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
          >
            <AppIcon name="X" size={14} />
          </button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/40 italic">toque para alocar</span>
      )}
    </div>
  );
}

// ── Draggable task chip ──
function DraggableTask({ task }: { task: ManagerTask }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `task-${task.id}` });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm",
        "cursor-grab active:cursor-grabbing transition-all touch-none select-none",
        "hover:border-[hsl(var(--neon-cyan)/0.3)] hover:bg-card/80",
        isDragging && "opacity-40 scale-95"
      )}
    >
      {task.category?.color && (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.category.color }} />
      )}
      <span className="text-sm font-medium truncate">{task.title}</span>
      <AppIcon name="GripVertical" size={14} className="ml-auto shrink-0 text-muted-foreground/40" />
    </div>
  );
}

// ── Task picker sheet (mobile alternative to drag) ──
function TaskPicker({ tasks, onSelect, onClose }: {
  tasks: ManagerTask[];
  onSelect: (taskId: string) => void;
  onClose: () => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-t-3xl p-5 pb-8 max-h-[60vh] overflow-y-auto animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <p className="text-sm font-semibold text-foreground mb-3">Selecionar tarefa</p>
        <div className="space-y-2">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => onSelect(task.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card/60 border border-border/60 hover:border-primary/30 transition-all text-left"
            >
              {task.category?.color && (
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: task.category.color }} />
              )}
              <span className="text-sm font-medium truncate">{task.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
export function TimeBlocksView({ tasks, onToggleTask, onTaskClick }: TimeBlocksViewProps) {
  const today = useMemo(() => new Date(), []);
  const [allocations, setAllocations] = useState<Record<number, string>>(() => loadAllocations(today));
  const [pickerHour, setPickerHour] = useState<number | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentHour = new Date().getHours();

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  // Save allocations on change
  useEffect(() => { saveAllocations(today, allocations); }, [allocations, today]);

  // Auto-scroll to current hour (once on mount)
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    const el = document.getElementById(`block-${currentHour}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allocated task IDs
  const allocatedIds = useMemo(() => new Set(Object.values(allocations)), [allocations]);

  // Available tasks = pending + not yet allocated
  const availableTasks = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return tasks
      .filter(t => !t.is_completed && !allocatedIds.has(t.id))
      .filter(t => !t.due_date || t.due_date === todayStr);
  }, [tasks, allocatedIds, today]);

  // Task map for quick lookup
  const taskMap = useMemo(() => {
    const m = new Map<string, ManagerTask>();
    tasks.forEach(t => m.set(t.id, t));
    return m;
  }, [tasks]);

  const allocateTask = useCallback((hour: number, taskId: string) => {
    setAllocations(prev => ({ ...prev, [hour]: taskId }));
    try { navigator.vibrate?.(15); } catch {}
  }, []);

  const removeAllocation = useCallback((hour: number) => {
    setAllocations(prev => {
      const next = { ...prev };
      delete next[hour];
      return next;
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id).replace('task-', '');
    setDraggingTaskId(id);
    try { navigator.vibrate?.(10); } catch {}
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTaskId(null);
    const { active, over } = event;
    if (!over) return;
    const slotId = String(over.id);
    if (!slotId.startsWith('slot-')) return;
    const hour = parseInt(slotId.replace('slot-', ''), 10);
    const taskId = String(active.id).replace('task-', '');
    allocateTask(hour, taskId);
  };

  const handleTapEmpty = (hour: number) => {
    if (availableTasks.length > 0) setPickerHour(hour);
  };

  const handlePickerSelect = (taskId: string) => {
    if (pickerHour !== null) {
      allocateTask(pickerHour, taskId);
      setPickerHour(null);
    }
  };

  const draggingTask = draggingTaskId ? taskMap.get(draggingTaskId) : null;
  const filledCount = Object.keys(allocations).length;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="relative">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(var(--neon-cyan)/0.1)] border border-[hsl(var(--neon-cyan)/0.2)]">
              <AppIcon name="LayoutGrid" size={14} className="text-[hsl(var(--neon-cyan))]" />
              <span className="text-xs font-bold text-[hsl(var(--neon-cyan))]">{filledCount}/24</span>
            </span>
            <span className="text-xs text-muted-foreground">blocos preenchidos</span>
          </div>
          {filledCount > 0 && (
            <button
              onClick={() => setAllocations({})}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
            >
              Limpar dia
            </button>
          )}
        </div>

        {/* Timeline - 24 blocks bottom to top */}
        <div ref={scrollRef} className="flex flex-col-reverse gap-2">
          {Array.from({ length: 24 }, (_, i) => {
            const taskId = allocations[i];
            const task = taskId ? taskMap.get(taskId) ?? null : null;
            return (
              <TimeSlot
                key={i}
                hour={i}
                task={task}
                isNow={currentHour === i}
                onRemove={removeAllocation}
                onTapEmpty={handleTapEmpty}
              />
            );
          })}
        </div>

        {/* Floating drawer toggle */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={cn(
            "fixed z-[9997] left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all",
            "bg-card/90 backdrop-blur-md border-border shadow-lg",
            drawerOpen && "border-[hsl(var(--neon-cyan)/0.3)]"
          )}
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 94px)' }}
        >
          <AppIcon name={drawerOpen ? "ChevronDown" : "ChevronUp"} size={16} className="text-muted-foreground" />
          <span className="text-xs font-semibold">Tarefas ({availableTasks.length})</span>
        </button>

        {/* Task drawer */}
        {drawerOpen && availableTasks.length > 0 && (
          <div className="fixed inset-x-0 z-[9996] px-4 pb-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 130px)' }}>
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-2xl max-h-[200px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-1.5">
                {availableTasks.map(task => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {draggingTask && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-[hsl(var(--neon-cyan))] bg-card shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)] scale-105">
              {draggingTask.category?.color && (
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: draggingTask.category.color }} />
              )}
              <span className="text-sm font-bold">{draggingTask.title}</span>
            </div>
          )}
        </DragOverlay>

        {/* Tap-to-pick modal */}
        {pickerHour !== null && (
          <TaskPicker
            tasks={availableTasks}
            onSelect={handlePickerSelect}
            onClose={() => setPickerHour(null)}
          />
        )}
      </div>
    </DndContext>
  );
}
