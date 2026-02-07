import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSchedule } from '@/hooks/useSchedule';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  User,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WorkSchedule } from '@/types/database';

export function ScheduleManagement() {
  const { schedules, isLoading, approveSchedule, deleteSchedule, getPendingSchedules } = useSchedule();
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingSchedules = getPendingSchedules();

  const handleApprove = async (approved: boolean) => {
    if (!selectedSchedule) return;

    setIsSubmitting(true);
    try {
      await approveSchedule(selectedSchedule.id, approved, notes);
      toast.success(approved ? 'Folga aprovada!' : 'Folga recusada');
      setSelectedSchedule(null);
      setNotes('');
    } catch {
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
      toast.success('Folga removida');
      setSelectedSchedule(null);
    } catch {
      toast.error('Erro ao remover folga');
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

  // Group schedules by month/year
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = `${schedule.year}-${schedule.month}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, WorkSchedule[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pendingSchedules.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {pendingSchedules.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingSchedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="card-unified-interactive p-4 cursor-pointer"
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={schedule.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{schedule.profile?.full_name || 'Usuário'}</p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.day_off} de {monthNames[schedule.month]} de {schedule.year}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="card-unified p-4">
            <ScheduleCalendar
              schedules={schedules}
              onDayClick={(day, month, year) => {
                const schedule = schedules.find(
                  s => s.day_off === day && s.month === month && s.year === year
                );
                if (schedule) {
                  setSelectedSchedule(schedule);
                }
              }}
            />
          </div>

          {/* Schedule List by Month */}
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Folgas Programadas</h3>
            {Object.entries(groupedSchedules)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([key, monthSchedules]) => {
                const [year, month] = key.split('-').map(Number);
                return (
                  <div key={key} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {monthNames[month]} {year}
                    </h4>
                    {monthSchedules
                      .sort((a, b) => a.day_off - b.day_off)
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="card-unified p-3 flex items-center justify-between cursor-pointer hover:bg-secondary/50"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="font-bold text-primary">{schedule.day_off}</span>
                            </div>
                            <div>
                              <p className="font-medium">{schedule.profile?.full_name || 'Usuário'}</p>
                              {schedule.notes && (
                                <p className="text-xs text-muted-foreground">{schedule.notes}</p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(schedule.status)}
                        </div>
                      ))}
                  </div>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalhes da Folga</SheetTitle>
          </SheetHeader>

          {selectedSchedule && (
            <div className="mt-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedSchedule.profile?.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedSchedule.profile?.full_name || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSchedule.profile?.job_title || 'Funcionário'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="card-unified p-4 text-center">
                <p className="text-3xl font-bold text-primary">{selectedSchedule.day_off}</p>
                <p className="text-muted-foreground">
                  {monthNames[selectedSchedule.month]} de {selectedSchedule.year}
                </p>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                {getStatusBadge(selectedSchedule.status)}
              </div>

              {/* Notes */}
              {selectedSchedule.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Observação do funcionário:</p>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    {selectedSchedule.notes}
                  </p>
                </div>
              )}

              {/* Actions for pending */}
              {selectedSchedule.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Observação (opcional)
                    </label>
                    <Textarea
                      placeholder="Adicionar observação..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => handleApprove(false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                      Recusar
                    </Button>
                    <Button
                      onClick={() => handleApprove(true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Aprovar
                    </Button>
                  </div>
                </div>
              )}

              {/* Delete for approved/rejected */}
              {selectedSchedule.status !== 'pending' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDelete(selectedSchedule.id)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remover Folga
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
