import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmployeePayments } from '@/hooks/useEmployees';
import { Employee, EmployeePayment, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS, MONTHS } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { PaymentSheet } from './PaymentSheet';
import { PayslipSheet } from './PayslipSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FinanceAccount {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
}

interface EmployeePaymentsProps {
  employee: Employee;
  onBack: () => void;
}

export function EmployeePayments({ employee, onBack }: EmployeePaymentsProps) {
  const { payments, isLoading, addPayment, updatePayment, deletePayment, markAsPaidWithTransaction } = useEmployeePayments(employee.id);
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [payslipSheetOpen, setPayslipSheetOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<EmployeePayment | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<EmployeePayment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payDialog, setPayDialog] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function fetchAccounts() {
      if (!user) return;
      const { data } = await supabase
        .from('finance_accounts')
        .select('id, name, balance, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at');
      setAccounts((data || []) as FinanceAccount[]);
    }
    fetchAccounts();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleEdit = (payment: EmployeePayment) => {
    if (payment.type === 'salary' && payment.total_earnings > 0) {
      setEditingPayslip(payment);
      setPayslipSheetOpen(true);
    } else {
      setEditingPayment(payment);
      setSheetOpen(true);
    }
  };

  const handleDelete = async () => {
    if (deleteId) { await deletePayment(deleteId); setDeleteId(null); }
  };

  const handlePay = async () => {
    if (payDialog.paymentId && selectedAccountId) {
      setIsPaying(true);
      try {
        await markAsPaidWithTransaction({ paymentId: payDialog.paymentId, accountId: selectedAccountId });
        setPayDialog({ open: false, paymentId: null });
        setSelectedAccountId('');
      } finally { setIsPaying(false); }
    }
  };

  const groupedPayments = payments.reduce((acc, payment) => {
    const key = `${payment.reference_year}-${payment.reference_month}`;
    if (!acc[key]) acc[key] = { year: payment.reference_year, month: payment.reference_month, payments: [] };
    acc[key].payments.push(payment);
    return acc;
  }, {} as Record<string, { year: number; month: number; payments: typeof payments }>);

  const sortedGroups = Object.values(groupedPayments).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  if (isLoading) {
    return (<div className="flex items-center justify-center py-12"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <AppIcon name="ArrowLeft" size={20} />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">{employee.full_name}</h2>
          <p className="text-sm text-muted-foreground">{employee.role || 'Funcionário'} • {formatCurrency(employee.base_salary)}/mês</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingPayment(null); setSheetOpen(true); }}>
            <AppIcon name="Plus" size={16} className="mr-2" />Vale/Bônus
          </Button>
          <Button onClick={() => { setEditingPayslip(null); setPayslipSheetOpen(true); }}>
            <AppIcon name="FileText" size={16} className="mr-2" />Holerite
          </Button>
        </div>
      </div>

      {sortedGroups.map((group) => (
        <div key={`${group.year}-${group.month}`} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">{MONTHS[group.month - 1]} {group.year}</h3>
          {group.payments.map((payment) => (
            <div key={payment.id} className="card-unified p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${PAYMENT_TYPE_COLORS[payment.type]}20` }}>
                    <AppIcon name="DollarSign" size={20} style={{ color: PAYMENT_TYPE_COLORS[payment.type] }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{PAYMENT_TYPE_LABELS[payment.type]}</span>
                      {payment.is_paid ? (
                        <Badge variant="default" className="bg-success/20 text-success hover:bg-success/30">
                          <AppIcon name="Check" size={12} className="mr-1" />Pago
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AppIcon name="Clock" size={12} className="mr-1" />Pendente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AppIcon name="Calendar" size={12} />
                      {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                      {payment.notes && <span className="text-xs">• {payment.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: payment.type === 'discount' ? 'hsl(var(--destructive))' : undefined }}>
                    {payment.type === 'discount' ? '-' : ''}{formatCurrency(payment.amount)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><AppIcon name="MoreVertical" size={16} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!payment.is_paid && (
                        <DropdownMenuItem onClick={() => setPayDialog({ open: true, paymentId: payment.id })}>
                          <AppIcon name="Receipt" size={16} className="mr-2" />Confirmar pagamento
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleEdit(payment)}>
                        <AppIcon name="Pencil" size={16} className="mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(payment.id)} className="text-destructive">
                        <AppIcon name="Trash2" size={16} className="mr-2" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {payments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="DollarSign" size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum pagamento registrado</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditingPayment(null); setSheetOpen(true); }}>
            <AppIcon name="Plus" size={16} className="mr-2" />Adicionar primeiro pagamento
          </Button>
        </div>
      )}

      <PaymentSheet open={sheetOpen} onOpenChange={setSheetOpen} employee={employee} payment={editingPayment} />
      <PayslipSheet open={payslipSheetOpen} onOpenChange={setPayslipSheetOpen} employee={employee} editingPayment={editingPayslip} onSave={addPayment} onUpdate={updatePayment} onDelete={deletePayment} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={payDialog.open} onOpenChange={(open) => setPayDialog({ open, paymentId: open ? payDialog.paymentId : null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Conta para débito</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.is_active).map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name} ({formatCurrency(account.balance)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">O valor será lançado como despesa nesta conta</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog({ open: false, paymentId: null })}>Cancelar</Button>
            <Button onClick={handlePay} disabled={!selectedAccountId || isPaying}>
              {isPaying ? (<><AppIcon name="progress_activity" size={16} className="mr-2 animate-spin" />Processando...</>) : ('Confirmar pagamento')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
