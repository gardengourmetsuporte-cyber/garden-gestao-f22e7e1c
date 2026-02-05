import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Plus, CheckCircle2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';
import { CategoryChips } from '@/components/agenda/CategoryChips';
import { AgendaCalendarView } from '@/components/agenda/AgendaCalendarView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

type ViewMode = 'list' | 'calendar';

function SortableTaskItem({ 
  task, 
  onToggle, 
  onDelete, 
  onClick 
}: { 
  task: ManagerTask; 
  onToggle: (id: string) => void; 
  onDelete: (id: string) => void; 
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        onToggle={onToggle}
        onDelete={onDelete}
        onClick={onClick}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function Agenda() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
    isAddingTask,
    isUpdatingTask,
  } = useAgenda();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleEditTask = (task: ManagerTask) => {
    setEditingTask(task);
    setTaskSheetOpen(true);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = pendingTasks.findIndex(t => t.id === active.id);
      const newIndex = pendingTasks.findIndex(t => t.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(pendingTasks, oldIndex, newIndex);
        
        // Create update array with new sort_order values
        const updates = reorderedTasks.map((task, index) => ({
          id: task.id,
          sort_order: index
        }));
        
        // Persist to database
        reorderTasks(updates);
      }
    }
  };

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                {pendingTasks.length} pendente{pendingTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-secondary p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ListChecks className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  viewMode === 'calendar'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendário</span>
              </button>
            </div>

            <Button 
              size="icon" 
              className="rounded-xl w-12 h-12 shadow-lg shadow-primary/20"
              onClick={() => setTaskSheetOpen(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Categories at top (only in list view) */}
        {viewMode === 'list' && (
          <CategoryChips
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onDeleteCategory={deleteCategory}
          />
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <AgendaCalendarView 
            tasks={filteredTasks}
            onTaskClick={handleEditTask}
          />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Pending Tasks - Collapsible */}
            <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all">
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
                  <div className="text-center py-10 bg-card/50 rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground">Nenhum lembrete pendente</p>
                    <Button variant="link" className="mt-1 text-primary" onClick={() => setTaskSheetOpen(true)}>
                      Criar novo
                    </Button>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pendingTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {pendingTasks.map(task => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                          onDelete={deleteTask}
                          onClick={() => handleEditTask(task)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Completed Tasks - Collapsible */}
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-2xl hover:border-success/30 transition-all">
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
                  <div className="text-center py-10 bg-card/50 rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground">Nenhum lembrete concluído</p>
                  </div>
                ) : (
                  completedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onClick={() => handleEditTask(task)}
                    />
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
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
    </AppLayout>
  );
}