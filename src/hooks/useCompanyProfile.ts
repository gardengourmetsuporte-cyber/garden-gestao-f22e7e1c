import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/hooks/useUnit';
import { toast } from 'sonner';

export interface CompanyProfileData {
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  razao_social: string;
  nome_fantasia: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  responsavel_legal: string;
  cpf_responsavel: string;
}

export interface CompanyDocument {
  id: string;
  unit_id: string;
  name: string;
  file_url: string;
  file_type: string;
  uploaded_by: string | null;
  created_at: string;
}

const EMPTY_PROFILE: CompanyProfileData = {
  cnpj: '',
  inscricao_estadual: '',
  inscricao_municipal: '',
  razao_social: '',
  nome_fantasia: '',
  company_address: '',
  company_email: '',
  company_phone: '',
  responsavel_legal: '',
  cpf_responsavel: '',
};

export function useCompanyProfile() {
  const { activeUnitId: unitId } = useUnit();
  const queryClient = useQueryClient();

  // Fetch profile from store_info
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['company-profile', unitId],
    queryFn: async () => {
      if (!unitId) return EMPTY_PROFILE;
      const { data, error } = await supabase
        .from('units')
        .select('store_info')
        .eq('id', unitId)
        .single();
      if (error) throw error;
      const info = (data?.store_info as Record<string, any>) || {};
      return {
        cnpj: info.cnpj || '',
        inscricao_estadual: info.inscricao_estadual || '',
        inscricao_municipal: info.inscricao_municipal || '',
        razao_social: info.razao_social || '',
        nome_fantasia: info.nome_fantasia || '',
        company_address: info.company_address || '',
        company_email: info.company_email || '',
        company_phone: info.company_phone || '',
        responsavel_legal: info.responsavel_legal || '',
        cpf_responsavel: info.cpf_responsavel || '',
      } as CompanyProfileData;
    },
    enabled: !!unitId,
  });

  // Save profile
  const saveProfile = useMutation({
    mutationFn: async (profileData: CompanyProfileData) => {
      if (!unitId) throw new Error('Sem unidade');
      // Merge with existing store_info
      const { data: current } = await supabase
        .from('units')
        .select('store_info')
        .eq('id', unitId)
        .single();
      const existingInfo = (current?.store_info as Record<string, any>) || {};
      const merged = { ...existingInfo, ...profileData };
      const { error } = await supabase
        .from('units')
        .update({ store_info: merged as any })
        .eq('id', unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile', unitId] });
      toast.success('Ficha cadastral salva!');
    },
    onError: () => toast.error('Erro ao salvar ficha cadastral'),
  });

  // Fetch documents
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['company-documents', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CompanyDocument[];
    },
    enabled: !!unitId,
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      if (!unitId) throw new Error('Sem unidade');
      const user = (await supabase.auth.getUser()).data.user;
      const ext = file.name.split('.').pop();
      const path = `${unitId}/${Date.now()}_${name.replace(/\s+/g, '_')}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(path);
      const { error: dbError } = await supabase
        .from('company_documents')
        .insert({
          unit_id: unitId,
          name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          uploaded_by: user?.id || null,
        });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents', unitId] });
      toast.success('Documento enviado!');
    },
    onError: () => toast.error('Erro ao enviar documento'),
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (doc: CompanyDocument) => {
      // Delete from storage
      const url = new URL(doc.file_url);
      const pathMatch = url.pathname.match(/company-documents\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from('company-documents').remove([pathMatch[1]]);
      }
      const { error } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-documents', unitId] });
      toast.success('Documento removido');
    },
    onError: () => toast.error('Erro ao remover documento'),
  });

  // Generate share text
  function generateShareText(p: CompanyProfileData): string {
    const lines: string[] = ['📋 *FICHA CADASTRAL*', ''];
    if (p.razao_social) lines.push(`*Razão Social:* ${p.razao_social}`);
    if (p.nome_fantasia) lines.push(`*Nome Fantasia:* ${p.nome_fantasia}`);
    if (p.cnpj) lines.push(`*CNPJ:* ${p.cnpj}`);
    if (p.inscricao_estadual) lines.push(`*Inscrição Estadual:* ${p.inscricao_estadual}`);
    if (p.inscricao_municipal) lines.push(`*Inscrição Municipal:* ${p.inscricao_municipal}`);
    if (p.company_address) lines.push(`*Endereço:* ${p.company_address}`);
    if (p.company_email) lines.push(`*E-mail:* ${p.company_email}`);
    if (p.company_phone) lines.push(`*Telefone:* ${p.company_phone}`);
    if (p.responsavel_legal) lines.push(`*Responsável Legal:* ${p.responsavel_legal}`);
    if (p.cpf_responsavel) lines.push(`*CPF Responsável:* ${p.cpf_responsavel}`);
    return lines.join('\n');
  }

  return {
    profile: profile || EMPTY_PROFILE,
    profileLoading,
    saveProfile,
    documents,
    docsLoading,
    uploadDocument,
    deleteDocument,
    generateShareText,
  };
}
