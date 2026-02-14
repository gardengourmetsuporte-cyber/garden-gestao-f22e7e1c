import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import type { MarketingPost, MarketingPostStatus, MarketingChannel } from '@/types/marketing';

export function useMarketing() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const queryKey = ['marketing-posts', activeUnitId];

  const { data: posts = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_posts' as any)
        .select('*')
        .eq('unit_id', activeUnitId!)
        .order('scheduled_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MarketingPost[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const createPost = useMutation({
    mutationFn: async (post: Partial<MarketingPost>) => {
      const { error } = await supabase.from('marketing_posts' as any).insert({
        unit_id: activeUnitId,
        user_id: user!.id,
        title: post.title || 'Sem título',
        caption: post.caption || '',
        media_urls: post.media_urls || [],
        channels: post.channels || [],
        status: post.status || 'draft',
        scheduled_at: post.scheduled_at || null,
        tags: post.tags || [],
        notes: post.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Post criado!');
    },
    onError: () => toast.error('Erro ao criar post'),
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<MarketingPost>) => {
      const { error } = await supabase
        .from('marketing_posts' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Post atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar post'),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_posts' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Post excluído!');
    },
    onError: () => toast.error('Erro ao excluir post'),
  });

  const markPublished = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_posts' as any)
        .update({ status: 'published', published_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Post marcado como publicado!');
    },
    onError: () => toast.error('Erro ao marcar como publicado'),
  });

  const uploadMedia = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${activeUnitId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('marketing-media').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('marketing-media').getPublicUrl(path);
    return data.publicUrl;
  };

  return {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    markPublished,
    uploadMedia,
  };
}
