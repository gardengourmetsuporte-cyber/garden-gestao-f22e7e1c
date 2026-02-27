import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskItem } from '@/components/agenda/TaskItem';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import type { ManagerTask } from '@/types/agenda';

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
    isAddingTask,
    isUpdatingTask,
  } = useAgenda();

  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);

  const pendingTasks = useMemo(() =>
    (tasks || [])
      .filter(t => !t.is_completed)
      .sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      }),
    [tasks]
  );

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

  return (
    <>
      <div className="rounded-2xl bg-card overflow-hidden animate-slide-up stagger-3 relative">
        <div className="absolute -top-10 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none bg-primary" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <button onClick={() => navigate('/agenda')} className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/15">
              <AppIcon name="CalendarDays" size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Agenda</span>
              <span className="text-[10px] text-muted-foreground block">Tarefas pendentes</span>
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
            {pendingTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onClick={() => handleEditTask(task)}
                onInlineUpdate={handleInlineUpdate}
                onAddSubtask={handleAddSubtask}
                onUpdateSubtask={handleUpdateSubtask}
              />
            ))}
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