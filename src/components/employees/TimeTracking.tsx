import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee: Check-in/out Card */}
      {!isAdmin && <EmployeeCheckInCard todayRecord={todayRecord} onCheckIn={checkIn} onCheckOut={checkOut} />}

      {/* Admin: Today summary + manual entry */}
      {isAdmin && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowManualSheet(true)}>
            <AppIcon name="PenLine" size={16} className="mr-2" />
            Lançamento Manual
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowSettingsSheet(true)}>
            <AppIcon name="Settings" size={16} />
          </Button>
        </div>
      )}

      {/* Records list */}
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

  if (todayRecord?.status === 'completed') {
    return (
      <Card className="card-unified border-success/30 bg-success/5">
        <CardContent className="p-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
            <AppIcon name="CheckCircle2" size={28} className="text-success" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Ponto Completo</h3>
          <p className="text-sm text-muted-foreground">
            Entrada: {todayRecord.check_in?.substring(0, 5)} • Saída: {todayRecord.check_out?.substring(0, 5)}
          </p>
          {todayRecord.points_awarded !== 0 && (
            <Badge variant="outline" className={cn(
              'mt-2',
              todayRecord.points_awarded > 0 ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'
            )}>
              {todayRecord.points_awarded > 0 ? '+' : ''}{todayRecord.points_awarded} pontos
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  if (todayRecord?.status === 'checked_in') {
    return (
      <Card className="card-unified border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <AppIcon name="Clock" size={28} className="text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Trabalhando</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Entrada registrada às {todayRecord.check_in?.substring(0, 5)}
          </p>
          {todayRecord.late_minutes > 0 && (
            <p className="text-xs text-destructive mb-2">{todayRecord.late_minutes}min de atraso</p>
          )}
          <p className="text-xs text-muted-foreground mb-4">
            Saída prevista: {todayRecord.expected_end?.substring(0, 5)}
          </p>
          <Button onClick={handleCheckOut} disabled={loading} className="w-full" variant="destructive">
            {loading ? <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" /> : <AppIcon name="LogOut" size={16} className="mr-2" />}
            Registrar Saída ({currentTime})
          </Button>
        </CardContent>
      </Card>
    );
  }

  const greeting = now.getHours() < 12 ? 'Bom dia!' : now.getHours() < 18 ? 'Boa tarde!' : 'Boa noite!';

  // No record yet — show check-in
  return (
    <Card className="card-unified">
      <CardContent className="p-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <AppIcon name="Clock" size={28} className="text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{greeting}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <Button onClick={handleCheckIn} disabled={loading} className="w-full">
          {loading ? <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" /> : <AppIcon name="LogIn" size={16} className="mr-2" />}
          Registrar Entrada ({currentTime})
        </Button>
      </CardContent>
    </Card>
  );
}

// ---- Records List ----
function RecordsList({ records, isAdmin }: { records: TimeRecord[]; isAdmin: boolean }) {
  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AppIcon name="Clock" size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum registro de ponto encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">Histórico</h3>
      {records.map(record => (
        <Card key={record.id} className="card-unified">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              record.status === 'completed' ? 'bg-success/10' :
              record.status === 'checked_in' ? 'bg-primary/10' :
              record.status === 'absent' ? 'bg-destructive/10' : 'bg-muted'
            )}>
              <AppIcon
                name={record.status === 'completed' ? 'CheckCircle2' : record.status === 'checked_in' ? 'Clock' : record.status === 'absent' ? 'XCircle' : 'CalendarOff'}
                size={18}
                className={cn(
                  record.status === 'completed' ? 'text-success' :
                  record.status === 'checked_in' ? 'text-primary' :
                  record.status === 'absent' ? 'text-destructive' : 'text-muted-foreground'
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isAdmin && record.profile && (
                  <span className="text-sm font-medium truncate">{record.profile.full_name}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(record.date), 'dd/MM', { locale: ptBR })}
                </span>
                {record.manual_entry && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Manual</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {record.check_in && <span>Entrada: {record.check_in.substring(0, 5)}</span>}
                {record.check_out && <span>• Saída: {record.check_out.substring(0, 5)}</span>}
                {record.late_minutes > 0 && <span className="text-destructive">• {record.late_minutes}min atraso</span>}
                {record.early_departure_minutes > 0 && <span className="text-destructive">• {record.early_departure_minutes}min antecipado</span>}
              </div>
            </div>

            {record.points_awarded !== 0 && (
              <Badge variant="outline" className={cn(
                'shrink-0 text-xs',
                record.points_awarded > 0 ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive'
              )}>
                {record.points_awarded > 0 ? '+' : ''}{record.points_awarded}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
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
    if (!userId || !checkInTime || !checkOutTime) {
      return;
    }
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

      <Button onClick={handleSubmit} disabled={loading || !userId || !checkInTime || !checkOutTime} className="w-full h-12">
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
        className="w-full h-12"
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
