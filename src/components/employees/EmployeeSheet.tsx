import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useEmployees } from '@/hooks/useEmployees';
import { useUnit } from '@/contexts/UnitContext';
import { Employee } from '@/types/employee';
import { UserWithRole } from '@/hooks/useUsers';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DaySchedule {
  shift_start: string;
  shift_end: string;
  is_day_off: boolean;
}

const DEFAULT_DAY: DaySchedule = { shift_start: '08:00', shift_end: '17:00', is_day_off: false };

interface EmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  availableUsers: UserWithRole[];
}

interface FormData {
  full_name: string; cpf: string; role: string; department: string;
  admission_date: string; base_salary: number; is_active: boolean; notes: string; user_id: string;
  quick_pin: string; shift_start: string; shift_end: string;
}

export function EmployeeSheet({ open, onOpenChange, employee, availableUsers }: EmployeeSheetProps) {
  const { addEmployee, updateEmployee } = useEmployees();
  const { activeUnitId } = useUnit();
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY }))
  );
  const [usePerDay, setUsePerDay] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { full_name: '', cpf: '', role: '', department: '', admission_date: '', base_salary: 0, is_active: true, notes: '', user_id: '', quick_pin: '', shift_start: '08:00', shift_end: '17:00' },
  });

  const selectedUserId = watch('user_id');

  // Load per-day schedules when editing
  useEffect(() => {
    if (employee) {
      reset({ full_name: employee.full_name, cpf: employee.cpf || '', role: employee.role || '', department: employee.department || '', admission_date: employee.admission_date || '', base_salary: employee.base_salary, is_active: employee.is_active, notes: employee.notes || '', user_id: employee.user_id || '', quick_pin: (employee as any).quick_pin || '', shift_start: employee.shift_start || '08:00', shift_end: employee.shift_end || '17:00' });

      // Fetch per-day schedules
      supabase
        .from('employee_schedules' as any)
        .select('*')
        .eq('employee_id', employee.id)
        .order('day_of_week')
        .then(({ data }) => {
          const rows = (data || []) as any[];
          if (rows.length > 0) {
            setUsePerDay(true);
            const schedule = Array.from({ length: 7 }, (_, i) => {
              const row = rows.find((r: any) => r.day_of_week === i);
              return row
                ? { shift_start: row.shift_start, shift_end: row.shift_end, is_day_off: row.is_day_off }
                : { shift_start: employee.shift_start || '08:00', shift_end: employee.shift_end || '17:00', is_day_off: false };
            });
            setWeekSchedule(schedule);
          } else {
            setUsePerDay(false);
            setWeekSchedule(Array.from({ length: 7 }, () => ({
              shift_start: employee.shift_start || '08:00',
              shift_end: employee.shift_end || '17:00',
              is_day_off: false,
            })));
          }
        });
    } else {
      reset({ full_name: '', cpf: '', role: '', department: '', admission_date: '', base_salary: 0, is_active: true, notes: '', user_id: '', quick_pin: '', shift_start: '08:00', shift_end: '17:00' });
      setUsePerDay(false);
      setWeekSchedule(Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })));
    }
  }, [employee, reset]);

  useEffect(() => {
    if (selectedUserId && !employee) {
      const user = availableUsers.find(u => u.user_id === selectedUserId);
      if (user) setValue('full_name', user.full_name);
    }
  }, [selectedUserId, availableUsers, setValue, employee]);

  const updateDay = useCallback((dayIndex: number, field: keyof DaySchedule, value: any) => {
    setWeekSchedule(prev => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], [field]: value };
      return next;
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { full_name: data.full_name, cpf: data.cpf || null, role: data.role || null, department: data.department || null, admission_date: data.admission_date || null, base_salary: data.base_salary, is_active: data.is_active, notes: data.notes || null, user_id: data.user_id || null, unit_id: activeUnitId || null, quick_pin: data.quick_pin || null, shift_start: data.shift_start || '08:00', shift_end: data.shift_end || '17:00' };

      let empId: string;
      if (employee) {
        await updateEmployee({ id: employee.id, ...payload });
        empId = employee.id;
      } else {
        const result = await addEmployee(payload);
        empId = (result as any)?.id;
        if (!empId) { onOpenChange(false); return; }
      }

      // Save per-day schedules
      if (usePerDay && empId) {
        // Delete existing
        await supabase.from('employee_schedules' as any).delete().eq('employee_id', empId);
        // Insert all 7 days
        const rows = weekSchedule.map((day, i) => ({
          employee_id: empId,
          day_of_week: i,
          shift_start: day.shift_start,
          shift_end: day.shift_end,
          is_day_off: day.is_day_off,
        }));
        await supabase.from('employee_schedules' as any).insert(rows);
      } else if (!usePerDay && employee) {
        // Remove per-day schedules if toggled off
        await supabase.from('employee_schedules' as any).delete().eq('employee_id', employee.id);
      }

      onOpenChange(false);
    } catch { /* Error handled in hook */ }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="User" size={20} />
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AppIcon name="Link2" size={16} />
              Vincular a usuário do sistema
            </Label>
            <Select value={selectedUserId} onValueChange={(value) => setValue('user_id', value === 'none' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Selecione um usuário (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (cadastro avulso)</SelectItem>
                {availableUsers.map((user) => (<SelectItem key={user.user_id} value={user.user_id}>{user.full_name}</SelectItem>))}
                {employee?.user_id && !availableUsers.some(u => u.user_id === employee.user_id) && (<SelectItem value={employee.user_id} disabled>(Usuário atual vinculado)</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Vincular permite que o funcionário veja seus holerites no app</p>
          </div>
          <div className="space-y-2"><Label htmlFor="full_name">Nome completo *</Label><Input id="full_name" {...register('full_name', { required: true })} placeholder="Nome do funcionário" /></div>
          <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" /></div>
          <div className="space-y-2"><Label htmlFor="role">Cargo</Label><Input id="role" {...register('role')} placeholder="Ex: Atendente, Cozinheiro" /></div>
          <div className="space-y-2"><Label htmlFor="department">Departamento</Label><Input id="department" {...register('department')} placeholder="Ex: Cozinha, Salão" /></div>
          <div className="space-y-2"><Label htmlFor="admission_date">Data de admissão</Label><Input id="admission_date" type="date" {...register('admission_date')} /></div>
          <div className="space-y-2"><Label htmlFor="base_salary">Salário base</Label><Input id="base_salary" type="number" step="0.01" min="0" {...register('base_salary', { valueAsNumber: true })} placeholder="0,00" /></div>

          {/* Shift / Schedule Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <AppIcon name="schedule" size={16} className="text-primary" />
                Turno de trabalho
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Por dia</span>
                <Switch checked={usePerDay} onCheckedChange={setUsePerDay} />
              </div>
            </div>

            {!usePerDay ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="shift_start" className="text-xs text-muted-foreground">Entrada</Label>
                    <Input id="shift_start" type="time" {...register('shift_start')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="shift_end" className="text-xs text-muted-foreground">Saída</Label>
                    <Input id="shift_end" type="time" {...register('shift_end')} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Horário esperado para cálculo de pontualidade no ponto</p>
              </>
            ) : (
              <div className="space-y-2">
                {weekSchedule.map((day, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-muted-foreground">{DAY_LABELS[i]}</span>
                    {day.is_day_off ? (
                      <span className="flex-1 text-xs text-muted-foreground italic text-center">Folga</span>
                    ) : (
                      <>
                        <Input
                          type="time"
                          value={day.shift_start}
                          onChange={(e) => updateDay(i, 'shift_start', e.target.value)}
                          className="flex-1 h-8 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                          type="time"
                          value={day.shift_end}
                          onChange={(e) => updateDay(i, 'shift_end', e.target.value)}
                          className="flex-1 h-8 text-xs"
                        />
                      </>
                    )}
                    <Switch
                      checked={day.is_day_off}
                      onCheckedChange={(v) => updateDay(i, 'is_day_off', v)}
                      className="scale-75"
                    />
                    <span className="text-[10px] text-muted-foreground w-8">{day.is_day_off ? 'Folga' : ''}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Ative o toggle para marcar folga no dia</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2"><Label htmlFor="is_active">Funcionário ativo</Label><Switch id="is_active" checked={watch('is_active')} onCheckedChange={(checked) => setValue('is_active', checked)} /></div>
          <div className="space-y-2">
            <Label htmlFor="quick_pin" className="flex items-center gap-2">
              <AppIcon name="Lock" size={16} className="text-primary" />
              PIN rápido (4 dígitos)
            </Label>
            <Input id="quick_pin" {...register('quick_pin', { pattern: /^\d{0,4}$/ })} placeholder="Ex: 1234" maxLength={4} inputMode="numeric" />
            <p className="text-xs text-muted-foreground">Usado para identificação rápida no modo timer do checklist</p>
          </div>
          <div className="space-y-2"><Label htmlFor="notes">Observações</Label><Textarea id="notes" {...register('notes')} placeholder="Anotações sobre o funcionário..." rows={3} /></div>
          <LoadingButton type="submit" className="w-full" loading={isSubmitting} loadingText="Salvando...">{employee ? 'Salvar alterações' : 'Cadastrar'}</LoadingButton>
        </form>
      </SheetContent>
    </Sheet>
  );
}
