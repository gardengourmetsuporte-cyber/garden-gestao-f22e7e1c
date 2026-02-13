import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Plus, CheckCircle2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { SortableList, DragHandle } from '@/components/ui/sortable-list';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';
import { CategoryChips } from '@/components/agenda/CategoryChips';
import { AgendaCalendarView } from '@/components/agenda/AgendaCalendarView';
import { SwipeableTabs } from '@/components/ui/swipeable-tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ManagerTask } from '@/types/agenda';

export default function Agenda() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');

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

  const handleCloseSheet = (open: boolean) => {
    setTaskSheetOpen(open);
    if (!open) setEditingTask(null);
  };

  const filteredTasks = selectedCategoryId
    ? tasks.filter(t => t.category_id === selectedCategoryId)
    : tasks;

  const pendingTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  const handleReorderPendingTasks = (reorderedTasks: ManagerTask[]) => {
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sort_order: index
    }));
    reorderTasks(updates);
  };

  if (!isAdmin) return null;

  const ListContent = () => (
    <div className="space-y-4">
      {/* Categories */}
      <CategoryChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onDeleteCategory={deleteCategory}
        onReorderCategories={reorderCategories}
      />

      {/* Pending Tasks */}
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
        <CollapsibleContent className="mt-3 space-y-2">
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
            <SortableList
              items={pendingTasks}
              getItemId={(t) => t.id}
              onReorder={handleReorderPendingTasks}
              className="space-y-2"
              renderItem={(task, { isDragging, dragHandleProps }) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onClick={() => handleEditTask(task)}
                  onInlineUpdate={handleInlineUpdate}
                  isDragging={isDragging}
                  dragHandleProps={dragHandleProps}
                />
              )}
            />
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
            completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onClick={() => handleEditTask(task)}
                onInlineUpdate={handleInlineUpdate}
              />
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const CalendarContent = () => (
    <AgendaCalendarView 
      tasks={filteredTasks}
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

        <div className="px-4 py-4">
          <SwipeableTabs
            tabs={[
              {
                key: 'list',
                label: 'Lista',
                icon: <ListChecks className="w-4 h-4" />,
                content: <ListContent />,
              },
              {
                key: 'calendar',
                label: 'Calendário',
                icon: <Calendar className="w-4 h-4" />,
                content: <CalendarContent />,
              },
            ]}
            activeTab={viewMode}
            onTabChange={setViewMode}
          />
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
