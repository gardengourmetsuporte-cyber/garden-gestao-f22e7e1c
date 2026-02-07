import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types/employee';
import { UserWithRole } from '@/hooks/useUsers';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Link } from 'lucide-react';

interface EmployeeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  availableUsers: UserWithRole[];
}

interface FormData {
  full_name: string;
  cpf: string;
  role: string;
  department: string;
  admission_date: string;
  base_salary: number;
  is_active: boolean;
  notes: string;
  user_id: string;
}

export function EmployeeSheet({ open, onOpenChange, employee, availableUsers }: EmployeeSheetProps) {
  const { addEmployee, updateEmployee } = useEmployees();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      full_name: '',
      cpf: '',
      role: '',
      department: '',
      admission_date: '',
      base_salary: 0,
      is_active: true,
      notes: '',
      user_id: '',
    },
  });

  const selectedUserId = watch('user_id');

  useEffect(() => {
    if (employee) {
      reset({
        full_name: employee.full_name,
        cpf: employee.cpf || '',
        role: employee.role || '',
        department: employee.department || '',
        admission_date: employee.admission_date || '',
        base_salary: employee.base_salary,
        is_active: employee.is_active,
        notes: employee.notes || '',
        user_id: employee.user_id || '',
      });
    } else {
      reset({
        full_name: '',
        cpf: '',
        role: '',
        department: '',
        admission_date: '',
        base_salary: 0,
        is_active: true,
        notes: '',
        user_id: '',
      });
    }
  }, [employee, reset]);

  // Auto-fill name when selecting a user
  useEffect(() => {
    if (selectedUserId && !employee) {
      const user = availableUsers.find(u => u.user_id === selectedUserId);
      if (user) {
        setValue('full_name', user.full_name);
      }
    }
  }, [selectedUserId, availableUsers, setValue, employee]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        full_name: data.full_name,
        cpf: data.cpf || null,
        role: data.role || null,
        department: data.department || null,
        admission_date: data.admission_date || null,
        base_salary: data.base_salary,
        is_active: data.is_active,
        notes: data.notes || null,
        user_id: data.user_id || null,
      };

      if (employee) {
        await updateEmployee({ id: employee.id, ...payload });
      } else {
        await addEmployee(payload);
      }
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Link to User */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Vincular a usuário do sistema
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => setValue('user_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (cadastro avulso)</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name}
                  </SelectItem>
                ))}
                {employee?.user_id && !availableUsers.some(u => u.user_id === employee.user_id) && (
                  <SelectItem value={employee.user_id} disabled>
                    (Usuário atual vinculado)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincular permite que o funcionário veja seus holerites no app
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: true })}
              placeholder="Nome do funcionário"
            />
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...register('cpf')}
              placeholder="000.000.000-00"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="Ex: Atendente, Cozinheiro"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              {...register('department')}
              placeholder="Ex: Cozinha, Salão"
            />
          </div>

          {/* Admission Date */}
          <div className="space-y-2">
            <Label htmlFor="admission_date">Data de admissão</Label>
            <Input
              id="admission_date"
              type="date"
              {...register('admission_date')}
            />
          </div>

          {/* Base Salary */}
          <div className="space-y-2">
            <Label htmlFor="base_salary">Salário base</Label>
            <Input
              id="base_salary"
              type="number"
              step="0.01"
              min="0"
              {...register('base_salary', { valueAsNumber: true })}
              placeholder="0,00"
            />
          </div>

          {/* Active */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="is_active">Funcionário ativo</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Anotações sobre o funcionário..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : employee ? 'Salvar alterações' : 'Cadastrar'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
