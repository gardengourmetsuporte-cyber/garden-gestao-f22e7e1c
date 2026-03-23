import { useState } from 'react';
import { InternalManual } from './InternalManual';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
import { useEmployeeWarnings, WARNING_TYPE_LABELS, WARNING_TYPE_COLORS, SEVERITY_LABELS, CLT_REASONS } from '@/hooks/useEmployeeWarnings';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { useFabAction } from '@/contexts/FabActionContext';
import type { WarningType, WarningSeverity } from '@/types/employee';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── Infractions Data (compact) ─── */
const INFRACTIONS = [
  { title: 'Atrasos e Faltas', progression: 'Verbal → Escrita → Suspensão', icon: 'schedule' },
  { title: 'Insubordinação', progression: 'Escrita → Suspensão → Justa Causa', icon: 'mood_bad' },
  { title: 'Desídia / Negligência', progression: 'Verbal → Escrita', icon: 'no_food' },
  { title: 'Higiene e Segurança', progression: 'Escrita imediata → Suspensão', icon: 'clean_hands' },
  { title: 'Uso de Celular', progression: 'Verbal → Escrita → Suspensão', icon: 'phone_android' },
  { title: 'Embriaguez / Substâncias', progression: 'Suspensão → Justa Causa', icon: 'local_bar' },
];

