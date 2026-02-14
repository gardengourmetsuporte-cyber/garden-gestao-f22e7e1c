import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Employee, EmployeePayment, PaymentType } from '@/types/employee';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export function useEmployees() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();

  // Fetch all employees (admin) or own employee record (user)
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', activeUnitId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('full_name');
      if (activeUnitId) query = query.eq('unit_id', activeUnitId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Fetch own employee record for non-admin users
  const { data: myEmployee } = useQuery({
    queryKey: ['my-employee'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Employee | null;
    },
    enabled: !!user,
  });

  // Add employee
  const addEmployee = useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('employees')
        .insert(employee);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário cadastrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar funcionário');
    },
  });

  // Update employee
  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['my-employee'] });
      toast.success('Funcionário atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar funcionário');
    },
  });

  // Delete employee
  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover funcionário');
    },
  });

  return {
    employees,
    myEmployee,
    isLoading,
    addEmployee: addEmployee.mutateAsync,
    updateEmployee: updateEmployee.mutateAsync,
    deleteEmployee: deleteEmployee.mutateAsync,
    isAdmin,
  };
}

export function useEmployeePayments(employeeId?: string) {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['employee-payments', employeeId],
    queryFn: async () => {
      let query = supabase
        .from('employee_payments')
        .select(`
          *,
          employee:employees(id, full_name)
        `)
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false })
        .order('payment_date', { ascending: false });
      
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (activeUnitId) {
        query = query.eq('unit_id', activeUnitId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as (EmployeePayment & { employee: { id: string; full_name: string } })[];
    },
    enabled: isAdmin || !!employeeId,
  });

  // Add payment
  const addPayment = useMutation({
    mutationFn: async (payment: {
      employee_id: string;
      type: PaymentType;
      reference_month: number;
      reference_year: number;
      amount: number;
      payment_date: string;
      notes?: string;
      is_paid?: boolean;
    }) => {
      const { error } = await supabase
        .from('employee_payments')
        .insert({
          ...payment,
          created_by: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar pagamento');
    },
  });

  // Update payment
  const updatePayment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmployeePayment> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data };
      
      // If marking as paid, set paid_at
      if (data.is_paid && !data.paid_at) {
        updateData.paid_at = new Date().toISOString();
      } else if (data.is_paid === false) {
        updateData.paid_at = null;
      }
      
      const { error } = await supabase
        .from('employee_payments')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      toast.success('Pagamento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar pagamento');
    },
  });

  // Delete payment
  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      toast.success('Pagamento removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover pagamento');
    },
  });

  // Mark as paid and create finance transaction
  const markAsPaidWithTransaction = useMutation({
    mutationFn: async ({ paymentId, accountId }: { paymentId: string; accountId: string }) => {
      // Get payment details
      const { data: payment, error: fetchError } = await supabase
        .from('employee_payments')
        .select('*, employee:employees(full_name)')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const typeLabels: Record<string, string> = {
        salary: 'Salário',
        vale: 'Vale',
        bonus: 'Bônus',
        discount: 'Desconto',
        other: 'Pagamento',
      };
      
      const description = `${typeLabels[payment.type]} - ${payment.employee.full_name}`;
      
      // Create finance transaction with employee_id linked
      const { data: transaction, error: transError } = await supabase
        .from('finance_transactions')
        .insert({
          user_id: user?.id,
          type: payment.type === 'discount' ? 'income' : 'expense',
          description,
          amount: payment.amount,
          date: payment.payment_date,
          account_id: accountId,
          is_paid: true,
          is_fixed: false,
          employee_id: payment.employee_id,
        })
        .select('id')
        .single();
      
      if (transError) throw transError;
      
      // Update payment with transaction id
      const { error: updateError } = await supabase
        .from('employee_payments')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
          finance_transaction_id: transaction.id,
        })
        .eq('id', paymentId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      toast.success('Pagamento confirmado e lançado no financeiro!');
    },
    onError: () => {
      toast.error('Erro ao confirmar pagamento');
    },
  });

  return {
    payments,
    isLoading,
    addPayment: addPayment.mutateAsync,
    updatePayment: updatePayment.mutateAsync,
    deletePayment: deletePayment.mutateAsync,
    markAsPaidWithTransaction: markAsPaidWithTransaction.mutateAsync,
  };
}
