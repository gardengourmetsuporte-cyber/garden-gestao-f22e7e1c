import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Sunrise, Sun, Moon, ListTodo, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda, useAIAssistant, useSystemAlerts } from '@/hooks/useAgenda';
import { PeriodSection } from '@/components/agenda/PeriodSection';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { AppointmentSheet } from '@/components/agenda/AppointmentSheet';
import { SystemAlerts } from '@/components/agenda/SystemAlerts';
import { AISuggestions } from '@/components/agenda/AISuggestions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Agenda() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date());
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [appointmentSheetOpen, setAppointmentSheetOpen] = useState(false);

  const {
    tasks,
    appointments,
    isLoading,
    addTask,
    toggleTask,
    deleteTask,
    addAppointment,
    deleteAppointment,
    getTasksByPeriod,
    getAppointmentsByPeriod,
    isAddingTask,
    isAddingAppointment,
  } = useAgenda(selectedDate);

  const { alerts, criticalStockCount, zeroStockCount, pendingRedemptions } = useSystemAlerts();
  const { suggestion, isLoading: aiLoading, error: aiError, fetchSuggestion } = useAIAssistant();

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const pendingTasks = tasks.filter(t => !t.is_completed).length;
  const completedTasks = tasks.filter(t => t.is_completed).length;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'manhã';
    if (hour >= 12 && hour < 18) return 'tarde';
    return 'noite';
  };

  const buildContext = () => ({
    criticalStockCount,
    zeroStockCount,
    pendingRedemptions,
    pendingTasks,
    completedTasks,
    checklistOpeningStatus: 'não verificado',
    checklistClosingStatus: 'não verificado',
    dayOfWeek: format(new Date(), 'EEEE', { locale: ptBR }),
    timeOfDay: getTimeOfDay(),
  });

  // Fetch AI suggestion on load
  useEffect(() => {
    fetchSuggestion(buildContext()).catch(() => {});
  }, []);

  const handleRefreshAI = () => {
    fetchSuggestion(buildContext()).catch(() => {});
  };

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="rounded-full w-12 h-12 shadow-lg">
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTaskSheetOpen(true)}>
                <ListTodo className="w-4 h-4 mr-2" />
                Nova Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAppointmentSheetOpen(true)}>
                <Clock className="w-4 h-4 mr-2" />
                Novo Compromisso
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* System Alerts */}
        <SystemAlerts alerts={alerts} />

        {/* Day Periods */}
        <div className="space-y-6">
          <PeriodSection
            title="Manhã"
            icon={<Sunrise className="w-4 h-4 text-amber-500" />}
            iconColor="bg-amber-500/10"
            tasks={getTasksByPeriod('morning')}
            appointments={getAppointmentsByPeriod('morning')}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onDeleteAppointment={deleteAppointment}
          />

          <PeriodSection
            title="Tarde"
            icon={<Sun className="w-4 h-4 text-orange-500" />}
            iconColor="bg-orange-500/10"
            tasks={getTasksByPeriod('afternoon')}
            appointments={getAppointmentsByPeriod('afternoon')}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onDeleteAppointment={deleteAppointment}
          />

          <PeriodSection
            title="Noite"
            icon={<Moon className="w-4 h-4 text-indigo-500" />}
            iconColor="bg-indigo-500/10"
            tasks={getTasksByPeriod('evening')}
            appointments={getAppointmentsByPeriod('evening')}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onDeleteAppointment={deleteAppointment}
          />
        </div>

        {/* AI Suggestions */}
        <AISuggestions
          suggestion={suggestion}
          isLoading={aiLoading}
          error={aiError}
          onRefresh={handleRefreshAI}
        />
      </div>

      {/* Sheets */}
      <TaskSheet
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
        onSubmit={addTask}
        isSubmitting={isAddingTask}
      />

      <AppointmentSheet
        open={appointmentSheetOpen}
        onOpenChange={setAppointmentSheetOpen}
        onSubmit={addAppointment}
        isSubmitting={isAddingAppointment}
      />
    </AppLayout>
  );
}
