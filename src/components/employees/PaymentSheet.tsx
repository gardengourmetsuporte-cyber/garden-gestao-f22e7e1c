import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useEmployeePayments } from '@/hooks/useEmployees';
import { Employee, EmployeePayment, PaymentType, PAYMENT_TYPE_LABELS, MONTHS } from '@/types/employee';
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
import { DollarSign } from 'lucide-react';

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  payment: EmployeePayment | null;
}

interface FormData {
  type: PaymentType;
  reference_month: number;
  reference_year: number;
  amount: number;
  payment_date: string;
  is_paid: boolean;
  notes: string;
}

export function PaymentSheet({ open, onOpenChange, employee, payment }: PaymentSheetProps) {
  const { addPayment, updatePayment } = useEmployeePayments(employee.id);
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      type: 'salary',
      reference_month: currentMonth,
      reference_year: currentYear,
      amount: employee.base_salary,
      payment_date: '',
      is_paid: false,
      notes: '',
    },
  });

  const selectedType = watch('type');
  const selectedMonth = watch('reference_month');
  const selectedYear = watch('reference_year');

  useEffect(() => {
    if (payment) {
      reset({
        type: payment.type as PaymentType,
        reference_month: payment.reference_month,
        reference_year: payment.reference_year,
        amount: payment.amount,
        payment_date: payment.payment_date,
        is_paid: payment.is_paid,
        notes: payment.notes || '',
      });
    } else {
      // Set default payment date based on type
      const defaultDate = getDefaultPaymentDate(selectedType, selectedMonth, selectedYear);
      reset({
        type: 'salary',
        reference_month: currentMonth,
        reference_year: currentYear,
        amount: employee.base_salary,
        payment_date: defaultDate,
        is_paid: false,
        notes: '',
      });
    }
  }, [payment, reset, employee.base_salary, currentMonth, currentYear]);

  // Update payment date when type changes
  useEffect(() => {
    if (!payment) {
      const defaultDate = getDefaultPaymentDate(selectedType, selectedMonth, selectedYear);
      setValue('payment_date', defaultDate);
      
      // Update amount for vale (usually half)
      if (selectedType === 'vale') {
        setValue('amount', Math.round(employee.base_salary * 0.4 * 100) / 100);
      } else if (selectedType === 'salary') {
        setValue('amount', employee.base_salary);
      }
    }
  }, [selectedType, selectedMonth, selectedYear, setValue, payment, employee.base_salary]);

  function getDefaultPaymentDate(type: PaymentType, month: number, year: number): string {
    // Salary: day 5 of next month
    // Vale: day 20 of current month
    if (type === 'salary') {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      return `${nextYear}-${String(nextMonth).padStart(2, '0')}-05`;
    } else if (type === 'vale') {
      return `${year}-${String(month).padStart(2, '0')}-20`;
    }
    return '';
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (payment) {
        await updatePayment({
          id: payment.id,
          type: data.type,
          reference_month: data.reference_month,
          reference_year: data.reference_year,
          amount: data.amount,
          payment_date: data.payment_date,
          is_paid: data.is_paid,
          notes: data.notes || null,
        });
      } else {
        await addPayment({
          employee_id: employee.id,
          type: data.type,
          reference_month: data.reference_month,
          reference_year: data.reference_year,
          amount: data.amount,
          payment_date: data.payment_date,
          is_paid: data.is_paid,
          notes: data.notes || undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {payment ? 'Editar Pagamento' : 'Novo Pagamento'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo de pagamento *</Label>
            <Select
              value={selectedType}
              onValueChange={(value: PaymentType) => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {PAYMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Month/Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mês referência *</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(value) => setValue('reference_month', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano referência *</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setValue('reference_year', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { required: true, valueAsNumber: true })}
              placeholder="0,00"
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="payment_date">Data do pagamento *</Label>
            <Input
              id="payment_date"
              type="date"
              {...register('payment_date', { required: true })}
            />
            <p className="text-xs text-muted-foreground">
              {selectedType === 'salary' 
                ? 'Salário: geralmente dia 5 do mês seguinte' 
                : selectedType === 'vale' 
                ? 'Vale: geralmente dia 20 do mês' 
                : ''}
            </p>
          </div>

          {/* Is Paid */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="is_paid">Já foi pago?</Label>
            <Switch
              id="is_paid"
              checked={watch('is_paid')}
              onCheckedChange={(checked) => setValue('is_paid', checked)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Detalhes adicionais..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : payment ? 'Salvar alterações' : 'Registrar pagamento'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
