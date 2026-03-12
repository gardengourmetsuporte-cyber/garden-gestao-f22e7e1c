import { useState } from 'react';
import { useHourBank } from '@/hooks/useHourBank';
import { useEmployeeAbsences, ABSENCE_TYPES } from '@/hooks/useEmployeeAbsences';
import { useEmployees } from '@/hooks/useEmployees';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Tab = 'hours' | 'absences';

export function HourBankManager() {
  const [tab, setTab] = useState<Tab>('hours');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<'hour' | 'absence'>('hour');
  const { employees } = useEmployees();
  const { entries, addEntry, getBalance } = useHourBank();
  const { absences, createAbsence, updateStatus } = useEmployeeAbsences();

  // Form state
  const [empId, setEmpId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hours, setHours] = useState('');
  const [hourType, setHourType] = useState('overtime');
  const [absenceType, setAbsenceType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openSheet = (type: 'hour' | 'absence') => {
    setSheetType(type);
    setEmpId('');
    setNotes('');
    setSheetOpen(true);
  };

  const handleAddHour = async () => {
    if (!empId || !hours) return;
    setSubmitting(true);
    try {
      await addEntry.mutateAsync({
        employeeId: empId,
        date,
        type: hourType,
        hours: Number(hours),
        notes,
      });
      toast.success('Registro adicionado');
      setSheetOpen(false);
    } catch {
      toast.error('Erro ao registrar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAbsence = async () => {
    if (!empId || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      const days = differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
      await createAbsence.mutateAsync({
        employeeId: empId,
        type: absenceType,
        startDate,
        endDate,
        daysCount: days,
        notes,
      });
      toast.success('Ausência registrada');
      setSheetOpen(false);
    } catch {
      toast.error('Erro ao registrar ausência');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-500/15 text-red-700 dark:text-red-400',
  };

  const empName = (id: string) => employees.find(e => e.id === id)?.full_name || 'Funcionário';

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('hours')} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all", tab === 'hours' ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
          <AppIcon name="Clock" size={14} className="inline mr-1" />Banco de Horas
        </button>
        <button onClick={() => setTab('absences')} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all", tab === 'absences' ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
          <AppIcon name="Calendar" size={14} className="inline mr-1" />Férias / Ausências
        </button>
      </div>

      {tab === 'hours' ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Saldo de horas extras por funcionário</p>
            <Button size="sm" variant="outline" onClick={() => openSheet('hour')} className="text-xs gap-1">
              <AppIcon name="Plus" size={14} />Registrar
            </Button>
          </div>

          {/* Balance cards */}
          <div className="space-y-2">
            {employees.filter(e => e.is_active).map(emp => {
              const balance = getBalance(emp.id);
              return (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <span className="text-sm font-medium">{emp.name}</span>
                  <span className={cn("text-sm font-bold", balance > 0 ? "text-emerald-600 dark:text-emerald-400" : balance < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                    {balance > 0 ? '+' : ''}{balance.toFixed(1)}h
                  </span>
                </div>
              );
            })}
          </div>

          {/* Recent entries */}
          <div className="space-y-1.5">
            {entries.slice(0, 20).map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 text-xs">
                <AppIcon name={e.type === 'overtime' ? 'TrendingUp' : e.type === 'compensation' ? 'TrendingDown' : 'Settings'} size={14} className={e.type === 'overtime' ? 'text-emerald-500' : 'text-amber-500'} />
                <span className="flex-1">{empName(e.employee_id)}</span>
                <span className="font-medium">{e.type === 'compensation' ? '-' : '+'}{e.hours}h</span>
                <span className="text-muted-foreground">{format(new Date(e.date), 'dd/MM', { locale: ptBR })}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Controle de férias e ausências</p>
            <Button size="sm" variant="outline" onClick={() => openSheet('absence')} className="text-xs gap-1">
              <AppIcon name="Plus" size={14} />Registrar
            </Button>
          </div>

          <div className="space-y-2">
            {absences.map(a => (
              <div key={a.id} className="p-3 rounded-xl bg-secondary/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{empName(a.employee_id)}</span>
                  <Badge className={statusColors[a.status] || ''}>
                    {a.status === 'pending' ? 'Pendente' : a.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {ABSENCE_TYPES[a.type] || a.type} • {format(new Date(a.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(a.end_date), 'dd/MM', { locale: ptBR })} ({a.days_count} dias)
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: a.id, status: 'approved' })} className="text-xs h-7 gap-1">
                      <AppIcon name="Check" size={12} />Aprovar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: a.id, status: 'rejected' })} className="text-xs h-7 gap-1 text-destructive">
                      <AppIcon name="X" size={12} />Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {absences.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">Nenhuma ausência registrada</p>
            )}
          </div>
        </>
      )}

      {/* Sheet for adding entries */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>{sheetType === 'hour' ? 'Registrar Horas' : 'Registrar Ausência'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-4">
            <div>
              <Label className="text-xs">Funcionário</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.is_active).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sheetType === 'hour' ? (
              <>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={hourType} onValueChange={setHourType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overtime">Hora extra</SelectItem>
                      <SelectItem value="compensation">Compensação</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Horas</Label>
                  <Input type="number" step="0.5" min="0.5" value={hours} onChange={e => setHours(e.target.value)} className="mt-1" placeholder="Ex: 2" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={absenceType} onValueChange={setAbsenceType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ABSENCE_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Início</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Fim</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 text-xs" rows={2} />
            </div>

            <Button
              onClick={sheetType === 'hour' ? handleAddHour : handleAddAbsence}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
