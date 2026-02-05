 import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Trash2, CalendarDays, GripVertical } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { ManagerTask } from '@/types/agenda';
 
 interface TaskItemProps {
   task: ManagerTask;
   onToggle: (id: string) => void;
   onDelete: (id: string) => void;
   onClick?: () => void;
   isDragging?: boolean;
   dragHandleProps?: Record<string, unknown>;
 }
 
 function formatDueDate(dateStr: string | null, timeStr: string | null): string | null {
   if (!dateStr) return null;
   
   const date = parseISO(dateStr);
   
   if (isToday(date)) {
     return timeStr ? `Hoje às ${timeStr}` : 'Hoje';
   }
   if (isTomorrow(date)) {
     return timeStr ? `Amanhã às ${timeStr}` : 'Amanhã';
   }
   
   const formatted = format(date, "d 'de' MMM", { locale: ptBR });
   return timeStr ? `${formatted} às ${timeStr}` : formatted;
 }
 
 function isOverdue(dateStr: string | null): boolean {
   if (!dateStr) return false;
   const date = parseISO(dateStr);
   return isPast(date) && !isToday(date);
 }
 
 export function TaskItem({ task, onToggle, onDelete, onClick, isDragging, dragHandleProps }: TaskItemProps) {
   const dueLabel = formatDueDate(task.due_date || null, task.due_time || null);
   const overdue = !task.is_completed && isOverdue(task.due_date || null);
 
   return (
     <div
       className={cn(
        'flex items-center gap-3 p-4 rounded-2xl transition-all group',
        'bg-card border border-border shadow-sm',
         task.is_completed && 'opacity-60 bg-muted',
         isDragging && 'shadow-lg ring-2 ring-primary/50',
        !task.is_completed && !isDragging && 'hover:shadow-md hover:border-primary/30',
       )}
     >
       {/* Drag handle */}
      {dragHandleProps && (
        <div 
          {...dragHandleProps}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
 
       <Checkbox
         checked={task.is_completed}
         onCheckedChange={() => onToggle(task.id)}
         onClick={(e) => e.stopPropagation()}
        className="w-6 h-6 rounded-full border-2 data-[state=checked]:bg-success data-[state=checked]:border-success"
       />
       
       <button
         onClick={onClick}
         className="flex-1 min-w-0 text-left"
       >
         <p className={cn(
           'font-medium text-foreground truncate',
           task.is_completed && 'line-through text-muted-foreground'
         )}>
           {task.title}
         </p>
         
         <div className="flex items-center gap-2 flex-wrap">
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
               <span 
                 className="w-2 h-2 rounded-full" 
                 style={{ backgroundColor: task.category.color }}
               />
               <span className="text-xs text-muted-foreground">{task.category.name}</span>
             </span>
           )}
         </div>

          {/* Notes preview */}
          {task.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {task.notes}
            </p>
          )}
       </button>
 
      <button
        className="w-9 h-9 flex items-center justify-center rounded-xl 
          opacity-0 group-hover:opacity-100 transition-all 
          text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
         onClick={(e) => {
           e.stopPropagation();
           onDelete(task.id);
         }}
       >
         <Trash2 className="w-4 h-4" />
      </button>
     </div>
   );
 }