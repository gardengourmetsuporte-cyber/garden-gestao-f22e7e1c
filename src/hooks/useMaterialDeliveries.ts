import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MaterialDelivery {
  id: string;
  unit_id: string;
  employee_id: string;
  delivered_by: string;
  category: string;
  item_name: string;
  quantity: number;
  notes: string | null;
  signature_url: string | null;
  delivered_at: string;
  created_at: string;
  employee?: { full_name: string };
}

const CATEGORIES = [
  { value: 'uniforme', label: 'Uniforme', icon: 'Shirt' },
  { value: 'epi', label: 'EPI', icon: 'HardHat' },
  { value: 'equipamento', label: 'Equipamento', icon: 'Wrench' },
  { value: 'material', label: 'Material', icon: 'Package' },
  { value: 'outro', label: 'Outro', icon: 'MoreHorizontal' },
] as const;

export { CATEGORIES as MATERIAL_CATEGORIES };

export function useMaterialDeliveries(employeeId?: string) {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const qc = useQueryClient();
  const unitId = activeUnit?.id;

  const query = useQuery({
    queryKey: ['material-deliveries', unitId, employeeId],
    queryFn: async () => {
      let q = supabase
        .from('employee_material_deliveries')
        .select('*, employee:employees(full_name)')
        .eq('unit_id', unitId!)
        .order('delivered_at', { ascending: false });

      if (employeeId) {
        q = q.eq('employee_id', employeeId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as MaterialDelivery[];
    },
    enabled: !!unitId,
  });

  const addDelivery = useMutation({
    mutationFn: async (input: {
      employee_id: string;
      category: string;
      item_name: string;
      quantity: number;
      notes?: string;
      signature_data_url?: string;
    }) => {
      let signature_url: string | null = null;

      // Upload signature if provided
      if (input.signature_data_url) {
        const blob = await fetch(input.signature_data_url).then(r => r.blob());
        const fileName = `signatures/${unitId}/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, blob, { contentType: 'image/png' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
          signature_url = urlData.publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('employee_material_deliveries')
        .insert({
          unit_id: unitId!,
          employee_id: input.employee_id,
          delivered_by: user!.id,
          category: input.category,
          item_name: input.item_name,
          quantity: input.quantity,
          notes: input.notes || null,
          signature_url,
        })
        .select('*, employee:employees(full_name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-deliveries'] });
      toast.success('Entrega registrada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao registrar entrega');
    },
  });

  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_material_deliveries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-deliveries'] });
      toast.success('Registro excluído');
    },
    onError: () => {
      toast.error('Erro ao excluir registro');
    },
  });

  return {
    deliveries: query.data || [],
    isLoading: query.isLoading,
    addDelivery,
    deleteDelivery,
  };
}
