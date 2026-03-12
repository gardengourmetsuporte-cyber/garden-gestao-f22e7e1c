import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

export interface NPSResponse {
  id: string;
  unit_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  score: number;
  comment: string | null;
  order_id: string | null;
  source: string;
  created_at: string;
}

export function useNPS() {
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['nps-responses', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('nps_responses' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('created_at', { ascending: false })
        .limit(200);
      return (data || []) as unknown as NPSResponse[];
    },
    enabled: !!activeUnitId,
  });

  const submitNPS = useMutation({
    mutationFn: async (params: {
      unitId: string;
      score: number;
      comment?: string;
      customerName?: string;
      customerPhone?: string;
      orderId?: string;
    }) => {
      const { error } = await supabase.from('nps_responses' as any).insert({
        unit_id: params.unitId,
        score: params.score,
        comment: params.comment || null,
        customer_name: params.customerName || null,
        customer_phone: params.customerPhone || null,
        order_id: params.orderId || null,
        source: 'digital_menu',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps-responses'] }),
  });

  // NPS calculation
  const npsScore = (() => {
    if (responses.length === 0) return null;
    const promoters = responses.filter(r => r.score >= 9).length;
    const detractors = responses.filter(r => r.score <= 6).length;
    return Math.round(((promoters - detractors) / responses.length) * 100);
  })();

  const avgScore = responses.length > 0
    ? (responses.reduce((acc, r) => acc + r.score, 0) / responses.length).toFixed(1)
    : null;

  return { responses, isLoading, submitNPS, npsScore, avgScore };
}
