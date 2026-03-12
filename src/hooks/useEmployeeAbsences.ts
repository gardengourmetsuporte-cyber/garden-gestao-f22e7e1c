import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface EmployeeAbsence {
  id: string;
  employee_id: string;
  unit_id: string;
  type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export const ABSENCE_TYPES: Record<string, string> = {
  vacation: 'Férias',
  sick_leave: 'Atestado médico',
  personal: 'Pessoal',
  maternity: 'Licença maternidade/paternidade',
  other: 'Outro',
};

export function useEmployeeAbsences(employeeId?: string) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const { data: absences = [], isLoading } = useQuery({
    queryKey: ['employee-absences', activeUnitId, employeeId],
    queryFn: async () => {
      let query = supabase
        .from('employee_absences' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('start_date', { ascending: false })
        .limit(200);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data } = await query;
      return (data || []) as unknown as EmployeeAbsence[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const createAbsence = useMutation({
    mutationFn: async (params: {
      employeeId: string;
      type: string;
      startDate: string;
      endDate: string;
      daysCount: number;
      notes?: string;
    }) => {
      const { error } = await supabase.from('employee_absences' as any).insert({
        employee_id: params.employeeId,
        unit_id: activeUnitId,
        type: params.type,
        start_date: params.startDate,
        end_date: params.endDate,
        days_count: params.daysCount,
        notes: params.notes || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-absences'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async (params: { id: string; status: string }) => {
      const { error } = await supabase.from('employee_absences' as any).update({
        status: params.status,
        approved_by: params.status === 'approved' ? user!.id : null,
        approved_at: params.status === 'approved' ? new Date().toISOString() : null,
      }).eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-absences'] }),
  });

  return { absences, isLoading, createAbsence, updateStatus };
}
