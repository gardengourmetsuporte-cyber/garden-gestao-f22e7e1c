import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Employee, EmployeePayment, MONTHS } from '@/types/employee';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, Trash2, Plus, Minus } from 'lucide-react';

interface PayslipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  editingPayment?: EmployeePayment | null;
  onSave: (data: any) => Promise<void>;
  onUpdate?: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function PayslipSheet({
  open,
  onOpenChange,
  employee,
  editingPayment,
  onSave,
  onUpdate,
  onDelete,
}: PayslipSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [referenceMonth, setReferenceMonth] = useState(new Date().getMonth() + 1);
  const [referenceYear, setReferenceYear] = useState(new Date().getFullYear());
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Earnings
  const [baseSalary, setBaseSalary] = useState('');
  const [regularHours, setRegularHours] = useState('');
  const [nightHours, setNightHours] = useState('');
  const [nightBonus, setNightBonus] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeBonus, setOvertimeBonus] = useState('');
  const [mealAllowance, setMealAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [otherEarnings, setOtherEarnings] = useState('');
  const [otherEarningsDesc, setOtherEarningsDesc] = useState('');

  // Deductions
  const [inssDeduction, setInssDeduction] = useState('');
  const [irrfDeduction, setIrrfDeduction] = useState('');
  const [advanceDeduction, setAdvanceDeduction] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [otherDeductionsDesc, setOtherDeductionsDesc] = useState('');

  // FGTS
  const [fgtsAmount, setFgtsAmount] = useState('');

  useEffect(() => {
    if (open) {
      if (editingPayment) {
        setReferenceMonth(editingPayment.reference_month);
        setReferenceYear(editingPayment.reference_year);
        setPaymentDate(new Date(editingPayment.payment_date));
        setBaseSalary(String(editingPayment.base_salary || ''));
        setRegularHours(String(editingPayment.regular_hours || ''));
        setNightHours(String(editingPayment.night_hours || ''));
        setNightBonus(String(editingPayment.night_bonus || ''));
        setOvertimeHours(String(editingPayment.overtime_hours || ''));
        setOvertimeBonus(String(editingPayment.overtime_bonus || ''));
        setMealAllowance(String(editingPayment.meal_allowance || ''));
        setTransportAllowance(String(editingPayment.transport_allowance || ''));
        setOtherEarnings(String(editingPayment.other_earnings || ''));
        setOtherEarningsDesc(editingPayment.other_earnings_description || '');
        setInssDeduction(String(editingPayment.inss_deduction || ''));
        setIrrfDeduction(String(editingPayment.irrf_deduction || ''));
        setAdvanceDeduction(String(editingPayment.advance_deduction || ''));
        setOtherDeductions(String(editingPayment.other_deductions || ''));
        setOtherDeductionsDesc(editingPayment.other_deductions_description || '');
        setFgtsAmount(String(editingPayment.fgts_amount || ''));
      } else {
        // Reset with employee base salary
        setReferenceMonth(new Date().getMonth() + 1);
        setReferenceYear(new Date().getFullYear());
        setPaymentDate(new Date());
        setBaseSalary(employee?.base_salary ? String(employee.base_salary) : '');
        setRegularHours('');
        setNightHours('');
        setNightBonus('');
        setOvertimeHours('');
        setOvertimeBonus('');
        setMealAllowance('');
        setTransportAllowance('');
        setOtherEarnings('');
        setOtherEarningsDesc('');
        setInssDeduction('');
        setIrrfDeduction('');
        setAdvanceDeduction('');
        setOtherDeductions('');
        setOtherDeductionsDesc('');
        setFgtsAmount('');
      }
    }
  }, [open, editingPayment, employee]);

  // Calculate totals
  const totalEarnings = 
    (parseFloat(baseSalary) || 0) +
    (parseFloat(nightBonus) || 0) +
    (parseFloat(overtimeBonus) || 0) +
    (parseFloat(mealAllowance) || 0) +
    (parseFloat(transportAllowance) || 0) +
    (parseFloat(otherEarnings) || 0);

  const totalDeductions = 
    (parseFloat(inssDeduction) || 0) +
    (parseFloat(irrfDeduction) || 0) +
    (parseFloat(advanceDeduction) || 0) +
    (parseFloat(otherDeductions) || 0);

  const netSalary = totalEarnings - totalDeductions;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSave = async () => {
    if (!employee) return;

    setIsLoading(true);
    try {
      const data = {
        employee_id: employee.id,
        type: 'salary' as const,
        reference_month: referenceMonth,
        reference_year: referenceYear,
        payment_date: format(paymentDate, 'yyyy-MM-dd'),
        amount: netSalary,
        base_salary: parseFloat(baseSalary) || 0,
        regular_hours: parseFloat(regularHours) || 0,
        night_hours: parseFloat(nightHours) || 0,
        night_bonus: parseFloat(nightBonus) || 0,
        overtime_hours: parseFloat(overtimeHours) || 0,
        overtime_bonus: parseFloat(overtimeBonus) || 0,
        meal_allowance: parseFloat(mealAllowance) || 0,
        transport_allowance: parseFloat(transportAllowance) || 0,
        other_earnings: parseFloat(otherEarnings) || 0,
        other_earnings_description: otherEarningsDesc || null,
        inss_deduction: parseFloat(inssDeduction) || 0,
        irrf_deduction: parseFloat(irrfDeduction) || 0,
        advance_deduction: parseFloat(advanceDeduction) || 0,
        other_deductions: parseFloat(otherDeductions) || 0,
        other_deductions_description: otherDeductionsDesc || null,
        total_earnings: totalEarnings,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        fgts_amount: parseFloat(fgtsAmount) || 0,
        is_paid: false,
      };

      if (editingPayment && onUpdate) {
        await onUpdate({ id: editingPayment.id, ...data });
      } else {
        await onSave(data);
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingPayment || !onDelete) return;
    setIsLoading(true);
    await onDelete(editingPayment.id);
    setIsLoading(false);
    onOpenChange(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {editingPayment ? 'Editar Holerite' : 'Novo Holerite'}
            {employee && <span className="text-muted-foreground font-normal"> - {employee.full_name}</span>}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Reference Period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mês Referência</Label>
              <Select value={String(referenceMonth)} onValueChange={(v) => setReferenceMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={String(referenceYear)} onValueChange={(v) => setReferenceYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Data de Pagamento</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(paymentDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(d) => {
                    if (d) setPaymentDate(d);
                    setShowCalendar(false);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Earnings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-success" />
              <h3 className="font-semibold text-success">Proventos</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Salário Base</Label>
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horas Normais</Label>
                <Input
                  type="number"
                  value={regularHours}
                  onChange={(e) => setRegularHours(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Horas Noturnas</Label>
                <Input
                  type="number"
                  value={nightHours}
                  onChange={(e) => setNightHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Adicional Noturno (R$)</Label>
                <Input
                  type="number"
                  value={nightBonus}
                  onChange={(e) => setNightBonus(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Horas Extras</Label>
                <Input
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Adicional H.E. (R$)</Label>
                <Input
                  type="number"
                  value={overtimeBonus}
                  onChange={(e) => setOvertimeBonus(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Vale Alimentação</Label>
                <Input
                  type="number"
                  value={mealAllowance}
                  onChange={(e) => setMealAllowance(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vale Transporte</Label>
                <Input
                  type="number"
                  value={transportAllowance}
                  onChange={(e) => setTransportAllowance(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Outros Proventos</Label>
                <Input
                  type="number"
                  value={otherEarnings}
                  onChange={(e) => setOtherEarnings(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={otherEarningsDesc}
                  onChange={(e) => setOtherEarningsDesc(e.target.value)}
                  placeholder="Ex: Comissão"
                />
              </div>
            </div>

            <div className="p-3 bg-success/10 rounded-lg flex justify-between items-center">
              <span className="font-medium text-success">Total Proventos</span>
              <span className="font-bold text-success">{formatCurrency(totalEarnings)}</span>
            </div>
          </div>

          <Separator />

          {/* Deductions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-rose-500" />
              <h3 className="font-semibold text-rose-600">Descontos</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">INSS</Label>
                <Input
                  type="number"
                  value={inssDeduction}
                  onChange={(e) => setInssDeduction(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">IRRF</Label>
                <Input
                  type="number"
                  value={irrfDeduction}
                  onChange={(e) => setIrrfDeduction(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Adiantamento/Vale</Label>
                <Input
                  type="number"
                  value={advanceDeduction}
                  onChange={(e) => setAdvanceDeduction(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Outros Descontos</Label>
                <Input
                  type="number"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            {parseFloat(otherDeductions) > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Descrição do Desconto</Label>
                <Input
                  value={otherDeductionsDesc}
                  onChange={(e) => setOtherDeductionsDesc(e.target.value)}
                  placeholder="Ex: Falta, Atraso"
                />
              </div>
            )}

            <div className="p-3 bg-rose-500/10 rounded-lg flex justify-between items-center">
              <span className="font-medium text-rose-600">Total Descontos</span>
              <span className="font-bold text-rose-600">{formatCurrency(totalDeductions)}</span>
            </div>
          </div>

          <Separator />

          {/* FGTS */}
          <div className="space-y-2">
            <Label>FGTS (8%)</Label>
            <Input
              type="number"
              value={fgtsAmount}
              onChange={(e) => setFgtsAmount(e.target.value)}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">Valor depositado na conta do FGTS</p>
          </div>

          {/* Net Salary */}
          <div className="p-4 bg-primary/10 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Salário Líquido</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(netSalary)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {editingPayment && onDelete && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isLoading}
                className="w-14"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || totalEarnings <= 0}
              className="flex-1 h-12"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Holerite'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
