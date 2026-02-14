import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PostCard } from './PostCard';
import type { MarketingPost } from '@/types/marketing';

interface Props {
  posts: MarketingPost[];
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (p: MarketingPost) => void;
}

export function MarketingCalendar({ posts, onEdit, onDelete, onPublish }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const postsByDate = useMemo(() => {
    const map = new Map<string, MarketingPost[]>();
    posts.forEach(p => {
      const d = p.scheduled_at || p.created_at;
      const key = format(new Date(d), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [posts]);

  const selectedPosts = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return postsByDate.get(key) || [];
  }, [selectedDate, postsByDate]);

  const modifiers = useMemo(() => {
    const draft: Date[] = [];
    const scheduled: Date[] = [];
    const published: Date[] = [];
    postsByDate.forEach((ps, key) => {
      const d = new Date(key);
      const statuses = new Set(ps.map(p => p.status));
      if (statuses.has('published')) published.push(d);
      else if (statuses.has('scheduled')) scheduled.push(d);
      else draft.push(d);
    });
    return { draft, scheduled, published };
  }, [postsByDate]);

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={d => d && setSelectedDate(d)}
        locale={ptBR}
        modifiers={modifiers}
        modifiersClassNames={{
          draft: 'border-2 border-muted-foreground/40',
          scheduled: 'border-2 border-primary',
          published: 'border-2 border-emerald-500',
        }}
        className="rounded-xl border border-border/40 bg-card p-3 mx-auto"
      />

      {selectedPosts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} — {selectedPosts.length} post(s)
          </h3>
          {selectedPosts.map(p => (
            <PostCard key={p.id} post={p} onEdit={onEdit} onDelete={onDelete} onPublish={onPublish} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum post para {format(selectedDate, "dd/MM/yyyy")}
        </p>
      )}
    </div>
  );
}