export function EmployeeWarnings() {
  const { isAdmin } = useAuth();
  const { warnings, isLoading, addWarning, acknowledgeWarning, deleteWarning, getWarningCounts } = useEmployeeWarnings();
  const { employees, myEmployee } = useEmployees();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useFabAction(
    isAdmin ? { icon: 'add', label: 'Nova Advertência', onClick: () => setSheetOpen(true) } : null,
    [isAdmin]
  );

  // Form state
  const [form, setForm] = useState({
    employee_id: '',
    type: 'verbal' as WarningType,
    severity: 'light' as WarningSeverity,
    reason: '',
    legal_basis: '',
    description: '',
    date: new Date(),
    suspension_days: 0,
    witness_1: '',
    witness_2: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm({
      employee_id: '', type: 'verbal', severity: 'light', reason: '', legal_basis: '',
      description: '', date: new Date(), suspension_days: 0, witness_1: '', witness_2: '', notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.reason) {
      toast.error('Preencha o funcionário e o motivo');
      return;
    }
    setSubmitting(true);
    try {
      await addWarning({
        employee_id: form.employee_id,
        type: form.type,
        severity: form.severity,
        reason: form.reason,
        legal_basis: form.legal_basis || undefined,
        description: form.description || undefined,
        date: format(form.date, 'yyyy-MM-dd'),
        suspension_days: form.type === 'suspension' ? form.suspension_days : 0,
        witness_1: form.witness_1 || undefined,
        witness_2: form.witness_2 || undefined,
        notes: form.notes || undefined,
      });
      setSheetOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const visibleWarnings = warnings.filter(w => {
    if (!isAdmin) {
      if (!myEmployee || w.employee_id !== myEmployee.id) return false;
    }
    if (filterEmployee !== 'all' && w.employee_id !== filterEmployee) return false;
    if (filterType !== 'all' && w.type !== filterType) return false;
    return true;
  });

  // Group by employee for admin
  const grouped = isAdmin
    ? visibleWarnings.reduce((acc, w) => {
        const name = w.employee?.full_name || 'Sem nome';
        if (!acc[name]) acc[name] = [];
        acc[name].push(w);
        return acc;
      }, {} as Record<string, typeof visibleWarnings>)
    : { 'Minhas': visibleWarnings };

  if (isLoading) {
    return <div className="flex justify-center py-12"><AppIcon name="progress_activity" className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  // Stats summary
  const totalVerbal = warnings.filter(w => w.type === 'verbal').length;
  const totalWritten = warnings.filter(w => w.type === 'written').length;
  const totalSuspension = warnings.filter(w => w.type === 'suspension').length;
  const totalPending = warnings.filter(w => !w.employee_acknowledged).length;

  return (
    <div className="space-y-3">
      {/* Manual Card */}
      <InternalManual />

      {/* Stats (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Verbais', value: totalVerbal, color: 'text-foreground' },
            { label: 'Escritas', value: totalWritten, color: 'text-foreground' },
            { label: 'Suspensões', value: totalSuspension, color: 'text-foreground' },
            { label: 'Pendentes', value: totalPending, color: totalPending > 0 ? 'text-warning' : 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="bg-secondary/50 rounded-xl py-2.5 px-2 text-center">
              <p className={cn("text-lg font-extrabold tabular-nums", s.color)} style={{ letterSpacing: '-0.03em' }}>
                {s.value}
              </p>
              <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Infractions Guide — Collapsible */}
      <Collapsible className="group">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <AppIcon name="gavel" size={15} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-semibold text-foreground">Guia de Infrações</p>
                <p className="text-[10px] text-muted-foreground">CLT & Acordo Coletivo — {INFRACTIONS.length} tipos</p>
              </div>
            </div>
            <AppIcon name="ChevronDown" size={14} className="text-muted-foreground/40 transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 space-y-1">
            {INFRACTIONS.map((inf, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-secondary/30 rounded-xl px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <AppIcon name={inf.icon} size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground">{inf.title}</p>
                  <p className="text-[10px] text-muted-foreground">{inf.progression}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Filters (admin) */}
      {isAdmin && (
        <div className="flex gap-2">
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="flex-1 rounded-xl h-10 bg-secondary/50 border-0">
              <SelectValue placeholder="Funcionário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 rounded-xl h-10 bg-secondary/50 border-0">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="verbal">Verbal</SelectItem>
              <SelectItem value="written">Escrita</SelectItem>
              <SelectItem value="suspension">Suspensão</SelectItem>
              <SelectItem value="dismissal">Justa Causa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Warnings List */}
      {visibleWarnings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-secondary/30">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <AppIcon name="verified_user" size={28} className="text-primary/30" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Nenhuma advertência</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">Registros aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, items]) => (
            <div key={name} className="space-y-2">
              {isAdmin && (
                <div className="flex items-center gap-2 px-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {name}
                    <span className="ml-1.5 text-foreground">{items.length}</span>
                  </p>
                </div>
              )}
              {items.map(w => (
                <WarningCard
                  key={w.id}
                  warning={w}
                  isAdmin={isAdmin}
                  counts={getWarningCounts(w.employee_id)}
                  onAcknowledge={() => acknowledgeWarning(w.id)}
                  onDelete={() => {
                    if (confirm('Remover esta advertência?')) deleteWarning(w.id);
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* New Warning Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova Advertência</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="space-y-1.5">
              <Label>Funcionário *</Label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar funcionário" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.is_active).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as WarningType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="written">Escrita</SelectItem>
                    <SelectItem value="suspension">Suspensão</SelectItem>
                    <SelectItem value="dismissal">Justa Causa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gravidade</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as WarningSeverity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Leve</SelectItem>
                    <SelectItem value="moderate">Moderada</SelectItem>
                    <SelectItem value="serious">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === 'suspension' && (
              <div className="space-y-1.5">
                <Label>Dias de Suspensão</Label>
                <Input
                  type="number" min={1} max={30}
                  value={form.suspension_days}
                  onChange={e => setForm(f => ({ ...f, suspension_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Base Legal (CLT)</Label>
              <Select value={form.legal_basis} onValueChange={v => setForm(f => ({ ...f, legal_basis: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar artigo" /></SelectTrigger>
                <SelectContent>
                  {CLT_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <Input
                placeholder="Motivo da advertência"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Data da Ocorrência</Label>
              <DatePicker
                date={form.date}
                onSelect={d => setForm(f => ({ ...f, date: d }))}
                formatStr="dd/MM/yyyy"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição Detalhada</Label>
              <Textarea
                placeholder="Descreva o ocorrido..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Testemunha 1</Label>
                <Input placeholder="Nome" value={form.witness_1} onChange={e => setForm(f => ({ ...f, witness_1: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Testemunha 2</Label>
                <Input placeholder="Nome" value={form.witness_2} onChange={e => setForm(f => ({ ...f, witness_2: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações adicionais..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {form.employee_id && (() => {
              const counts = getWarningCounts(form.employee_id);
              if (counts.written >= 3 && form.type !== 'suspension' && form.type !== 'dismissal') {
                return (
                  <div className="rounded-xl bg-secondary/50 p-3 flex gap-2 items-start">
                    <AppIcon name="warning" size={16} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Este funcionário já possui {counts.written} advertência(s) escrita(s). Considere aplicar uma suspensão.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? 'Registrando...' : 'Registrar Advertência'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ─── Warning Card ─── */
function WarningCard({
  warning: w,
  isAdmin,
  counts,
  onAcknowledge,
  onDelete,
}: {
  warning: any;
  isAdmin: boolean;
  counts: { total: number };
  onAcknowledge: () => void;
  onDelete: () => void;
}) {
  const typeIcon = w.type === 'verbal' ? 'record_voice_over' : w.type === 'written' ? 'description' : w.type === 'suspension' ? 'block' : 'gavel';

  return (
    <div className="bg-card rounded-2xl p-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: w.severity === 'grave' || w.type === 'suspension' ? 'linear-gradient(135deg, #EF4444, #F472B6)' : w.severity === 'media' ? 'linear-gradient(135deg, #F59E0B, #F97316)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <AppIcon name={typeIcon} size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-foreground">{WARNING_TYPE_LABELS[w.type]}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-muted-foreground font-medium">
                {SEVERITY_LABELS[w.severity as WarningSeverity]}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{w.reason}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {format(new Date(w.date), 'dd/MM/yy')}
          </p>
          {w.employee_acknowledged ? (
            <div className="flex items-center gap-1 mt-0.5 justify-end">
              <AppIcon name="check_circle" size={10} className="text-primary" />
              <span className="text-[9px] text-primary font-medium">Ciente</span>
            </div>
          ) : (
            <span className="text-[9px] text-muted-foreground/60 font-medium">Pendente</span>
          )}
        </div>
      </div>

      {/* Details */}
      {w.description && (
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2 pl-[52px]">{w.description}</p>
      )}

      {w.type === 'suspension' && w.suspension_days > 0 && (
        <p className="text-[11px] text-muted-foreground pl-[52px]">
          Suspensão de <span className="font-bold text-foreground">{w.suspension_days} dia(s)</span>
        </p>
      )}

      {w.legal_basis && (
        <p className="text-[10px] text-muted-foreground/60 pl-[52px]">{w.legal_basis}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pl-[52px]">
        {!isAdmin && !w.employee_acknowledged && (
          <Button size="sm" variant="outline" className="text-xs gap-1 h-8 rounded-xl" onClick={onAcknowledge}>
            <AppIcon name="check_circle" size={14} />
            Ciente
          </Button>
        )}
        {w.witness_1 && (
          <span className="text-[10px] text-muted-foreground/50">
            Testemunhas: {w.witness_1}{w.witness_2 ? `, ${w.witness_2}` : ''}
          </span>
        )}
        {isAdmin && (
          <Button
            size="sm" variant="ghost"
            className="ml-auto text-destructive hover:text-destructive h-7 w-7 p-0 rounded-lg"
            onClick={onDelete}
          >
            <AppIcon name="delete" size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
