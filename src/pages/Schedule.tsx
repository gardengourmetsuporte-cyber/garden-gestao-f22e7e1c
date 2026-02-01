import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSchedule } from '@/hooks/useSchedule';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Loader2,
  User,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkSchedule } from '@/types/database';

export default function SchedulePage() {
  const { user, isAdmin } = useAuth();
  const { 
    schedules, 
    isLoading, 
    createSchedule, 
    approveSchedule, 
    deleteSchedule,
    getUserScheduleForMonth,
    getPendingSchedules 
  } = useSchedule();
  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMonthSchedule = getUserScheduleForMonth(selectedMonth, selectedYear);
  const pendingSchedules = getPendingSchedules();

  const handleDayClick = (day: number, month: number, year: number) => {
    setSelectedDay(day);
    setSelectedMonth(month);
    setSelectedYear(year);
    
    // Check if user already has a schedule for this month
    const existingSchedule = getUserScheduleForMonth(month, year);
    if (!existingSchedule || existingSchedule.status === 'rejected') {
      setRequestSheetOpen(true);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedDay) return;
    
    setIsSubmitting(true);
    try {
      await createSchedule(selectedMonth, selectedYear, selectedDay, notes || undefined);
      toast.success('Solicitação de folga enviada!');
      setRequestSheetOpen(false);
      setSelectedDay(null);
      setNotes('');
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Você já tem uma solicitação para este mês');
      } else {
        toast.error('Erro ao enviar solicitação');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (schedule: WorkSchedule, approved: boolean) => {
    try {
      await approveSchedule(schedule.id, approved);
      toast.success(approved ? 'Folga aprovada!' : 'Folga recusada');
    } catch (error) {
      toast.error('Erro ao processar solicitação');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
      toast.success('Solicitação excluída!');
    } catch (error) {
      toast.error('Erro ao excluir solicitação');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <h1 className="text-xl font-bold text-foreground">Escala de Serviço</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Gerencie as folgas da equipe' : 'Solicite seu dia de folga'}
            </p>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6">
          {isAdmin ? (
            <Tabs defaultValue="calendar" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-auto gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="calendar"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendário
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
                >
                  <Clock className="w-4 h-4" />
                  Pendentes
                  {pendingSchedules.length > 0 && (
                    <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 rounded-full">
                      {pendingSchedules.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-0">
                <div className="bg-card rounded-2xl border p-4">
                  <ScheduleCalendar
                    schedules={schedules}
                    currentUserId={user?.id}
                    onDayClick={handleDayClick}
                    selectedDay={selectedDay ?? undefined}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-0 space-y-3">
                {pendingSchedules.length === 0 ? (
                  <div className="bg-card rounded-2xl border p-8 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                  </div>
                ) : (
                  pendingSchedules.map((schedule) => (
                    <div key={schedule.id} className="bg-card rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{schedule.profile?.full_name || 'Usuário'}</p>
                            <p className="text-sm text-muted-foreground">
                              Dia {schedule.day_off} de{' '}
                              {format(new Date(schedule.year, schedule.month - 1), 'MMMM/yyyy', { locale: ptBR })}
                            </p>
                            {schedule.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                "{schedule.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(schedule, false)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(schedule, true)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              {/* Current month status */}
              {currentMonthSchedule && (
                <div className={`rounded-2xl border p-4 ${
                  currentMonthSchedule.status === 'approved' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : currentMonthSchedule.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-5 h-5 ${
                      currentMonthSchedule.status === 'approved' 
                        ? 'text-green-500' 
                        : currentMonthSchedule.status === 'pending'
                          ? 'text-amber-500'
                          : 'text-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">
                        Dia {currentMonthSchedule.day_off} - {' '}
                        {currentMonthSchedule.status === 'approved' 
                          ? 'Aprovado' 
                          : currentMonthSchedule.status === 'pending'
                            ? 'Aguardando aprovação'
                            : 'Recusado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(currentMonthSchedule.year, currentMonthSchedule.month - 1), 'MMMM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar */}
              <div className="bg-card rounded-2xl border p-4">
                <ScheduleCalendar
                  schedules={schedules}
                  currentUserId={user?.id}
                  onDayClick={handleDayClick}
                  selectedDay={selectedDay ?? undefined}
                />
              </div>

              {!currentMonthSchedule && (
                <p className="text-sm text-muted-foreground text-center">
                  Toque em um dia para solicitar sua folga
                </p>
              )}
            </div>
          )}
        </div>

        {/* Request Sheet */}
        <Sheet open={requestSheetOpen} onOpenChange={setRequestSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
            <SheetHeader className="pb-4">
              <SheetTitle>Solicitar Folga</SheetTitle>
            </SheetHeader>

            <div className="space-y-5">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold">{selectedDay}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMonth && selectedYear && 
                    format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: ptBR })
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observação (opcional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Consulta médica, compromisso pessoal..."
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleSubmitRequest}
                disabled={!selectedDay || isSubmitting}
                className="w-full h-12"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Solicitar Folga
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
