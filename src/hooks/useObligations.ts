import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Obligation {
  id: string;
  unit_id: string;
  title: string;
  category: string;
  description: string | null;
  document_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  alert_days_before: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ObligationInsert = Omit<Obligation, 'id' | 'created_at' | 'updated_at'>;

export const OBLIGATION_CATEGORIES = [
  { value: 'bombeiro', label: 'Corpo de Bombeiros', color: '#ef4444' },
  { value: 'vigilancia_sanitaria', label: 'Vigilância Sanitária', color: '#22c55e' },
  { value: 'prefeitura', label: 'Prefeitura / Alvará', color: '#3b82f6' },
  { value: 'detetizacao', label: 'Detetização', color: '#f59e0b' },
  { value: 'associacao', label: 'Associação Comercial', color: '#8b5cf6' },
  { value: 'contabilidade', label: 'Contabilidade', color: '#06b6d4' },
  { value: 'trabalhista', label: 'Trabalhista', color: '#ec4899' },
  { value: 'ambiental', label: 'Ambiental', color: '#84cc16' },
  { value: 'outros', label: 'Outros', color: '#64748b' },
] as const;

// Pre-defined obligations for food service businesses
export const OBLIGATION_TEMPLATES = [
  { category: 'bombeiro', title: 'AVCB / CLCB', description: 'Auto de Vistoria ou Certificado de Licenciamento do Corpo de Bombeiros', icon: 'Flame', defaultAlertDays: 60 },
  { category: 'bombeiro', title: 'Extintores - Recarga', description: 'Recarga anual dos extintores de incêndio', icon: 'FireExtinguisher', defaultAlertDays: 30 },
  { category: 'vigilancia_sanitaria', title: 'Alvará Sanitário', description: 'Licença sanitária emitida pela Vigilância', icon: 'HeartPulse', defaultAlertDays: 60 },
  { category: 'vigilancia_sanitaria', title: 'Manual de Boas Práticas (MBP)', description: 'Documento obrigatório RDC 216/2004', icon: 'BookOpen', defaultAlertDays: 90 },
  { category: 'vigilancia_sanitaria', title: 'POP - Procedimentos Operacionais', description: 'Procedimentos Operacionais Padronizados', icon: 'ClipboardList', defaultAlertDays: 90 },
  { category: 'vigilancia_sanitaria', title: 'Análise de Água', description: 'Laudo de potabilidade da água', icon: 'Droplets', defaultAlertDays: 30 },
  { category: 'vigilancia_sanitaria', title: 'Curso Manipulação de Alimentos', description: 'Certificado de capacitação dos manipuladores', icon: 'GraduationCap', defaultAlertDays: 60 },
  { category: 'prefeitura', title: 'Alvará de Funcionamento', description: 'Licença municipal para funcionamento do estabelecimento', icon: 'Building2', defaultAlertDays: 60 },
  { category: 'prefeitura', title: 'Inscrição Municipal (ISS)', description: 'Cadastro municipal e imposto sobre serviços', icon: 'FileText', defaultAlertDays: 30 },
  { category: 'detetizacao', title: 'Dedetização / Desinsetização', description: 'Controle de pragas e vetores com laudo técnico', icon: 'Bug', defaultAlertDays: 15 },
  { category: 'detetizacao', title: 'Desratização', description: 'Controle de roedores com certificado', icon: 'Bug', defaultAlertDays: 15 },
  { category: 'detetizacao', title: 'Limpeza de Caixa d\'Água', description: 'Higienização semestral da caixa d\'água', icon: 'Droplets', defaultAlertDays: 30 },
  { category: 'detetizacao', title: 'Limpeza de Coifa / Exaustão', description: 'Higienização do sistema de exaustão', icon: 'Wind', defaultAlertDays: 30 },
  { category: 'contabilidade', title: 'CNPJ Ativo', description: 'Cadastro Nacional de Pessoa Jurídica', icon: 'FileCheck', defaultAlertDays: 30 },
  { category: 'contabilidade', title: 'Certificado Digital (e-CNPJ)', description: 'Certificado digital para emissão de NF', icon: 'KeyRound', defaultAlertDays: 30 },
  { category: 'trabalhista', title: 'PPRA / PGR', description: 'Programa de Gerenciamento de Riscos', icon: 'ShieldAlert', defaultAlertDays: 60 },
  { category: 'trabalhista', title: 'PCMSO', description: 'Programa de Controle Médico de Saúde Ocupacional', icon: 'Stethoscope', defaultAlertDays: 60 },
  { category: 'trabalhista', title: 'ASO - Exames Periódicos', description: 'Atestados de Saúde Ocupacional dos funcionários', icon: 'UserCheck', defaultAlertDays: 30 },
  { category: 'ambiental', title: 'Licença Ambiental', description: 'Licença ambiental (quando aplicável)', icon: 'Leaf', defaultAlertDays: 60 },
  { category: 'ambiental', title: 'Cadastro Óleo de Cozinha', description: 'Destinação correta do óleo usado', icon: 'Recycle', defaultAlertDays: 30 },
] as const;

export function getCategoryConfig(category: string) {
  return OBLIGATION_CATEGORIES.find(c => c.value === category) || OBLIGATION_CATEGORIES[OBLIGATION_CATEGORIES.length - 1];
}

export function getObligationStatus(obligation: { expiry_date: string | null; alert_days_before: number }) {
  if (!obligation.expiry_date) return { label: 'Pendente', variant: 'muted' as const, color: '#64748b' };
  const now = new Date();
  const expiry = new Date(obligation.expiry_date + 'T23:59:59');
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Vencido', variant: 'destructive' as const, color: '#ef4444' };
  if (diffDays <= obligation.alert_days_before) return { label: `Vence em ${diffDays}d`, variant: 'warning' as const, color: '#f59e0b' };
  return { label: 'Em dia', variant: 'success' as const, color: '#22c55e' };
}

export function useObligations() {
  const { activeUnit } = useUnit();
  const { user } = useAuth();
  const qc = useQueryClient();
  const unitId = activeUnit?.id;

  const { data: obligations = [], isLoading } = useQuery({
    queryKey: ['obligations', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('legal_obligations')
        .select('*')
        .eq('unit_id', unitId)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Obligation[];
    },
    enabled: !!unitId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: Partial<ObligationInsert>) => {
      const { error } = await supabase.from('legal_obligations').insert({
        ...input,
        unit_id: unitId!,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['obligations', unitId] }); toast.success('Obrigação cadastrada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Obligation> & { id: string }) => {
      const { error } = await supabase.from('legal_obligations').update(input as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['obligations', unitId] }); toast.success('Obrigação atualizada!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('legal_obligations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['obligations', unitId] }); toast.success('Obrigação removida!'); },
  });

  return {
    obligations,
    isLoading,
    createObligation: createMutation.mutateAsync,
    updateObligation: updateMutation.mutateAsync,
    deleteObligation: deleteMutation.mutateAsync,
  };
}
