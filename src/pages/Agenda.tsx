import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserModules } from '@/hooks/useAccessLevels';
import { useAgenda } from '@/hooks/useAgenda';
import { useCountUp } from '@/hooks/useCountUp';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';
import { AgendaCalendarView } from '@/components/agenda/AgendaCalendarView';
import { TimeBlocksView } from '@/components/agenda/TimeBlocksView';
import { CategoryChips } from '@/components/agenda/CategoryChips';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ManagerTask, TaskCategory } from '@/types/agenda';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

function SortableTaskItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
    willChange: 'transform',
    ...(isDragging && {
      scale: '1.03',
      opacity: 0.95,
    }),
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function Agenda() {
  const { isAdmin } = useAuth();
  const { hasAccess } = useUserModules();
  const canAccessAgenda = isAdmin || hasAccess('agenda');
  const navigate = useNavigate();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'blocks'>('list');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Optimistic local state for reorder
  const [tempTasks, setTempTasks] = useState<ManagerTask[] | null>(null);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
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

  // Use tempTasks if available (during reorder), else server data
  const displayTasks = useMemo(() => tempTasks || tasks, [tempTasks, tasks]);

  // Clear temp after server catches up
  useEffect(() => {
    if (tempTasks && tasks) {
      const timer = setTimeout(() => setTempTasks(null), 600);
      return () => clearTimeout(timer);
    }
  }, [tasks, tempTasks]);

  useEffect(() => {
    if (!canAccessAgenda) navigate('/');
  }, [canAccessAgenda, navigate]);

  // Stats
  const pendingCount = useCountUp(displayTasks.filter(t => !t.is_completed).length);
  const completedCount = useCountUp(displayTasks.filter(t => t.is_completed).length);

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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!selectedCategoryId) return displayTasks;
    return displayTasks.filter(t => t.category_id === selectedCategoryId);
  }, [displayTasks, selectedCategoryId]);

  const pendingTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  // Group pending tasks by category
  const uncategorizedTasks = pendingTasks.filter(t => !t.category_id);
  const tasksByCategory = categories
    .filter(cat => !selectedCategoryId || cat.id === selectedCategoryId)
    .map(cat => ({
      category: cat,
      tasks: pendingTasks.filter(t => t.category_id === cat.id),
    })).filter(g => g.tasks.length > 0);

  const toggleCategoryExpanded = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (!canAccessAgenda) return null;

  const handleDragStart = (_event: DragStartEvent) => {
    try { navigator.vibrate?.(10); } catch {}
  };

  const handleDragEnd = (event: DragEndEvent, taskList: ManagerTask[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = taskList.findIndex(t => t.id === active.id);
    const newIndex = taskList.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(taskList, oldIndex, newIndex);
    
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
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : pendingTasks.length === 0 && !showCompleted ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'hsl(142 60% 45% / 0.12)' }}>
            <AppIcon name="Check" size={28} style={{ color: 'hsl(142 60% 50%)' }} />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Tudo em dia! 🎉</p>
          <Button variant="link" className="mt-1 text-primary text-sm" onClick={() => setTaskSheetOpen(true)}>
            Criar novo lembrete
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
                  <AppIcon name="ChevronDown" size={16} className={cn("text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1.5 pl-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, catTasks)}>
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
            <div className="space-y-1.5">
              {tasksByCategory.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground px-1">Sem categoria</p>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, uncategorizedTasks)}>
                <SortableContext items={uncategorizedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {uncategorizedTasks.map(task => renderTaskItem(task))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed tasks */}
          {showCompleted && completedTasks.length > 0 && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 px-1 py-2 w-full">
                <AppIcon name="CheckCircle2" size={16} className="text-success" />
                <span className="text-sm font-semibold text-muted-foreground">Concluídos ({completedTasks.length})</span>
                <AppIcon name="ChevronDown" size={14} className="text-muted-foreground ml-auto" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 mt-1">
                {completedTasks.map(task => (
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
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  );

  const CalendarContent = () => (
    <AgendaCalendarView 
      tasks={displayTasks}
      onTaskClick={handleEditTask}
      onToggleTask={toggleTask}
    />
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="page-header-bar">
          <div className="page-header-content flex items-center justify-between">
            <div>
              <h1 className="page-title">Agenda</h1>
              {!isLoading && (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{pendingCount}</span> pendentes
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-success">{completedCount}</span> concluídos
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10">
                    <AppIcon name="MoreHorizontal" size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)}>
                    <AppIcon name="CheckCircle2" size={16} className="mr-2" />
                    {showCompleted ? 'Ocultar concluídos' : 'Ver concluídos'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategorySheetOpen(true)}>
                    <AppIcon name="Folder" size={16} className="mr-2" />
                    Gerenciar categorias
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="px-4 py-4 lg:px-6 space-y-4">
          {/* View mode tabs with animated indicator */}
          <div className="relative flex bg-muted/50 rounded-2xl p-1 border border-border">
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-card shadow-sm border border-border transition-all duration-300 ease-out"
              style={{
                width: 'calc(33.333% - 4px)',
                left: viewMode === 'list' ? '4px' : viewMode === 'calendar' ? 'calc(33.333% + 0px)' : 'calc(66.666% + 0px)',
              }}
            />
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
                viewMode === 'list' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <AppIcon name="ListChecks" size={16} />
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
                viewMode === 'calendar' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <AppIcon name="Calendar" size={16} />
              Calendário
            </button>
            <button
              onClick={() => setViewMode('blocks')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
                viewMode === 'blocks' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <AppIcon name="LayoutGrid" size={16} />
              Blocos
            </button>
          </div>

          {/* Category filter chips */}
          {viewMode === 'list' && categories.length > 0 && (
            <CategoryChips
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          )}

          {/* Content with fade transition */}
          <div className="animate-fade-in" key={viewMode}>
            {viewMode === 'list' && <ListContent />}
            {viewMode === 'calendar' && <CalendarContent />}
            {viewMode === 'blocks' && (
              <TimeBlocksView
                tasks={displayTasks}
                onToggleTask={toggleTask}
                onTaskClick={handleEditTask}
              />
            )}
          </div>
        </div>

        {/* FAB - positioned above the App Launcher */}
        <button
          onClick={() => { setEditingTask(null); setTaskSheetOpen(true); }}
          className="fixed z-[9998] w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 94px)', right: '20px' }}
        >
          <AppIcon name="Plus" size={24} />
        </button>
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
                <AppIcon name="Plus" size={16} />
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
                          <AppIcon name="X" size={16} />
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
                          <AppIcon name="Pencil" size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(cat.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <AppIcon name="Trash2" size={16} />
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
