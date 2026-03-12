import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  unit_id: string;
  title: string;
  type: string;
  file_url: string;
  file_name: string | null;
  expiry_date: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export const DOCUMENT_TYPES = [
  { value: 'rg', label: 'RG' },
  { value: 'cpf', label: 'CPF' },
  { value: 'ctps', label: 'Carteira de Trabalho' },
  { value: 'contract', label: 'Contrato' },
  { value: 'aso', label: 'ASO (Atestado Saúde)' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'warning', label: 'Advertência' },
  { value: 'other', label: 'Outro' },
];

export function useEmployeeDocuments(employeeId: string | null) {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });

  const upload = useMutation({
    mutationFn: async ({ file, title, type, expiryDate }: { file: File; title: string; type: string; expiryDate?: string }) => {
      const ext = file.name.split('.').pop();
      const path = `employee-docs/${unitId}/${employeeId}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(path);

      const { error } = await supabase.from('employee_documents').insert({
        employee_id: employeeId!,
        unit_id: unitId!,
        title,
        type,
        file_url: publicUrl,
        file_name: file.name,
        expiry_date: expiryDate || null,
        uploaded_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Documento enviado');
      qc.invalidateQueries({ queryKey: ['employee-documents'] });
    },
    onError: () => toast.error('Erro ao enviar documento'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Documento removido');
      qc.invalidateQueries({ queryKey: ['employee-documents'] });
    },
    onError: () => toast.error('Erro ao remover documento'),
  });

  return { documents: query.data || [], isLoading: query.isLoading, upload, remove };
}
