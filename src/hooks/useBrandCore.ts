import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import type { BrandIdentity, BrandAsset, BrandReference } from '@/types/brand';

export function useBrandCore() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const qc = useQueryClient();

  // ── Identity ──
  const identityKey = ['brand-identity', activeUnitId];
  const { data: identity, isLoading: identityLoading } = useQuery({
    queryKey: identityKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_identity' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BrandIdentity | null;
    },
    enabled: !!user && !!activeUnitId,
  });

  const upsertIdentity = useMutation({
    mutationFn: async (values: Partial<BrandIdentity>) => {
      if (identity?.id) {
        const { error } = await supabase
          .from('brand_identity' as any)
          .update({ ...values, updated_at: new Date().toISOString() } as any)
          .eq('id', identity.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_identity' as any)
          .insert({ unit_id: activeUnitId, ...values } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: identityKey });
      toast.success('Identidade salva!');
    },
    onError: () => toast.error('Erro ao salvar identidade'),
  });

  // ── Assets ──
  const assetsKey = ['brand-assets', activeUnitId];
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: assetsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_assets' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('sort_order')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BrandAsset[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const createAsset = useMutation({
    mutationFn: async (asset: Partial<BrandAsset>) => {
      const { error } = await supabase.from('brand_assets' as any).insert({
        unit_id: activeUnitId,
        type: asset.type || 'reference',
        file_url: asset.file_url,
        title: asset.title || '',
        description: asset.description || '',
        tags: asset.tags || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetsKey });
      toast.success('Asset adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar asset'),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brand_assets' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetsKey });
      toast.success('Asset excluído!');
    },
    onError: () => toast.error('Erro ao excluir asset'),
  });

  const uploadAssetFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${activeUnitId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand-assets').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  // ── References ──
  const refsKey = ['brand-references', activeUnitId];
  const { data: references = [], isLoading: refsLoading } = useQuery({
    queryKey: refsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_references' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BrandReference[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const createReference = useMutation({
    mutationFn: async (ref: Partial<BrandReference>) => {
      const { error } = await supabase.from('brand_references' as any).insert({
        unit_id: activeUnitId,
        type: ref.type || 'strategy',
        title: ref.title || '',
        content: ref.content || '',
        media_urls: ref.media_urls || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refsKey });
      toast.success('Referência criada!');
    },
    onError: () => toast.error('Erro ao criar referência'),
  });

  const updateReference = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<BrandReference>) => {
      const { error } = await supabase
        .from('brand_references' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refsKey });
      toast.success('Referência atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar referência'),
  });

  const deleteReference = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brand_references' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: refsKey });
      toast.success('Referência excluída!');
    },
    onError: () => toast.error('Erro ao excluir referência'),
  });

  // ── AI Generate ──
  const [aiLoading, setAiLoading] = useState(false);
  const generateAI = async (action: string, extraPrompt?: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-ai-generate', {
        body: { action, unit_id: activeUnitId, prompt: extraPrompt },
      });
      if (error) throw error;
      return data;
    } finally {
      setAiLoading(false);
    }
  };

  return {
    identity, identityLoading, upsertIdentity,
    assets, assetsLoading, createAsset, deleteAsset, uploadAssetFile,
    references, refsLoading, createReference, updateReference, deleteReference,
    generateAI, aiLoading,
  };
}
