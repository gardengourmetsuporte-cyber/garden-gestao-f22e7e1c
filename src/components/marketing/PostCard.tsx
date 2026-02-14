import { Instagram, MessageCircle, Calendar, MoreVertical, Trash2, Edit, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MarketingPost } from '@/types/marketing';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Agendado', className: 'bg-primary/20 text-primary' },
  published: { label: 'Publicado', className: 'bg-emerald-500/20 text-emerald-400' },
  failed: { label: 'Erro', className: 'bg-destructive/20 text-destructive' },
};

interface PostCardProps {
  post: MarketingPost;
  onEdit: (post: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (post: MarketingPost) => void;
}

export function PostCard({ post, onEdit, onDelete, onPublish }: PostCardProps) {
  const status = statusConfig[post.status] || statusConfig.draft;

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {post.media_urls.length > 0 && (
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img
            src={post.media_urls[0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {post.media_urls.length > 1 && (
            <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
              +{post.media_urls.length - 1}
            </span>
          )}
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{post.title}</h3>
            {post.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.caption}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-secondary shrink-0">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </DropdownMenuItem>
              {post.status !== 'published' && (
                <DropdownMenuItem onClick={() => onPublish(post)}>
                  <Send className="w-4 h-4 mr-2" /> Publicar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={status.className + ' text-[10px] border-0'}>
            {status.label}
          </Badge>
          {post.channels.includes('instagram') && (
            <Instagram className="w-3.5 h-3.5 text-pink-400" />
          )}
          {post.channels.includes('whatsapp_status') && (
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {post.scheduled_at && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
              <Calendar className="w-3 h-3" />
              {format(new Date(post.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {post.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
