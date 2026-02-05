 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { ListChecks, Plus, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
 import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
 import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
 import { CSS } from '@dnd-kit/utilities';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { useAuth } from '@/contexts/AuthContext';
 import { useAgenda } from '@/hooks/useAgenda';
 import { TaskSheet } from '@/components/agenda/TaskSheet';
 import { TaskItem } from '@/components/agenda/TaskItem';
 import { CategoryChips } from '@/components/agenda/CategoryChips';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { useEffect } from 'react';
 import type { ManagerTask } from '@/types/agenda';
 
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
     // Future: implement reorder persistence
     console.log('Drag end:', event);
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
               <h1 className="text-xl font-bold text-foreground">Lembretes</h1>
               <p className="text-sm text-muted-foreground">
                 {pendingTasks.length} pendente{pendingTasks.length !== 1 ? 's' : ''}
               </p>
             </div>
           </div>
 
           <Button 
             size="icon" 
             className="rounded-full w-12 h-12 shadow-lg"
             onClick={() => setTaskSheetOpen(true)}
           >
             <Plus className="w-5 h-5" />
           </Button>
         </div>
 
         {/* Categories at top */}
         <CategoryChips
           categories={categories}
           selectedCategoryId={selectedCategoryId}
           onSelectCategory={setSelectedCategoryId}
           onDeleteCategory={deleteCategory}
         />
 
         {/* Pending Tasks - Collapsible */}
         <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
           <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors">
             <div className="flex items-center gap-2">
               <ListChecks className="w-5 h-5 text-primary" />
               <span className="font-medium">Pendentes</span>
               <span className="text-sm text-muted-foreground">({pendingTasks.length})</span>
             </div>
             {pendingOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
           </CollapsibleTrigger>
           <CollapsibleContent className="mt-2 space-y-2">
             {isLoading ? (
               <p className="text-center text-muted-foreground py-8">Carregando...</p>
             ) : pendingTasks.length === 0 ? (
               <div className="text-center py-8">
                 <p className="text-muted-foreground">Nenhum lembrete pendente</p>
                 <Button variant="link" className="mt-1" onClick={() => setTaskSheetOpen(true)}>
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
           <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors">
             <div className="flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5 text-success" />
               <span className="font-medium">Concluídos</span>
               <span className="text-sm text-muted-foreground">({completedTasks.length})</span>
             </div>
             {completedOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
           </CollapsibleTrigger>
           <CollapsibleContent className="mt-2 space-y-2">
             {completedTasks.length === 0 ? (
               <div className="text-center py-8">
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