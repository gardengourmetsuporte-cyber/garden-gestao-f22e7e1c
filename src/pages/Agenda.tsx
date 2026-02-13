import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Plus, CheckCircle2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';

import { AgendaCalendarView } from '@/components/agenda/AgendaCalendarView';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ManagerTask } from '@/types/agenda';

export default function Agenda() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const {
    tasks,
    categories,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addCategory,
    deleteCategory,
    reorderTasks,
    reorderCategories,
    isAddingTask,
    isUpdatingTask,
  } = useAgenda();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

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

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  // Group pending tasks by category
  const uncategorizedTasks = pendingTasks.filter(t => !t.category_id);
  const tasksByCategory = categories.map(cat => ({
    category: cat,
    tasks: pendingTasks.filter(t => t.category_id === cat.id),
  })).filter(g => g.tasks.length > 0);

  const toggleCategoryExpanded = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleReorderPendingTasks = (reorderedTasks: ManagerTask[]) => {
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sort_order: index
    }));
    reorderTasks(updates);
  };

  if (!isAdmin) return null;

  const renderTaskItem = (task: ManagerTask, sortable?: { isDragging: boolean; dragHandleProps: Record<string, unknown> }) => (
    <TaskItem
      key={task.id}
      task={task}
      onToggle={toggleTask}
      onDelete={deleteTask}
      onClick={() => handleEditTask(task)}
      onInlineUpdate={handleInlineUpdate}
      onAddSubtask={handleAddSubtask}
      onUpdateSubtask={handleUpdateSubtask}
      isDragging={sortable?.isDragging}
      dragHandleProps={sortable?.dragHandleProps}
    />
  );

  const ListContent = () => (
    <div className="space-y-3">
      {/* Pending section */}
      <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 card-command-info">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">Pendentes</span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {pendingTasks.length}
            </span>
          </div>
          {pendingOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : pendingTasks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">Nenhum lembrete pendente</p>
              <Button variant="link" className="mt-1 text-primary" onClick={() => setTaskSheetOpen(true)}>
                Criar novo
              </Button>
            </div>
          ) : (
            <>
              {/* Category sections */}
              {tasksByCategory.map(({ category, tasks: catTasks }) => {
                const isExpanded = expandedCategories[category.id] !== false; // default open
                return (
                  <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategoryExpanded(category.id)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                        <span className="font-semibold text-sm">{category.name}</span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {catTasks.length}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2 pl-2">
                      {catTasks.map(task => renderTaskItem(task))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {/* Uncategorized tasks */}
              {uncategorizedTasks.length > 0 && (
                <div className="space-y-2">
                  {tasksByCategory.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground px-1">Sem categoria</p>
                  )}
                  {uncategorizedTasks.map(task => renderTaskItem(task))}
                </div>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Completed Tasks */}
      <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 card-command-success">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <span className="font-semibold">Concluídos</span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
              {completedTasks.length}
            </span>
          </div>
          {completedOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-2">
          {completedTasks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">Nenhum lembrete concluído</p>
            </div>
          ) : (
            completedTasks.map(task => renderTaskItem(task))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const CalendarContent = () => (
    <AgendaCalendarView 
      tasks={tasks}
      onTaskClick={handleEditTask}
      onToggleTask={toggleTask}
    />
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="page-header-bar">
          <div className="page-header-content flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="page-header-icon bg-primary/10">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="page-title">Agenda</h1>
                <p className="page-subtitle">
                  {pendingTasks.length} pendente{pendingTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button 
              size="icon" 
              className="rounded-xl w-11 h-11 shadow-lg shadow-primary/20"
              onClick={() => setTaskSheetOpen(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="tab-command">
            <button
              onClick={() => setViewMode('list')}
              className={cn("tab-command-item", viewMode === 'list' ? "tab-command-active" : "tab-command-inactive")}
            >
              <ListChecks className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn("tab-command-item", viewMode === 'calendar' ? "tab-command-active" : "tab-command-inactive")}
            >
              <Calendar className="w-4 h-4" />
              Calendário
            </button>
          </div>

          {viewMode === 'list' ? <ListContent /> : <CalendarContent />}
        </div>
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
    </AppLayout>
  );
}
