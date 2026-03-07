import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
import { Badge } from '@/components/ui/badge';
import { useTimeTracking, TimeRecord } from '@/hooks/useTimeTracking';
import { useMedicalCertificates, MedicalCertificate } from '@/hooks/useMedicalCertificates';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function TimeTracking() {
  const { isAdmin, user } = useAuth();
  const { records, isLoading, todayRecord, checkIn, checkOut, createManualEntry, deleteRecord, settings, saveSettings, refetch } = useTimeTracking();
  const { certificates, submitCertificate, reviewCertificate } = useMedicalCertificates();
  const { employees } = useEmployees();
  const { activeUnitId } = useUnit();
  const [showManualSheet, setShowManualSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [showCertificateSheet, setShowCertificateSheet] = useState(false);
  const [showCertificateList, setShowCertificateList] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  const pendingCerts = certificates.filter(c => c.status === 'pending');

  const handleExportRecords = () => {
    if (records.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    const data = records.map(r => ({
      Data: r.date,
      Funcionário: r.profile?.full_name || r.user_id,
      Entrada: r.check_in?.substring(0, 5) || '',
      Saída: r.check_out?.substring(0, 5) || '',
      'Entrada Esperada': r.expected_start?.substring(0, 5) || '',
      'Saída Esperada': r.expected_end?.substring(0, 5) || '',
      'Atraso (min)': r.late_minutes || 0,
      'Saída Antecipada (min)': r.early_departure_minutes || 0,
      Pontos: r.points_awarded,
      Status: r.status === 'completed' ? 'Completo' : r.status === 'checked_in' ? 'Trabalhando' : r.status === 'absent' ? 'Falta' : r.status === 'day_off' ? 'Folga' : r.status,
      Manual: r.manual_entry ? 'Sim' : 'Não',
      Observações: r.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ponto');
    XLSX.writeFile(wb, `ponto-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Relatório exportado!');
  };

  return (
    <div className="space-y-5">
      {!isAdmin && <EmployeeCheckInCard todayRecord={todayRecord} onCheckIn={checkIn} onCheckOut={checkOut} />}

      {/* Employee: Send Certificate */}
      {!isAdmin && (
        <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => setShowCertificateSheet(true)}>
          <AppIcon name="clinical_notes" size={16} className="mr-2" />
          Enviar Atestado
        </Button>
      )}

      {isAdmin && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowManualSheet(true)}>
              <AppIcon name="edit" size={16} className="mr-2" />
              Lançamento Manual
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl h-11 w-11" onClick={() => setShowSettingsSheet(true)}>
              <AppIcon name="settings" size={16} />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowImportSheet(true)}>
              <AppIcon name="upload" size={16} className="mr-2" />
              Importar
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => handleExportRecords()}>
              <AppIcon name="download" size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-xl h-11 relative"
            onClick={() => setShowCertificateList(true)}
          >
            <AppIcon name="clinical_notes" size={16} className="mr-2" />
            Atestados
            {pendingCerts.length > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[10px]" variant="destructive">
                {pendingCerts.length}
              </Badge>
            )}
          </Button>
        </div>
      )}

      <RecordsList records={records} isAdmin={isAdmin} onDelete={isAdmin ? deleteRecord : undefined} />

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

      {/* Import Sheet */}
      <Sheet open={showImportSheet} onOpenChange={setShowImportSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Importar Registro de Ponto</SheetTitle>
          </SheetHeader>
          <ImportTimeRecordsForm
            unitId={activeUnitId}
            onDone={() => { setShowImportSheet(false); refetch(); }}
          />
        </SheetContent>
      </Sheet>

      {/* Certificate Submit Sheet (employee) */}
      <Sheet open={showCertificateSheet} onOpenChange={setShowCertificateSheet}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Enviar Atestado Médico</SheetTitle>
          </SheetHeader>
          <CertificateForm onSubmit={async (data) => {
            const ok = await submitCertificate(data);
            if (ok) setShowCertificateSheet(false);
            return ok;
          }} />
        </SheetContent>
      </Sheet>

      {/* Certificate List Sheet (admin) */}
      <Sheet open={showCertificateList} onOpenChange={setShowCertificateList}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Atestados Médicos</SheetTitle>
          </SheetHeader>
          <CertificateListView certificates={certificates} onReview={reviewCertificate} />
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
      <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <AppIcon name="check_circle" size={20} className="text-success" />
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

  if (todayRecord?.status === 'checked_in') {
    return (
      <div className="rounded-2xl bg-card border border-primary/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="schedule" size={20} className="text-primary" />
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
          {loading ? <AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" /> : <AppIcon name="logout" size={16} className="mr-2" />}
          Registrar Saída • {currentTime}
        </Button>
      </div>
    );
  }

  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <AppIcon name="schedule" size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{greeting} 👋</p>
          <p className="text-xs text-muted-foreground capitalize">
            {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
      <Button onClick={handleCheckIn} disabled={loading} className="w-full h-11 rounded-xl">
        {loading ? <AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" /> : <AppIcon name="login" size={16} className="mr-2" />}
        Registrar Entrada • {currentTime}
      </Button>
    </div>
  );
}

// ---- Time Block (mini stat) ----
function TimeBlock({
  label, value, accent, muted,
}: {
  label: string; value: string; accent?: 'success' | 'destructive'; muted?: boolean;
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
function RecordsList({ records, isAdmin, onDelete }: { records: TimeRecord[]; isAdmin: boolean; onDelete?: (id: string) => Promise<boolean> }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const recordDate = parseISO(r.date);
      return isSameMonth(recordDate, selectedMonth);
    });
  }, [records, selectedMonth]);

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

  const statusLabel = (status: string) => {
    if (status === 'day_off') return 'Folga';
    if (status === 'absent') return 'Falta';
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Histórico</p>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <AppIcon name="chevron_left" size={16} className="text-muted-foreground" />
          </button>
          <span className="text-xs font-semibold min-w-[100px] text-center capitalize">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <AppIcon name="chevron_right" size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

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
          <AppIcon name="schedule" size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum registro neste mês</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedRecords.map(([date, dayRecords]) => (
            <div key={date} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              {dayRecords.map(record => {
                const label = statusLabel(record.status);
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 rounded-xl bg-card border border-border/40 px-3.5 py-3 transition-colors"
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      record.status === 'completed' ? 'bg-success' :
                      record.status === 'checked_in' ? 'bg-primary' :
                      record.status === 'absent' ? 'bg-destructive' :
                      record.status === 'day_off' ? 'bg-amber-400' :
                      'bg-muted-foreground/40'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isAdmin && record.profile && (
                          <span className="text-sm font-medium truncate">{record.profile.full_name}</span>
                        )}
                        {record.manual_entry && (
                          <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1 py-px">manual</span>
                        )}
                        {label && (
                          <span className={cn(
                            "text-[10px] rounded px-1 py-px",
                            record.status === 'day_off' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-destructive/10 text-destructive'
                          )}>{label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        {record.check_in && <span>{record.check_in.substring(0, 5)}</span>}
                        {record.check_out && <span>→ {record.check_out.substring(0, 5)}</span>}
                        {!record.check_in && !record.check_out && record.notes && (
                          <span>{record.notes}</span>
                        )}
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
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm('Excluir este registro de ponto?')) {
                            onDelete(record.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <AppIcon name="delete" size={14} className="text-destructive/60" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Manual Entry Form (with absence types) ----
function ManualEntryForm({
  employees,
  onSubmit,
}: {
  employees: any[];
  onSubmit: (data: any) => Promise<void>;
}) {
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entryType, setEntryType] = useState<'normal' | 'folga' | 'falta' | 'atestado'>('normal');
  const [expectedStart, setExpectedStart] = useState('08:00');
  const [expectedEnd, setExpectedEnd] = useState('17:00');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const activeEmployees = employees.filter(e => e.is_active && e.user_id);

  const isAbsence = entryType === 'folga' || entryType === 'falta' || entryType === 'atestado';

  const handleSubmit = async () => {
    if (!userId) return;
    if (!isAbsence && (!checkInTime || !checkOutTime)) return;
    setLoading(true);

    const data: any = {
      user_id: userId,
      date,
      expected_start: isAbsence ? '00:00' : expectedStart,
      expected_end: isAbsence ? '00:00' : expectedEnd,
      check_in: isAbsence ? '00:00' : checkInTime,
      check_out: isAbsence ? '00:00' : checkOutTime,
      notes: isAbsence
        ? (entryType === 'folga' ? 'Folga' : entryType === 'falta' ? 'Falta' : 'Atestado médico') + (notes ? ` - ${notes}` : '')
        : notes,
    };

    // Override status for absences
    if (isAbsence) {
      data._status = entryType === 'falta' ? 'absent' : 'day_off';
    }

    await onSubmit(data);
    setLoading(false);
  };

  return (
    <div className="space-y-4 pt-4 overflow-y-auto pb-6" style={{ maxHeight: 'calc(85vh - 80px)' }}>
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
        <Label>Tipo de Registro</Label>
        <Select value={entryType} onValueChange={(v) => setEntryType(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Ponto Normal</SelectItem>
            <SelectItem value="folga">Folga</SelectItem>
            <SelectItem value="falta">Falta</SelectItem>
            <SelectItem value="atestado">Atestado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Data</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {!isAbsence && (
        <>
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
        </>
      )}

      <div>
        <Label>Observações</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." rows={2} />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !userId || (!isAbsence && (!checkInTime || !checkOutTime))}
        className="w-full h-12 rounded-xl"
      >
        {loading && <AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" />}
        Salvar Registro
      </Button>
    </div>
  );
}

// ---- Import Time Records Form ----
function ImportTimeRecordsForm({ unitId, onDone }: { unitId: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<'csv' | 'xls-grid' | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Extract date range from XLS header like "01-02-2026~28-02-2026"
  const extractDateRange = (sheet: XLSX.WorkSheet): { year: number; month: number } | null => {
    const range = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][];
    for (const row of range.slice(0, 5)) {
      if (!row) continue;
      for (const cell of row) {
        if (!cell) continue;
        const match = String(cell).match(/(\d{2})-(\d{2})-(\d{4})/);
        if (match) {
          return { month: parseInt(match[2]), year: parseInt(match[3]) };
        }
      }
    }
    return null;
  };

  // Parse XLS grid format (employee rows with day columns)
  const parseXlsGrid = useCallback(async (f: File) => {
    const buffer = await f.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][];

    const dateInfo = extractDateRange(sheet);
    if (!dateInfo) {
      toast.error('Não foi possível detectar o período (mês/ano) no arquivo');
      return [];
    }

    const records: any[] = [];
    let currentEmployee: string | null = null;
    let dayHeaderRow: number[] = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rawRow = rows[rowIdx];
      if (!rawRow || rawRow.length === 0) continue;

      // Use Array.from to handle sparse arrays from XLSX
      const rowStr = Array.from({ length: rawRow.length }, (_, i) => String(rawRow[i] ?? '').trim());

      // Detect employee name row: has "Nome:" followed by name
      const nomeIdx = rowStr.findIndex(c => c.toLowerCase().includes('nome:'));
      if (nomeIdx >= 0) {
        // Name is in the next non-empty cell after "Nome:"
        const nameCell = rowStr.slice(nomeIdx + 1).find(c => c && c.toLowerCase() !== 'dep.:' && !c.match(/^dep\d/i));
        if (nameCell) currentEmployee = nameCell.trim();
        continue;
      }

      // Detect day header row (1, 2, 3, ... 28/30/31)
      const numericCells = rowStr.filter(c => /^\d{1,2}$/.test(c)).map(Number);
      if (numericCells.length >= 20 && numericCells[0] === 1) {
        dayHeaderRow = [];
        for (let ci = 0; ci < rowStr.length; ci++) {
          const n = parseInt(rowStr[ci]);
          if (n >= 1 && n <= 31) dayHeaderRow.push(ci);
        }
        continue;
      }

      // If we have an employee and day headers, this row contains time data
      if (currentEmployee && dayHeaderRow.length > 0) {
        const hasTimeData = rowStr.some(c => /\d{1,2}:\d{2}/.test(c) || /FOLGA|FALTA|ATESTADO/i.test(c));
        if (!hasTimeData) continue;

        for (let di = 0; di < dayHeaderRow.length; di++) {
          const ci = dayHeaderRow[di];
          const cellValue = rowStr[ci];
          if (!cellValue) continue;

          const day = di + 1;
          const dateStr = `${dateInfo.year}-${String(dateInfo.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // Check for status keywords
          const upper = cellValue.toUpperCase().trim();
          if (['FOLGA', 'FALTA', 'ATESTADO'].includes(upper)) {
            records.push({ employee_name: currentEmployee, date: dateStr, check_in: null, check_out: null, status: upper });
            continue;
          }

          // Parse times from cell (can have multiple times separated by line breaks or spaces)
          const timeMatches = cellValue.match(/\d{1,2}[;:]\d{2}/g);
          if (timeMatches && timeMatches.length >= 1) {
            // Normalize semicolons to colons
            const times = timeMatches.map(t => t.replace(';', ':'));
            
            // Filter out times that look like midnight (00:xx) - these are often next-day check-outs
            // Sort times to get first check-in and last check-out
            const sorted = [...times].sort();
            
            // Simple heuristic: first time is check-in, last is check-out
            // If 3+ times, first is check-in, last is check-out (middle ones are breaks)
            const checkIn = sorted[0];
            const checkOut = sorted.length > 1 ? sorted[sorted.length - 1] : null;

            records.push({
              employee_name: currentEmployee,
              date: dateStr,
              check_in: checkIn,
              check_out: checkOut,
              status: null,
            });
          }
        }

        // Reset after processing time row (next row might be another employee)
        // Don't reset currentEmployee here - the day header row detection will handle transitions
        dayHeaderRow = [];
      }
    }

    return records;
  }, []);

  // Parse CSV format
  const parseCsv = useCallback(async (f: File) => {
    const text = await f.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const separator = lines[0]?.includes('\t') ? '\t' : lines[0]?.includes(';') ? ';' : ',';
    const headers = lines[0]?.split(separator).map(h => h.trim().toLowerCase());

    if (!headers) return [];

    const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('funcionario') || h.includes('employee'));
    const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));

    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(separator).map(c => c.trim());
      if (cols.length < 2) continue;

      const employeeName = nameIdx >= 0 ? cols[nameIdx] : cols[0];
      const dateStr = dateIdx >= 0 ? cols[dateIdx] : cols[1];
      let checkIn = cols[2] || null;
      let checkOut = cols[3] || null;
      let status = cols[4]?.toUpperCase() || null;

      if (['FOLGA', 'FALTA', 'ATESTADO'].includes(checkIn?.toUpperCase() || '')) {
        status = checkIn!.toUpperCase();
        checkIn = null;
        checkOut = null;
      }

      records.push({ employee_name: employeeName, date: dateStr, check_in: checkIn, check_out: checkOut, status });
    }
    return records;
  }, []);

  const parseFile = useCallback(async (f: File) => {
    setParsing(true);
    try {
      const isXls = /\.(xls|xlsx)$/i.test(f.name);

      let records: any[];
      if (isXls) {
        records = await parseXlsGrid(f);
        setDetectedFormat('xls-grid');
      } else {
        records = await parseCsv(f);
        setDetectedFormat('csv');
      }

      setParsedData(records);
      if (records.length === 0) {
        toast.error('Nenhum registro encontrado no arquivo');
      } else {
        toast.success(`${records.length} registros detectados`);
      }
    } catch (err) {
      console.error('Parse error:', err);
      toast.error('Erro ao processar arquivo');
    }
    setParsing(false);
  }, [parseXlsGrid, parseCsv]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setParsedData(null);
      setResult(null);
      setDetectedFormat(null);
      parseFile(f);
    }
  };

  const handleImport = async () => {
    if (!parsedData || !unitId) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-time-records', {
        body: { unit_id: unitId, records: parsedData },
      });

      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 403) {
          toast.error('Sem permissão para importar neste setor');
          return;
        }
        throw error;
      }

      setResult(data);
      toast.success(`${data.imported} registros importados`);
      if (data.imported > 0) {
        setTimeout(onDone, 1500);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err?.message || 'Erro ao importar registros');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 overflow-y-auto h-[calc(85vh-80px)] pb-6">
      <div className="rounded-xl bg-secondary/30 border border-border/20 p-4">
        <p className="text-sm text-muted-foreground">
          Formatos aceitos:
        </p>
        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5 list-disc pl-4">
          <li><strong className="text-foreground">XLS</strong> — Grade mensal (ponto eletrônico)</li>
          <li><strong className="text-foreground">CSV</strong> — Colunas: Nome, Data, Entrada, Saída, Status</li>
        </ul>
      </div>

      {/* Styled file upload area */}
      <div>
        <Label className="mb-1.5 block">Arquivo</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors",
            file
              ? "border-primary/40 bg-primary/5"
              : "border-border/60 bg-secondary/20 hover:bg-secondary/30"
          )}
        >
          {parsing ? (
            <>
              <AppIcon name="progress_activity" size={28} className="text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </>
          ) : file ? (
            <>
              <AppIcon name="FileSpreadsheet" size={28} className="text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              {detectedFormat && (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {detectedFormat === 'xls-grid' ? 'Grade Mensal (XLS)' : 'CSV'}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">Toque para trocar o arquivo</p>
            </>
          ) : (
            <>
              <AppIcon name="upload_file" size={28} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Escolher arquivo</p>
              <p className="text-xs text-muted-foreground mt-0.5">XLS, XLSX, CSV ou TXT</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx,.csv,.txt,.tsv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Preview table */}
      {parsedData && parsedData.length > 0 && (
        <>
          <div className="rounded-xl bg-card border border-border/40 max-h-60 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 sticky top-0 bg-card">
                  <th className="text-left p-2 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Data</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Entrada</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Saída</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-border/10">
                    <td className="p-2 truncate max-w-[100px]">{r.employee_name}</td>
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.check_in || '-'}</td>
                    <td className="p-2">{r.check_out || '-'}</td>
                    <td className="p-2">{r.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                +{parsedData.length - 50} registros...
              </p>
            )}
          </div>

          <Button onClick={handleImport} disabled={importing} className="w-full h-12 rounded-xl">
            {importing ? <AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" /> : <AppIcon name="upload" size={16} className="mr-2" />}
            Importar {parsedData.length} Registros
          </Button>
        </>
      )}

      {result && (
        <div className="rounded-xl bg-secondary/30 border border-border/20 p-4 space-y-2">
          <p className="text-sm font-medium">
            ✅ {result.imported} importados • ⏭ {result.skipped} ignorados
          </p>
          {result.errors.length > 0 && (
            <div className="text-xs text-destructive space-y-1 max-h-32 overflow-auto">
              {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Certificate Form (Employee) ----
function CertificateForm({ onSubmit }: { onSubmit: (data: any) => Promise<boolean> }) {
  const [dateStart, setDateStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateEnd, setDateEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhoto(f);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit({ date_start: dateStart, date_end: dateEnd, notes, photo: photo || undefined });
    setLoading(false);
  };

  return (
    <div className="space-y-4 pt-4 overflow-y-auto h-[calc(80vh-80px)]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Data Início *</Label>
          <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
        </div>
        <div>
          <Label>Data Fim *</Label>
          <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Foto do Atestado</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-secondary/20 p-6 cursor-pointer hover:bg-secondary/30 transition-colors"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Atestado" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <AppIcon name="Camera" size={32} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Tirar foto ou escolher da galeria</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: CID, médico, detalhes..." rows={2} />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 rounded-xl">
        {loading ? <AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" /> : <AppIcon name="send" size={16} className="mr-2" />}
        Enviar Atestado
      </Button>
    </div>
  );
}

// ---- Certificate List View (Admin) ----
function CertificateListView({
  certificates,
  onReview,
}: {
  certificates: MedicalCertificate[];
  onReview: (id: string, status: 'approved' | 'rejected') => Promise<boolean>;
}) {
  const [reviewing, setReviewing] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
  };
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  };

  if (certificates.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <AppIcon name="clinical_notes" size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhum atestado registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4 overflow-y-auto h-[calc(85vh-80px)]">
      {certificates.map(cert => (
        <div key={cert.id} className="rounded-xl bg-card border border-border/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{cert.profile?.full_name || 'Funcionário'}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(cert.date_start), 'dd/MM/yyyy')}
                {cert.date_start !== cert.date_end && ` → ${format(parseISO(cert.date_end), 'dd/MM/yyyy')}`}
                {' • '}{cert.days_count} dia{cert.days_count > 1 ? 's' : ''}
              </p>
            </div>
            <span className={cn('text-[10px] font-medium rounded-full px-2 py-0.5', statusColors[cert.status])}>
              {statusLabels[cert.status]}
            </span>
          </div>

          {cert.notes && <p className="text-xs text-muted-foreground">{cert.notes}</p>}

          {cert.document_url && (
            <a
              href={cert.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-primary hover:underline"
            >
              <AppIcon name="image" size={14} />
              Ver documento
            </a>
          )}

          {cert.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg h-9 text-success border-success/30 hover:bg-success/10"
                disabled={reviewing === cert.id}
                onClick={async () => {
                  setReviewing(cert.id);
                  await onReview(cert.id, 'approved');
                  setReviewing(null);
                }}
              >
                <AppIcon name="check" size={14} className="mr-1" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={reviewing === cert.id}
                onClick={async () => {
                  setReviewing(cert.id);
                  await onReview(cert.id, 'rejected');
                  setReviewing(null);
                }}
              >
                <AppIcon name="close" size={14} className="mr-1" />
                Rejeitar
              </Button>
            </div>
          )}
        </div>
      ))}
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
