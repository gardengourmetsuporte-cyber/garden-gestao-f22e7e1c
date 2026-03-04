import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, subMonths, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTimeTracking, TimeRecord } from '@/hooks/useTimeTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { cn } from '@/lib/utils';

export function TimeTracking() {
  const { isAdmin, user } = useAuth();
  const { records, isLoading, todayRecord, checkIn, checkOut, createManualEntry, settings, saveSettings } = useTimeTracking();
  const { employees } = useEmployees();
  const [showManualSheet, setShowManualSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!isAdmin && <EmployeeCheckInCard todayRecord={todayRecord} onCheckIn={checkIn} onCheckOut={checkOut} />}

      {isAdmin && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowManualSheet(true)}>
            <AppIcon name="PenLine" size={16} className="mr-2" />
            Lançamento Manual
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl h-11 w-11" onClick={() => setShowSettingsSheet(true)}>
            <AppIcon name="Settings" size={16} />
          </Button>
        </div>
      )}

      <RecordsList records={records} isAdmin={isAdmin} />

      {/* Manual Entry Sheet */}
      <Sheet open={showManualSheet} onOpenChange={setShowManualSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Lançamento Manual de Ponto</SheetTitle>
          </SheetHeader>
          <ManualEntryForm
            employees={employees}
            onSubmit={async (data) => {
              const ok = await createManualEntry(data);
              if (ok) setShowManualSheet(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Configurações de Ponto</SheetTitle>
          </SheetHeader>
          <SettingsForm settings={settings} onSave={async (s) => {
            const ok = await saveSettings(s);
            if (ok) setShowSettingsSheet(false);
          }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---- Employee Check-In Card ----
export function EmployeeCheckInCard({
  todayRecord,
  onCheckIn,
  onCheckOut,
}: {
  todayRecord: TimeRecord | null;
  onCheckIn: (start?: string, end?: string) => Promise<boolean>;
  onCheckOut: () => Promise<boolean>;
}) {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const currentTime = format(now, 'HH:mm');

  const handleCheckIn = async () => {
    setLoading(true);
    await onCheckIn();
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    await onCheckOut();
    setLoading(false);
  };

  // ── Completed ──
  if (todayRecord?.status === 'completed') {
    return (
      <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <AppIcon name="CheckCircle2" size={20} className="text-success" />
          </div>
          <div>
            <p className="font-semibold text-sm">Ponto Completo</p>
            <p className="text-xs text-muted-foreground">Jornada encerrada</p>
          </div>
        </div>

        <div className="flex gap-3">
          <TimeBlock label="Entrada" value={todayRecord.check_in?.substring(0, 5) ?? '--:--'} />
          <TimeBlock label="Saída" value={todayRecord.check_out?.substring(0, 5) ?? '--:--'} />
          {todayRecord.points_awarded !== 0 && (
            <TimeBlock
              label="Pontos"
              value={`${todayRecord.points_awarded > 0 ? '+' : ''}${todayRecord.points_awarded}`}
              accent={todayRecord.points_awarded > 0 ? 'success' : 'destructive'}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Checked In (working) ──
  if (todayRecord?.status === 'checked_in') {
    return (
      <div className="rounded-2xl bg-card border border-primary/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Clock" size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Trabalhando</p>
            <p className="text-xs text-muted-foreground">
              Desde {todayRecord.check_in?.substring(0, 5)}
              {todayRecord.late_minutes > 0 && (
                <span className="text-destructive ml-1">• {todayRecord.late_minutes}min atraso</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <TimeBlock label="Entrada" value={todayRecord.check_in?.substring(0, 5) ?? '--:--'} />
          <TimeBlock label="Saída prevista" value={todayRecord.expected_end?.substring(0, 5) ?? '--:--'} muted />
        </div>

        <Button onClick={handleCheckOut} disabled={loading} className="w-full h-11 rounded-xl" variant="destructive">
          {loading ? <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" /> : <AppIcon name="LogOut" size={16} className="mr-2" />}
          Registrar Saída • {currentTime}
        </Button>
      </div>
    );
  }

  // ── No record — Check In ──
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <AppIcon name="Clock" size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{greeting} 👋</p>
          <p className="text-xs text-muted-foreground capitalize">
            {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      <Button onClick={handleCheckIn} disabled={loading} className="w-full h-11 rounded-xl">
        {loading ? <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" /> : <AppIcon name="LogIn" size={16} className="mr-2" />}
        Registrar Entrada • {currentTime}
      </Button>
    </div>
  );
}

// ---- Time Block (mini stat) ----
function TimeBlock({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: 'success' | 'destructive';
  muted?: boolean;
}) {
  return (
    <div className={cn(
      "flex-1 rounded-xl px-3 py-2.5 text-center",
      accent === 'success' ? 'bg-success/8' :
      accent === 'destructive' ? 'bg-destructive/8' :
      'bg-muted/50'
    )}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={cn(
        "text-sm font-semibold tabular-nums",
        accent === 'success' ? 'text-success' :
        accent === 'destructive' ? 'text-destructive' :
        muted ? 'text-muted-foreground' : 'text-foreground'
      )}>
        {value}
      </p>
    </div>
  );
}

// ---- Records List ----
function RecordsList({ records, isAdmin }: { records: TimeRecord[]; isAdmin: boolean }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const recordDate = parseISO(r.date);
      return isSameMonth(recordDate, selectedMonth);
    });
  }, [records, selectedMonth]);

  // Group by date
  const groupedRecords = useMemo(() => {
    const groups: Record<string, TimeRecord[]> = {};
    filteredRecords.forEach(r => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRecords]);

  const monthTotal = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.points_awarded, 0);
  }, [filteredRecords]);

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  return (
    <div className="space-y-3">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Histórico</p>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <AppIcon name="ChevronLeft" size={16} className="text-muted-foreground" />
          </button>
          <span className="text-xs font-semibold min-w-[100px] text-center capitalize">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Month summary */}
      {filteredRecords.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/30 border border-border/20">
          <span className="text-xs text-muted-foreground">{filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''}</span>
          <span className={cn(
            'text-xs font-bold tabular-nums',
            monthTotal > 0 ? 'text-success' : monthTotal < 0 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {monthTotal > 0 ? '+' : ''}{monthTotal} pts
          </span>
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <AppIcon name="Clock" size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum registro neste mês</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedRecords.map(([date, dayRecords]) => (
            <div key={date} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              {dayRecords.map(record => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-xl bg-card border border-border/40 px-3.5 py-3 transition-colors"
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    record.status === 'completed' ? 'bg-success' :
                    record.status === 'checked_in' ? 'bg-primary' :
                    record.status === 'absent' ? 'bg-destructive' : 'bg-muted-foreground/40'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isAdmin && record.profile && (
                        <span className="text-sm font-medium truncate">{record.profile.full_name}</span>
                      )}
                      {record.manual_entry && (
                        <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1 py-px">manual</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      {record.check_in && <span>{record.check_in.substring(0, 5)}</span>}
                      {record.check_out && <span>→ {record.check_out.substring(0, 5)}</span>}
                      {record.late_minutes > 0 && (
                        <span className="text-destructive">{record.late_minutes}min atraso</span>
                      )}
                      {record.early_departure_minutes > 0 && (
                        <span className="text-destructive">{record.early_departure_minutes}min antecipado</span>
                      )}
                    </div>
                  </div>
                  {record.points_awarded !== 0 && (
                    <span className={cn(
                      'text-xs font-semibold tabular-nums shrink-0',
                      record.points_awarded > 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {record.points_awarded > 0 ? '+' : ''}{record.points_awarded}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ---- Manual Entry Form ----
function ManualEntryForm({
  employees,
  onSubmit,
}: {
  employees: any[];
  onSubmit: (data: any) => Promise<void>;
}) {
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expectedStart, setExpectedStart] = useState('08:00');
  const [expectedEnd, setExpectedEnd] = useState('17:00');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const activeEmployees = employees.filter(e => e.is_active && e.user_id);

  const handleSubmit = async () => {
    if (!userId || !checkInTime || !checkOutTime) return;
    setLoading(true);
    await onSubmit({
      user_id: userId,
      date,
      expected_start: expectedStart,
      expected_end: expectedEnd,
      check_in: checkInTime,
      check_out: checkOutTime,
      notes,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-4 pt-4 overflow-y-auto h-[calc(85vh-80px)]">
      <div>
        <Label>Funcionário *</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {activeEmployees.map(emp => (
              <SelectItem key={emp.user_id} value={emp.user_id}>{emp.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Data</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Horário Esperado (Entrada)</Label>
          <Input type="time" value={expectedStart} onChange={e => setExpectedStart(e.target.value)} />
        </div>
        <div>
          <Label>Horário Esperado (Saída)</Label>
          <Input type="time" value={expectedEnd} onChange={e => setExpectedEnd(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Entrada Real *</Label>
          <Input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
        </div>
        <div>
          <Label>Saída Real *</Label>
          <Input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." rows={2} />
      </div>

      <Button onClick={handleSubmit} disabled={loading || !userId || !checkInTime || !checkOutTime} className="w-full h-12 rounded-xl">
        {loading && <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" />}
        Salvar Registro
      </Button>
    </div>
  );
}

// ---- Settings Form ----
function SettingsForm({
  settings,
  onSave,
}: {
  settings: any;
  onSave: (s: any) => Promise<void>;
}) {
  const [pointsLate, setPointsLate] = useState(settings?.points_per_minute_late ?? -1);
  const [pointsEarly, setPointsEarly] = useState(settings?.points_per_minute_early ?? -1);
  const [onTimeBonus, setOnTimeBonus] = useState(settings?.points_on_time_bonus ?? 5);
  const [grace, setGrace] = useState(settings?.grace_period_minutes ?? 5);
  const [maxPenalty, setMaxPenalty] = useState(settings?.max_penalty_per_day ?? -30);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4 pt-4 overflow-y-auto h-[calc(70vh-80px)]">
      <div>
        <Label>Pontos por minuto de atraso</Label>
        <Input type="number" value={pointsLate} onChange={e => setPointsLate(Number(e.target.value))} />
        <p className="text-xs text-muted-foreground mt-1">Valor negativo (ex: -1 = perde 1pt por minuto)</p>
      </div>

      <div>
        <Label>Pontos por minuto de saída antecipada</Label>
        <Input type="number" value={pointsEarly} onChange={e => setPointsEarly(Number(e.target.value))} />
      </div>

      <div>
        <Label>Bônus por pontualidade</Label>
        <Input type="number" value={onTimeBonus} onChange={e => setOnTimeBonus(Number(e.target.value))} />
        <p className="text-xs text-muted-foreground mt-1">Pontos ganhos quando chega e sai no horário</p>
      </div>

      <div>
        <Label>Tolerância (minutos)</Label>
        <Input type="number" value={grace} onChange={e => setGrace(Number(e.target.value))} />
        <p className="text-xs text-muted-foreground mt-1">Minutos de tolerância antes de penalizar</p>
      </div>

      <div>
        <Label>Penalidade máxima por dia</Label>
        <Input type="number" value={maxPenalty} onChange={e => setMaxPenalty(Number(e.target.value))} />
        <p className="text-xs text-muted-foreground mt-1">Limite de pontos negativos por dia (ex: -30)</p>
      </div>

      <Button
        className="w-full h-12 rounded-xl"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await onSave({
            points_per_minute_late: pointsLate,
            points_per_minute_early: pointsEarly,
            points_on_time_bonus: onTimeBonus,
            grace_period_minutes: grace,
            max_penalty_per_day: maxPenalty,
          });
          setLoading(false);
        }}
      >
        Salvar Configurações
      </Button>
    </div>
  );
}
