import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PostCard } from './PostCard';
import { getDateForDay } from '@/lib/marketingDates';
import type { MarketingPost } from '@/types/marketing';

interface Props {
  date: Date | null;
  posts: MarketingPost[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (p: MarketingPost) => void;
  onNewPost: (date: Date) => void;
}

export function DayPostsSheet({ date, posts, open, onOpenChange, onEdit, onDelete, onPublish, onNewPost }: Props) {
  if (!date) return null;

  const specialDate = getDateForDay(date.getMonth() + 1, date.getDate());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{format(date, "dd 'de' MMMM", { locale: ptBR })}</SheetTitle>
          <SheetDescription>
            {specialDate
              ? `${specialDate.emoji} ${specialDate.title}`
              : `${posts.length} post(s) neste dia`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-4">
          {specialDate && posts.length === 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
              <p className="text-sm text-primary font-medium">{specialDate.emoji} {specialDate.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{specialDate.suggestion}</p>
            </div>
          )}

          {posts.map(p => (
            <PostCard key={p.id} post={p} onEdit={onEdit} onDelete={onDelete} onPublish={onPublish} />
          ))}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onNewPost(date);
              onOpenChange(false);
            }}
          >
            <Plus className="w-4 h-4" /> Novo post para este dia
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
