import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface HourBankEntry {
  id: string;
  employee_id: string;
  unit_id: string;
  date: string;
  type: string;
  hours: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function useHourBank(employeeId?: string) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['hour-bank', activeUnitId, employeeId],
    queryFn: async () => {
      let query = supabase
        .from('hour_bank' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('date', { ascending: false })
        .limit(200);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data } = await query;
      return (data || []) as unknown as HourBankEntry[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const addEntry = useMutation({
    mutationFn: async (params: { employeeId: string; date: string; type: string; hours: number; notes?: string }) => {
      const { error } = await supabase.from('hour_bank' as any).insert({
        employee_id: params.employeeId,
        unit_id: activeUnitId,
        date: params.date,
        type: params.type,
        hours: params.hours,
        notes: params.notes || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hour-bank'] }),
  });

  // Calculate balance per employee
  const getBalance = (empId: string) => {
    return entries
      .filter(e => e.employee_id === empId)
      .reduce((acc, e) => {
        if (e.type === 'overtime') return acc + e.hours;
        if (e.type === 'compensation') return acc - e.hours;
        return acc + e.hours; // adjustment can be + or -
      }, 0);
  };

  return { entries, isLoading, addEntry, getBalance };
}
