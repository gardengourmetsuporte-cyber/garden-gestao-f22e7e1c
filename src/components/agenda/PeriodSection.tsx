import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TaskItem } from './TaskItem';
import { AppointmentItem } from './AppointmentItem';
import type { ManagerTask, ManagerAppointment } from '@/types/agenda';

interface PeriodSectionProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  tasks: ManagerTask[];
  appointments: ManagerAppointment[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
}

export function PeriodSection({
  title,
  icon,
  iconColor,
  tasks,
  appointments,
  onToggleTask,
  onDeleteTask,
  onDeleteAppointment,
}: PeriodSectionProps) {
  const isEmpty = tasks.length === 0 && appointments.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg', iconColor)}>
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          ({tasks.length + appointments.length})
        </span>
      </div>

      <div className="space-y-2 pl-1">
        {appointments.map(appointment => (
          <AppointmentItem
            key={appointment.id}
            appointment={appointment}
            onDelete={onDeleteAppointment}
          />
        ))}
        
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
          />
        ))}

        {isEmpty && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma tarefa ou compromisso
          </p>
        )}
      </div>
    </div>
  );
}
