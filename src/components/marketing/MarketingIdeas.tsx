import { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MarketingPost } from '@/types/marketing';

interface Props {
  posts: MarketingPost[];
  onCreate: (title: string) => void;
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
}

export function MarketingIdeas({ posts, onCreate, onEdit, onDelete }: Props) {
  const [idea, setIdea] = useState('');
  const drafts = posts.filter(p => p.status === 'draft' && p.media_urls.length === 0);

  const handleSubmit = () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setIdea('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="Anote uma ideia de conteúdo..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <Button size="icon" onClick={handleSubmit} disabled={!idea.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhuma ideia anotada. Comece digitando acima!
        </p>
      ) : (
        <div className="space-y-2">
          {drafts.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                {p.caption && (
                  <p className="text-xs text-muted-foreground truncate">{p.caption}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs gap-1"
                onClick={() => onEdit(p)}
              >
                Completar <ArrowRight className="w-3 h-3" />
              </Button>
              <button
                onClick={() => onDelete(p.id)}
                className="text-muted-foreground hover:text-destructive text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
