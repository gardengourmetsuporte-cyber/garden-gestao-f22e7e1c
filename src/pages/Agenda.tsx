import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Plus, Calendar, MoreHorizontal, CheckCircle2, Folder, Trash2, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';
import { AgendaCalendarView } from '@/components/agenda/AgendaCalendarView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ManagerTask, TaskCategory } from '@/types/agenda';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

function SortableTaskItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? '1.02' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [viewMode, setViewMode] = useState('list');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const {
    tasks,
    categories,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addCategory,
    updateCategory,
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

  if (!isAdmin) return null;

  const handleDragEnd = (event: DragEndEvent, taskList: ManagerTask[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = taskList.findIndex(t => t.id === active.id);
    const newIndex = taskList.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(taskList, oldIndex, newIndex);
    reorderTasks(reordered.map((t, i) => ({ id: t.id, sort_order: i })));
  };

  const renderTaskItem = (task: ManagerTask) => (
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
  );

  const ListContent = () => (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : pendingTasks.length === 0 && !showCompleted ? (
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
            const isExpanded = expandedCategories[category.id] !== false;
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
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 pl-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, catTasks)}>
                    <SortableContext items={catTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {catTasks.map(task => renderTaskItem(task))}
                    </SortableContext>
                  </DndContext>
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, uncategorizedTasks)}>
                <SortableContext items={uncategorizedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {uncategorizedTasks.map(task => renderTaskItem(task))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed tasks (togglable) */}
          {showCompleted && completedTasks.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 px-1">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-semibold text-muted-foreground">Concluídos ({completedTasks.length})</span>
              </div>
              {completedTasks.map(task => renderTaskItem(task))}
            </div>
          )}
        </>
      )}
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
              <div className="icon-glow icon-glow-md icon-glow-primary">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <h1 className="page-title">Agenda</h1>
                <p className="page-subtitle">
                  {pendingTasks.length} pendente{pendingTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                className="rounded-xl w-11 h-11 shadow-lg shadow-primary/20"
                onClick={() => setTaskSheetOpen(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-xl w-11 h-11">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {showCompleted ? 'Ocultar concluídos' : 'Ver concluídos'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategorySheetOpen(true)}>
                    <Folder className="w-4 h-4 mr-2" />
                    Gerenciar categorias
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

      {/* Category Management Sheet */}
      <CategoryManagerSheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        categories={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </AppLayout>
  );
}

// ─── Category Manager Sheet ─────────────────────────────────────

interface CategoryManagerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TaskCategory[];
  onAdd: (cat: { name: string; color: string }) => void;
  onUpdate: (cat: { id: string; name: string; color: string }) => void;
  onDelete: (id: string) => void;
}

function CategoryManagerSheet({ open, onOpenChange, categories, onAdd, onUpdate, onDelete }: CategoryManagerSheetProps) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[4]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({ name: newName.trim(), color: newColor });
    setNewName('');
  };

  const startEdit = (cat: TaskCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate({ id: editingId, name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle>Categorias</SheetTitle>
          <SheetDescription>Crie, edite ou exclua categorias dos seus lembretes</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-4">
          {/* Add new */}
          <div className="bg-secondary/50 rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nova categoria"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 h-10"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="h-10 px-4 rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    newColor === color && "ring-2 ring-offset-2 ring-foreground"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
          </div>

          {/* List */}
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhuma categoria criada</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-card rounded-2xl border border-border p-4">
                  {editingId === cat.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-10"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        />
                        <Button size="sm" onClick={saveEdit} className="h-10 rounded-xl">Salvar</Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded-full transition-all",
                              editColor === color && "ring-2 ring-offset-2 ring-foreground"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(cat.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
