import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmployees, useEmployeePayments } from '@/hooks/useEmployees';
import { PAYMENT_TYPE_LABELS, MONTHS } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Calendar, 
  Check, 
  Clock, 
  User,
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function MyPayslips() {
  const { myEmployee, isLoading: loadingEmployee } = useEmployees();
  const { payments, isLoading: loadingPayments } = useEmployeePayments(myEmployee?.id);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const toggleExpand = (paymentId: string) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
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

  // Filter only salary type payments (holerites)
  const salaryPayments = payments.filter(p => p.type === 'salary');
  const otherPayments = payments.filter(p => p.type !== 'salary');

  // Calculate totals
  const totalPaid = payments
    .filter(p => p.is_paid && p.type !== 'discount')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = payments
    .filter(p => !p.is_paid && p.type !== 'discount')
    .reduce((sum, p) => sum + p.amount, 0);

  // Group salary payments by month/year
  const groupedPayments = salaryPayments.reduce((acc, payment) => {
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
  }, {} as Record<string, { year: number; month: number; payments: typeof salaryPayments }>);

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
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
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

      {/* Holerites (Salary Payments) */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Holerites
        </h3>
        
        {sortedGroups.map((group) => (
          <div key={`${group.year}-${group.month}`} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground px-1">
              {MONTHS[group.month - 1]} {group.year}
            </h4>
            
            {group.payments.map((payment) => {
              const isExpanded = expandedPayments.has(payment.id);
              const hasDetails = payment.total_earnings > 0;
              
              return (
                <Card
                  key={payment.id}
                  className={cn("overflow-hidden", isExpanded && "ring-1 ring-primary/20")}
                >
                  {/* Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => hasDetails && toggleExpand(payment.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Salário</span>
                            {payment.is_paid ? (
                              <Badge variant="default" className="bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30">
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
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {formatCurrency(payment.net_salary || payment.amount)}
                        </span>
                        {hasDetails && (
                          isExpanded ? 
                            <ChevronUp className="w-4 h-4 text-muted-foreground" /> : 
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      {/* Earnings */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                          <Plus className="w-3 h-3" />
                          Proventos
                        </div>
                        <div className="space-y-1 text-sm pl-5">
                          {payment.base_salary > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Salário Base</span>
                              <span>{formatCurrency(payment.base_salary)}</span>
                            </div>
                          )}
                          {payment.night_bonus > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Adicional Noturno ({payment.night_hours}h)</span>
                              <span>{formatCurrency(payment.night_bonus)}</span>
                            </div>
                          )}
                          {payment.overtime_bonus > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Horas Extras ({payment.overtime_hours}h)</span>
                              <span>{formatCurrency(payment.overtime_bonus)}</span>
                            </div>
                          )}
                          {payment.meal_allowance > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vale Alimentação</span>
                              <span>{formatCurrency(payment.meal_allowance)}</span>
                            </div>
                          )}
                          {payment.transport_allowance > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vale Transporte</span>
                              <span>{formatCurrency(payment.transport_allowance)}</span>
                            </div>
                          )}
                          {payment.other_earnings > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{payment.other_earnings_description || 'Outros'}</span>
                              <span>{formatCurrency(payment.other_earnings)}</span>
                            </div>
                          )}
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium text-emerald-600">
                            <span>Total Proventos</span>
                            <span>{formatCurrency(payment.total_earnings)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      {payment.total_deductions > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-rose-600 font-medium text-sm">
                            <Minus className="w-3 h-3" />
                            Descontos
                          </div>
                          <div className="space-y-1 text-sm pl-5">
                            {payment.inss_deduction > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">INSS</span>
                                <span className="text-rose-600">-{formatCurrency(payment.inss_deduction)}</span>
                              </div>
                            )}
                            {payment.irrf_deduction > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">IRRF</span>
                                <span className="text-rose-600">-{formatCurrency(payment.irrf_deduction)}</span>
                              </div>
                            )}
                            {payment.advance_deduction > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Adiantamento</span>
                                <span className="text-rose-600">-{formatCurrency(payment.advance_deduction)}</span>
                              </div>
                            )}
                            {payment.other_deductions > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{payment.other_deductions_description || 'Outros'}</span>
                                <span className="text-rose-600">-{formatCurrency(payment.other_deductions)}</span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between font-medium text-rose-600">
                              <span>Total Descontos</span>
                              <span>-{formatCurrency(payment.total_deductions)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FGTS */}
                      {payment.fgts_amount > 0 && (
                        <div className="text-sm p-2 bg-blue-500/10 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-blue-600">FGTS depositado</span>
                            <span className="text-blue-600 font-medium">{formatCurrency(payment.fgts_amount)}</span>
                          </div>
                        </div>
                      )}

                      {/* Net Salary */}
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Líquido a Receber</span>
                          <span className="font-bold text-lg text-primary">{formatCurrency(payment.net_salary)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ))}

        {salaryPayments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum holerite disponível</p>
          </div>
        )}
      </div>

      {/* Other Payments (Vale, Bonus, etc) */}
      {otherPayments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Outros Pagamentos
          </h3>
          
          {otherPayments.map((payment) => (
            <Card key={payment.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{PAYMENT_TYPE_LABELS[payment.type]}</span>
                      {payment.is_paid ? (
                        <Badge variant="default" className="bg-emerald-500/20 text-emerald-600">
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
                  style={{ color: payment.type === 'discount' ? 'hsl(var(--destructive))' : undefined }}
                >
                  {payment.type === 'discount' ? '-' : ''}
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
