import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface PriceSurvey {
  id: string;
  user_id: string;
  unit_id: string;
  title: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  price_survey_suppliers?: PriceSurveySupplier[];
}

export interface PriceSurveySupplier {
  id: string;
  survey_id: string;
  supplier_id: string;
  token: string;
  status: string;
  responded_at: string | null;
  created_at: string;
  supplier?: { id: string; name: string; phone: string | null };
}

export interface PriceSurveyResponse {
  id: string;
  survey_supplier_id: string;
  item_id: string;
  unit_price: number;
  brand: string | null;
  has_item: boolean;
  created_at: string;
}

export function usePriceSurveys() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();
  const unitId = currentUnit?.id;

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['price-surveys', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('price_surveys' as any)
        .select(`
          *,
          price_survey_suppliers(*, supplier:suppliers(id, name, phone))
        `)
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PriceSurvey[];
    },
    enabled: !!unitId,
  });

  const createSurvey = useMutation({
    mutationFn: async (params: { title: string; supplierIds: string[]; notes?: string }) => {
      if (!unitId || !user) throw new Error('No unit/user');
      const { data: survey, error } = await supabase
        .from('price_surveys' as any)
        .insert({ user_id: user.id, unit_id: unitId, title: params.title, notes: params.notes || null, status: 'sent' })
        .select()
        .single();
      if (error) throw error;

      const surveyId = (survey as any).id;
      const suppliersInsert = params.supplierIds.map(sid => ({
        survey_id: surveyId,
        supplier_id: sid,
      }));
      const { data: insertedSuppliers, error: sError } = await supabase
        .from('price_survey_suppliers' as any)
        .insert(suppliersInsert)
        .select('id, supplier_id, token, supplier:suppliers(id, name, phone)');
      if (sError) throw sError;

      await supabase
        .from('price_surveys' as any)
        .update({ status: 'sent' })
        .eq('id', surveyId);

      return { survey, suppliers: insertedSuppliers };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-surveys', unitId] });
      toast.success('Pesquisa de preços criada!');
    },
    onError: () => toast.error('Erro ao criar pesquisa'),
  });

  const deleteSurvey = useMutation({
    mutationFn: async (surveyId: string) => {
      const { error } = await supabase.from('price_surveys' as any).delete().eq('id', surveyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-surveys', unitId] });
      toast.success('Pesquisa excluída');
    },
  });

  const fetchSurveyDetail = async (surveyId: string) => {
    const { data: survey } = await supabase
      .from('price_surveys' as any)
      .select(`*, price_survey_suppliers(*, supplier:suppliers(id, name, phone))`)
      .eq('id', surveyId)
      .single();

    if (!survey) return null;

    const supplierIds = ((survey as any).price_survey_suppliers || []).map((s: any) => s.id);
    let responses: any[] = [];
    if (supplierIds.length > 0) {
      const { data } = await supabase
        .from('price_survey_responses' as any)
        .select('*')
        .in('survey_supplier_id', supplierIds);
      responses = data || [];
    }

    return { ...survey, responses } as any;
  };

  return {
    surveys: surveys as PriceSurvey[],
    isLoading,
    createSurvey,
    deleteSurvey,
    fetchSurveyDetail,
  };
}
