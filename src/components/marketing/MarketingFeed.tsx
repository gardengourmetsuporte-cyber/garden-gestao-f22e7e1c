import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c = { draft: 0, scheduled: 0, published: 0 };
    posts.forEach(p => {
      if (p.status in c) c[p.status as keyof typeof c]++;
    });
    return c;
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (channelFilter !== 'all' && !p.channels.includes(channelFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !(p.caption || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [posts, statusFilter, channelFilter, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar posts..."
          className="pl-9"
        />
      </div>

      {/* Status filters with counts */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusFilters.map(f => {
          const count = f.value === 'all' ? posts.length : counts[f.value as keyof typeof counts] || 0;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {f.label}
              <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                statusFilter === f.value ? 'bg-primary-foreground/20' : 'bg-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
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
