import { useState, useMemo } from 'react';
import { PostCard } from './PostCard';
import type { MarketingPost, MarketingPostStatus, MarketingChannel } from '@/types/marketing';

const statusFilters: { value: MarketingPostStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'scheduled', label: 'Agendados' },
  { value: 'published', label: 'Publicados' },
];

const channelFilters: { value: MarketingChannel | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp_status', label: 'WhatsApp' },
];

interface Props {
  posts: MarketingPost[];
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (p: MarketingPost) => void;
}

export function MarketingFeed({ posts, onEdit, onDelete, onPublish }: Props) {
  const [statusFilter, setStatusFilter] = useState<MarketingPostStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<MarketingChannel | 'all'>('all');

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (channelFilter !== 'all' && !p.channels.includes(channelFilter)) return false;
      return true;
    });
  }, [posts, statusFilter, channelFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {channelFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setChannelFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              channelFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Nenhum post encontrado</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PostCard key={p.id} post={p} onEdit={onEdit} onDelete={onDelete} onPublish={onPublish} />
          ))}
        </div>
      )}
    </div>
  );
}
