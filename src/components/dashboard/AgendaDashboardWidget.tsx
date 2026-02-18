import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskItem } from '@/components/agenda/TaskItem';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ManagerTask } from '@/types/agenda';

function SortableTaskItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    willChange: 'transform',
    position: 'relative',
    ...(isDragging && {
      scale: '1.02',
      opacity: 0.95,
    }),
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function AgendaDashboardWidget() {
  const navigate = useNavigate();
  const {
    tasks,
    categories,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addCategory,
    reorderTasks,
    isAddingTask,
    isUpdatingTask,
  } = useAgenda();

  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [tempTasks, setTempTasks] = useState<ManagerTask[] | null>(null);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const displayTasks = useMemo(() => tempTasks || tasks, [tempTasks, tasks]);

  useEffect(() => {
    if (tempTasks && tasks) {
      const timer = setTimeout(() => setTempTasks(null), 600);
      return () => clearTimeout(timer);
    }
  }, [tasks, tempTasks]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const pendingTasks = (displayTasks || [])
    .filter(t => !t.is_completed && (!t.due_date || t.due_date <= todayStr || t.date === todayStr));

  const handleEditTask = (task: ManagerTask) => {
    setEditingTask(task);
    setTaskSheetOpen(true);
  };

  const handleInlineUpdate = (id: string, title: string, notes: string) => {
    updateTask({ id, title, notes: notes || undefined });
  };

  const handleAddSubtask = (parentId: string, title: string) => {
    addTask({ title, parent_id: parentId });
  };

  const handleUpdateSubtask = (id: string, title: string) => {
    updateTask({ id, title });
  };

  const handleCloseSheet = (open: boolean) => {
    setTaskSheetOpen(open);
    if (!open) setEditingTask(null);
  };

  const handleDragStart = (_event: DragStartEvent) => {
    try { navigator.vibrate?.(10); } catch {}
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pendingTasks.findIndex(t => t.id === active.id);
    const newIndex = pendingTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(pendingTasks, oldIndex, newIndex);

    // Optimistic local state
    setTempTasks(prev => {
      const base = prev || tasks;
      const taskIds = new Set(reordered.map(t => t.id));
      const orderMap = new Map(reordered.map((t, i) => [t.id, i]));
      return base.map(t => taskIds.has(t.id) ? { ...t, sort_order: orderMap.get(t.id)! } : t)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    });

    reorderTasks(reordered.map((t, i) => ({ id: t.id, sort_order: i })));
  };

  return (
    <>
      <div className="col-span-2 rounded-2xl border border-border bg-card overflow-hidden animate-slide-up stagger-3 relative">
        <div className="absolute -top-10 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none bg-primary" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <button onClick={() => navigate('/agenda')} className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/15 border border-primary/25">
              <AppIcon name="CalendarDays" size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Agenda</span>
              <span className="text-[10px] text-muted-foreground block">Tarefas de hoje</span>
            </div>
          </button>
          <div className="flex items-center gap-1.5">
            {!isLoading && pendingTasks.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {pendingTasks.length}
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 rounded-xl"
              onClick={() => { setEditingTask(null); setTaskSheetOpen(true); }}
            >
              <AppIcon name="Plus" size={16} />
            </Button>
            <button onClick={() => navigate('/agenda')}>
              <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-1 px-3 pb-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
          </div>
        ) : pendingTasks.length > 0 ? (
          <div className="px-3 pb-3 max-h-[260px] overflow-y-auto space-y-1 scrollbar-thin">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={pendingTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {pendingTasks.map(task => (
                  <SortableTaskItem key={task.id} id={task.id}>
                    <TaskItem
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onClick={() => handleEditTask(task)}
                      onInlineUpdate={handleInlineUpdate}
                      onAddSubtask={handleAddSubtask}
                      onUpdateSubtask={handleUpdateSubtask}
                    />
                  </SortableTaskItem>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="text-center px-4 pb-5">
            <div className="w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'hsl(142 60% 45% / 0.12)' }}>
              <AppIcon name="Check" size={20} style={{ color: 'hsl(142 60% 50%)' }} />
            </div>
            <p className="text-xs text-muted-foreground">Tudo em dia! 🎉</p>
          </div>
        )}
      </div>

      <TaskSheet
        open={taskSheetOpen}
        onOpenChange={handleCloseSheet}
        onSubmit={addTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
        isSubmitting={isAddingTask || isUpdatingTask}
        editingTask={editingTask}
        categories={categories}
        onAddCategory={addCategory}
      />
    </>
  );
}
