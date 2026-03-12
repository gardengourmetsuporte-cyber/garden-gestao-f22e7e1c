import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface EmployeeSummary {
  id: string;
  name: string;
  role: string;
  total_payments: number;
  base_salary: number;
}

export function useReportEmployees(month: number, year: number) {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;

  return useQuery({
    queryKey: ['report-employees', unitId, month, year],
    queryFn: async (): Promise<{ employees: EmployeeSummary[]; totalCost: number }> => {
      if (!unitId) return { employees: [], totalCost: 0 };

      const { data: emps } = await supabase
        .from('employees')
        .select('id, name, role, base_salary')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .is('deleted_at', null);

      if (!emps?.length) return { employees: [], totalCost: 0 };

      const { data: payments } = await supabase
        .from('employee_payments')
        .select('employee_id, amount')
        .eq('unit_id', unitId)
        .eq('reference_month', month)
        .eq('reference_year', year);

      const payMap = new Map<string, number>();
      payments?.forEach(p => {
        payMap.set(p.employee_id, (payMap.get(p.employee_id) || 0) + Number(p.amount || 0));
      });

      const employees: EmployeeSummary[] = emps.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role || '-',
        total_payments: payMap.get(e.id) || 0,
        base_salary: Number(e.base_salary || 0),
      }));

      return {
        employees: employees.sort((a, b) => b.total_payments - a.total_payments),
        totalCost: employees.reduce((s, e) => s + e.total_payments, 0),
      };
    },
    enabled: !!unitId,
  });
}
