import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmployees, useEmployeePayments } from '@/hooks/useEmployees';
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS, MONTHS } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  Check, 
  Clock, 
  User,
  Wallet,
  TrendingUp,
} from 'lucide-react';

export function MyPayslips() {
  const { myEmployee, isLoading: loadingEmployee } = useEmployees();
  const { payments, isLoading: loadingPayments } = useEmployeePayments(myEmployee?.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loadingEmployee || loadingPayments) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!myEmployee) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Cadastro não encontrado</p>
        <p className="text-sm mt-1">
          Seu perfil ainda não está vinculado ao cadastro de funcionários.
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalPaid = payments
    .filter(p => p.is_paid && p.type !== 'discount')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = payments
    .filter(p => !p.is_paid && p.type !== 'discount')
    .reduce((sum, p) => sum + p.amount, 0);

  // Group payments by month/year
  const groupedPayments = payments.reduce((acc, payment) => {
    const key = `${payment.reference_year}-${payment.reference_month}`;
    if (!acc[key]) {
      acc[key] = {
        year: payment.reference_year,
        month: payment.reference_month,
        payments: [],
      };
    }
    acc[key].payments.push(payment);
    return acc;
  }, {} as Record<string, { year: number; month: number; payments: typeof payments }>);

  const sortedGroups = Object.values(groupedPayments).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="space-y-6">
      {/* Employee Info Card */}
      <div className="card-unified p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{myEmployee.full_name}</h2>
            <p className="text-sm text-muted-foreground">
              {myEmployee.role || 'Funcionário'} 
              {myEmployee.department && ` • ${myEmployee.department}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Salário base</p>
            <p className="font-semibold text-lg">{formatCurrency(myEmployee.base_salary)}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-unified p-4">
          <div className="flex items-center gap-2 text-success mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Recebido</span>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card-unified p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">A receber</span>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        <h3 className="font-medium">Histórico de Pagamentos</h3>
        
        {sortedGroups.map((group) => (
          <div key={`${group.year}-${group.month}`} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground px-1">
              {MONTHS[group.month - 1]} {group.year}
            </h4>
            
            {group.payments.map((payment) => (
              <div
                key={payment.id}
                className="card-unified p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${PAYMENT_TYPE_COLORS[payment.type]}20` }}
                    >
                      <DollarSign 
                        className="w-5 h-5"
                        style={{ color: PAYMENT_TYPE_COLORS[payment.type] }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {PAYMENT_TYPE_LABELS[payment.type]}
                        </span>
                        {payment.is_paid ? (
                          <Badge variant="default" className="bg-success/20 text-success hover:bg-success/30">
                            <Check className="w-3 h-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Previsto
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: payment.type === 'discount' ? '#ef4444' : undefined }}
                  >
                    {payment.type === 'discount' ? '-' : ''}
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {payments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum pagamento registrado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
