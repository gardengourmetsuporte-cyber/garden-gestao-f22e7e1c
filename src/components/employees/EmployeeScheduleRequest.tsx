import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSchedule } from '@/hooks/useSchedule';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, Clock, Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function EmployeeScheduleRequest() {
  const { user } = useAuth();
  const { schedules, isLoading, createSchedule, deleteSchedule } = useSchedule();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Get user's schedules only
  const userSchedules = schedules.filter(s => s.user_id === user?.id);

  const handleDayClick = (day: number, month: number, year: number) => {
    setSelectedDay(day);
    setSelectedMonth(month);
    setSelectedYear(year);
    setSheetOpen(true);
  };

  const existingSchedule = userSchedules.find(
    s => s.day_off === selectedDay && s.month === selectedMonth && s.year === selectedYear
  );

  const handleSubmit = async () => {
    if (!selectedDay) return;

    setIsSubmitting(true);
    try {
      await createSchedule(selectedMonth, selectedYear, selectedDay, notes);
      toast.success('Solicitação de folga enviada!');
      setSheetOpen(false);
      setSelectedDay(null);
      setNotes('');
    } catch {
      toast.error('Erro ao solicitar folga');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await deleteSchedule(id);
      toast.success('Solicitação cancelada');
      setSheetOpen(false);
    } catch {
      toast.error('Erro ao cancelar solicitação');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground"><Check className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Recusado</Badge>;
      default:
        return null;
    }
  };

  const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="card-unified p-4 bg-primary/5">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Solicite sua folga</p>
            <p className="text-sm text-muted-foreground">
              Toque em um dia do calendário para solicitar folga. Aguarde aprovação do gestor.
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card-unified p-4">
        <ScheduleCalendar
          schedules={userSchedules}
          currentUserId={user?.id}
          onDayClick={handleDayClick}
          selectedDay={selectedDay ?? undefined}
        />
      </div>

      {/* My Requests */}
      <div className="space-y-3">
        <h3 className="font-semibold">Minhas Solicitações</h3>
        {userSchedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhuma solicitação de folga</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userSchedules
              .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                if (a.month !== b.month) return b.month - a.month;
                return b.day_off - a.day_off;
              })
              .map((schedule) => (
                <div key={schedule.id} className="card-unified p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {schedule.day_off} de {monthNames[schedule.month]} de {schedule.year}
                    </p>
                    {schedule.notes && (
                      <p className="text-sm text-muted-foreground">{schedule.notes}</p>
                    )}
                  </div>
                  {getStatusBadge(schedule.status)}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Request Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {existingSchedule ? 'Detalhes da Folga' : 'Solicitar Folga'}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="card-unified p-4 text-center">
              <p className="text-3xl font-bold text-primary">{selectedDay}</p>
              <p className="text-muted-foreground">
                {monthNames[selectedMonth]} de {selectedYear}
              </p>
            </div>

            {existingSchedule ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {getStatusBadge(existingSchedule.status)}
                </div>
                
                {existingSchedule.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Observação:</p>
                    <p className="text-sm text-muted-foreground">{existingSchedule.notes}</p>
                  </div>
                )}

                {existingSchedule.status === 'pending' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleCancel(existingSchedule.id)}
                  >
                    Cancelar Solicitação
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Observação (opcional)
                  </label>
                  <Textarea
                    placeholder="Motivo da folga..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Solicitar Folga
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
