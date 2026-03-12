import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface EmployeeSummary {
  id: string;
  name: string;
  role: string;
  total_payments: number;
  hours_worked: number;
  days_present: number;
}

export function useReportEmployees(month: number, year: number) {
  const { currentUnit } = useUnit();
  const unitId = currentUnit?.id;

  return useQuery({
    queryKey: ['report-employees', unitId, month, year],
    queryFn: async (): Promise<{ employees: EmployeeSummary[]; totalCost: number }> => {
      if (!unitId) return { employees: [], totalCost: 0 };

      const { data: emps } = await supabase
        .from('employees')
        .select('id, name, role')
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

      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('employee_id, hours_worked, date')
        .eq('unit_id', unitId)
        .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('date', `${year}-${String(month).padStart(2, '0')}-31`);

      const payMap = new Map<string, number>();
      payments?.forEach(p => {
        payMap.set(p.employee_id, (payMap.get(p.employee_id) || 0) + Number(p.amount || 0));
      });

      const hoursMap = new Map<string, { hours: number; days: Set<string> }>();
      timeEntries?.forEach(t => {
        const e = hoursMap.get(t.employee_id) || { hours: 0, days: new Set<string>() };
        e.hours += Number(t.hours_worked || 0);
        e.days.add(t.date);
        hoursMap.set(t.employee_id, e);
      });

      const employees: EmployeeSummary[] = emps.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role || '-',
        total_payments: payMap.get(e.id) || 0,
        hours_worked: hoursMap.get(e.id)?.hours || 0,
        days_present: hoursMap.get(e.id)?.days.size || 0,
      }));

      return {
        employees: employees.sort((a, b) => b.total_payments - a.total_payments),
        totalCost: employees.reduce((s, e) => s + e.total_payments, 0),
      };
    },
    enabled: !!unitId,
  });
}
