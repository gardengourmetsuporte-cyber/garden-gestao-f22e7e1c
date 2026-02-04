import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagerAppointment } from '@/types/agenda';

interface AppointmentItemProps {
  appointment: ManagerAppointment;
  onDelete: (id: string) => void;
}

export function AppointmentItem({ appointment, onDelete }: AppointmentItemProps) {
  // Format time from HH:MM:SS to HH:MM
  const formattedTime = appointment.scheduled_time.slice(0, 5);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl transition-all group',
        'bg-primary/5 border border-primary/20 shadow-sm hover:shadow-md'
      )}
    >
      <div className="flex items-center gap-2 text-primary">
        <Clock className="w-4 h-4" />
        <span className="font-semibold text-sm">{formattedTime}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {appointment.title}
        </p>
        
        {appointment.notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {appointment.notes}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(appointment.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
