import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TabletMural() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa') || '1';

  const { data: posts, isLoading } = useQuery({
    queryKey: ['mural-posts', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('mural_posts')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!unitId,
  });

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center gap-3 px-5 border-b border-border/20 shrink-0">
        <button
          onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)}
          className="w-9 h-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center"
        >
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Mural da Casa</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          {isLoading && (
            <div className="text-center py-16 text-muted-foreground text-sm">Carregando...</div>
          )}

          {!isLoading && (!posts || posts.length === 0) && (
            <div className="text-center py-20 space-y-3">
              <AppIcon name="Newspaper" size={48} className="mx-auto text-muted-foreground/20" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhuma novidade no momento</p>
              <p className="text-xs text-muted-foreground/60">Fique de olho para novidades e promoções!</p>
            </div>
          )}

          {posts?.map(post => (
            <article
              key={post.id}
              className="rounded-2xl bg-card border border-border/20 overflow-hidden"
            >
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-5 space-y-2">
                <h2 className="text-base font-bold text-foreground">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{post.content}</p>
                <p className="text-[10px] text-muted-foreground/50 pt-1">
                  {format(new Date(post.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
