import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Package, ClipboardCheck, Gift, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface TaskItemProps {
  task: ManagerTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-primary/10 text-primary',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
};

const priorityDots = {
  low: 'bg-primary',
  medium: 'bg-warning',
  high: 'bg-destructive',
};

const sourceIcons = {
  inventory: Package,
  checklist: ClipboardCheck,
  rewards: Gift,
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const SourceIcon = task.system_source 
    ? sourceIcons[task.system_source as keyof typeof sourceIcons] || AlertCircle
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all group',
        'bg-card border shadow-sm hover:shadow-md',
        task.is_completed && 'opacity-60 bg-muted'
      )}
    >
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={() => onToggle(task.id)}
        className="w-6 h-6 rounded-lg border-2"
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground truncate',
          task.is_completed && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        
        {task.is_system_generated && SourceIcon && (
          <div className="flex items-center gap-1.5 mt-1">
            <SourceIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Gerado pelo sistema
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          priorityDots[task.priority]
        )} />
        
        {!task.is_system_generated && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
