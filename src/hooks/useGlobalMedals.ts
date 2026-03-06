import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateMedals } from '@/lib/medals';

/** Fetch global medal unlock status for the entire unit */
export function useGlobalMedals(unitId: string | null) {
  return useQuery({
    queryKey: ['global-medals', unitId],
    queryFn: async () => {
      const [{ data: empOfMonth }, { data: inventors }, { data: employees }] = await Promise.all([
        supabase.from('bonus_points').select('id').eq('badge_id', 'employee_of_month').eq('unit_id', unitId!).limit(1),
        supabase.from('bonus_points').select('id').eq('badge_id', 'inventor').eq('unit_id', unitId!).limit(1),
        supabase.from('employees').select('admission_date').eq('unit_id', unitId!).not('admission_date', 'is', null).limit(1000),
      ]);

      const admissionDates = (employees || []).map(e => e.admission_date).filter(Boolean) as string[];
      const earliest = admissionDates.length > 0 ? admissionDates.sort()[0] : null;

      return calculateMedals({
        hasEmployeeOfMonth: (empOfMonth || []).length > 0,
        admissionDate: earliest,
        hasInventedRecipe: (inventors || []).length > 0,
      });
    },
    enabled: !!unitId,
  });
}
