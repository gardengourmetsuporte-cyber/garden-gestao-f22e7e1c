import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DatePicker } from '@/components/ui/date-picker';
import { useEmployeeWarnings, WARNING_TYPE_LABELS, WARNING_TYPE_COLORS, SEVERITY_LABELS, CLT_REASONS } from '@/hooks/useEmployeeWarnings';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import type { WarningType, WarningSeverity } from '@/types/employee';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function EmployeeWarnings() {
  const { isAdmin } = useAuth();
  const { warnings, isLoading, addWarning, acknowledgeWarning, deleteWarning, getWarningCounts } = useEmployeeWarnings();
  const { employees, myEmployee } = useEmployees();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

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
      employee_id: '',
      type: 'verbal',
      severity: 'light',
      reason: '',
      legal_basis: '',
      description: '',
      date: new Date(),
      suspension_days: 0,
      witness_1: '',
      witness_2: '',
      notes: '',
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

  // Filter warnings
  const visibleWarnings = warnings.filter(w => {
    if (!isAdmin) {
      // Employee sees only own
      if (!myEmployee || w.employee_id !== myEmployee.id) return false;
    }
    if (filterEmployee !== 'all' && w.employee_id !== filterEmployee) return false;
    if (filterType !== 'all' && w.type !== filterType) return false;
    return true;
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><AppIcon name="Loader2" className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Advertências</h2>
        {isAdmin && (
          <Button size="sm" onClick={() => setSheetOpen(true)} className="gap-1.5">
            <AppIcon name="Plus" size={16} />
            Nova Advertência
          </Button>
        )}
      </div>

      {/* Filters (admin only) */}
      {isAdmin && (
        <div className="flex gap-2">
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="flex-1 h-10">
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
            <SelectTrigger className="w-40 h-10">
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

      {/* Warnings list */}
      {visibleWarnings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="ShieldCheck" size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma advertência registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleWarnings.map(w => {
            const counts = getWarningCounts(w.employee_id);
            return (
              <Card key={w.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('text-xs border', WARNING_TYPE_COLORS[w.type])}>
                          {WARNING_TYPE_LABELS[w.type]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {SEVERITY_LABELS[w.severity as WarningSeverity]}
                        </Badge>
                        {w.employee_acknowledged ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <AppIcon name="CheckCircle2" size={12} /> Ciente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                            Pendente ciência
                          </Badge>
                        )}
                      </div>
                      {isAdmin && w.employee && (
                        <p className="text-sm font-semibold mt-1.5">{w.employee.full_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{w.reason}</p>
                      {w.legal_basis && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{w.legal_basis}</p>
                      )}
                      {w.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.description}</p>
                      )}
                      {w.type === 'suspension' && w.suspension_days > 0 && (
                        <p className="text-xs text-red-400 mt-1">Suspensão de {w.suspension_days} dia(s)</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{format(new Date(w.date), "dd/MM/yyyy")}</p>
                      {isAdmin && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {counts.total} advertência(s)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isAdmin && !w.employee_acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => acknowledgeWarning(w.id)}
                      >
                        <AppIcon name="CheckCircle2" size={14} />
                        Registrar Ciência
                      </Button>
                    )}
                    {w.witness_1 && (
                      <span className="text-[10px] text-muted-foreground">
                        Testemunhas: {w.witness_1}{w.witness_2 ? `, ${w.witness_2}` : ''}
                      </span>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto text-destructive hover:text-destructive h-7 w-7 p-0"
                        onClick={() => {
                          if (confirm('Remover esta advertência?')) deleteWarning(w.id);
                        }}
                      >
                        <AppIcon name="Trash2" size={14} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Warning Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova Advertência</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            {/* Employee */}
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

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as WarningType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal">Advertência Verbal</SelectItem>
                  <SelectItem value="written">Advertência Escrita</SelectItem>
                  <SelectItem value="suspension">Suspensão</SelectItem>
                  <SelectItem value="dismissal">Demissão por Justa Causa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suspension days */}
            {form.type === 'suspension' && (
              <div className="space-y-1.5">
                <Label>Dias de Suspensão</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.suspension_days}
                  onChange={e => setForm(f => ({ ...f, suspension_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}

            {/* Severity */}
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

            {/* Legal basis */}
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

            {/* Reason */}
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <Input
                placeholder="Motivo da advertência"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label>Data da Ocorrência</Label>
              <DatePicker
                date={form.date}
                onSelect={d => setForm(f => ({ ...f, date: d }))}
                formatStr="dd/MM/yyyy"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Descrição Detalhada</Label>
              <Textarea
                placeholder="Descreva o ocorrido em detalhes..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Witnesses */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Testemunha 1</Label>
                <Input
                  placeholder="Nome"
                  value={form.witness_1}
                  onChange={e => setForm(f => ({ ...f, witness_1: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Testemunha 2</Label>
                <Input
                  placeholder="Nome"
                  value={form.witness_2}
                  onChange={e => setForm(f => ({ ...f, witness_2: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações adicionais..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Progression alert */}
            {form.employee_id && (() => {
              const counts = getWarningCounts(form.employee_id);
              if (counts.written >= 3 && form.type !== 'suspension' && form.type !== 'dismissal') {
                return (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex gap-2 items-start">
                    <AppIcon name="AlertTriangle" size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">
                      Este funcionário já possui {counts.written} advertência(s) escrita(s). Considere aplicar uma suspensão conforme progressão disciplinar da CLT.
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
