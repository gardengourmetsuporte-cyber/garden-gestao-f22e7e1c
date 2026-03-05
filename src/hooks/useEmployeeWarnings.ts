import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import type { WarningType, WarningSeverity } from '@/types/employee';

export interface EmployeeWarning {
  id: string;
  employee_id: string;
  unit_id: string;
  type: WarningType;
  severity: WarningSeverity;
  reason: string;
  legal_basis: string | null;
  description: string | null;
  date: string;
  suspension_days: number;
  witness_1: string | null;
  witness_2: string | null;
  document_url: string | null;
  employee_acknowledged: boolean;
  acknowledged_at: string | null;
  issued_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: { id: string; full_name: string; user_id: string | null };
}

export const WARNING_TYPE_LABELS: Record<WarningType, string> = {
  verbal: 'Advertência Verbal',
  written: 'Advertência Escrita',
  suspension: 'Suspensão',
  dismissal: 'Justa Causa',
};

export const WARNING_TYPE_COLORS: Record<WarningType, string> = {
  verbal: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  written: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  suspension: 'bg-red-500/15 text-red-400 border-red-500/30',
  dismissal: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export const SEVERITY_LABELS: Record<WarningSeverity, string> = {
  light: 'Leve',
  moderate: 'Moderada',
  serious: 'Grave',
};

export const CLT_REASONS = [
  { value: 'Art. 482, a - Ato de improbidade', label: 'Ato de improbidade' },
  { value: 'Art. 482, b - Incontinência de conduta ou mau procedimento', label: 'Incontinência de conduta' },
  { value: 'Art. 482, c - Negociação habitual', label: 'Negociação habitual' },
  { value: 'Art. 482, d - Condenação criminal', label: 'Condenação criminal' },
  { value: 'Art. 482, e - Desídia no desempenho das funções', label: 'Desídia' },
  { value: 'Art. 482, f - Embriaguez habitual ou em serviço', label: 'Embriaguez' },
  { value: 'Art. 482, g - Violação de segredo da empresa', label: 'Violação de segredo' },
  { value: 'Art. 482, h - Ato de indisciplina ou insubordinação', label: 'Indisciplina / Insubordinação' },
  { value: 'Art. 482, i - Abandono de emprego', label: 'Abandono de emprego' },
  { value: 'Art. 482, j - Ato lesivo da honra ou agressão física', label: 'Ato lesivo da honra' },
  { value: 'Art. 482, k - Prática constante de jogos de azar', label: 'Jogos de azar' },
  { value: 'Art. 482, m - Perda da habilitação profissional', label: 'Perda de habilitação' },
  { value: 'Outro', label: 'Outro motivo' },
];

export function useEmployeeWarnings() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();

  const { data: warnings = [], isLoading } = useQuery({
    queryKey: ['employee-warnings', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('employee_warnings')
        .select('*, employee:employees(id, full_name, user_id)')
        .eq('unit_id', activeUnitId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EmployeeWarning[];
    },
    enabled: !!activeUnitId,
  });

  const addWarning = useMutation({
    mutationFn: async (data: {
      employee_id: string;
      type: WarningType;
      severity: WarningSeverity;
      reason: string;
      legal_basis?: string;
      description?: string;
      date: string;
      suspension_days?: number;
      witness_1?: string;
      witness_2?: string;
      document_url?: string;
      notes?: string;
    }) => {
      if (!activeUnitId) throw new Error('Unidade não selecionada');
      const { error } = await supabase.from('employee_warnings').insert({
        ...data,
        unit_id: activeUnitId,
        issued_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-warnings'] });
      toast.success('Advertência registrada com sucesso!');
    },
    onError: () => toast.error('Erro ao registrar advertência'),
  });

  const acknowledgeWarning = useMutation({
    mutationFn: async (warningId: string) => {
      const { error } = await supabase
        .from('employee_warnings')
        .update({ employee_acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', warningId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-warnings'] });
      toast.success('Ciência registrada!');
    },
    onError: () => toast.error('Erro ao registrar ciência'),
  });

  const deleteWarning = useMutation({
    mutationFn: async (warningId: string) => {
      const { error } = await supabase.from('employee_warnings').delete().eq('id', warningId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-warnings'] });
      toast.success('Advertência removida!');
    },
    onError: () => toast.error('Erro ao remover advertência'),
  });

  // Count warnings by employee
  const getWarningCounts = (employeeId: string) => {
    const empWarnings = warnings.filter(w => w.employee_id === employeeId);
    return {
      total: empWarnings.length,
      verbal: empWarnings.filter(w => w.type === 'verbal').length,
      written: empWarnings.filter(w => w.type === 'written').length,
      suspension: empWarnings.filter(w => w.type === 'suspension').length,
      dismissal: empWarnings.filter(w => w.type === 'dismissal').length,
    };
  };

  return {
    warnings,
    isLoading,
    addWarning: addWarning.mutateAsync,
    acknowledgeWarning: acknowledgeWarning.mutateAsync,
    deleteWarning: deleteWarning.mutateAsync,
    getWarningCounts,
    isAdmin,
  };
}
