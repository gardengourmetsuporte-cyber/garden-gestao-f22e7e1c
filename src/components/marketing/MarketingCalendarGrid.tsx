import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPostsSheet } from './DayPostsSheet';
import { getDateForDay } from '@/lib/marketingDates';
import type { MarketingPost } from '@/types/marketing';
import { cn } from '@/lib/utils';
import { UnifiedMonthGrid } from '@/components/ui/unified-month-grid';
import { UnifiedMonthNav } from '@/components/ui/unified-month-nav';
import { addMonths, subMonths } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  scheduled: 'bg-primary',
  published: 'bg-emerald-500',
  failed: 'bg-destructive',
};

interface Props {
  posts: MarketingPost[];
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (p: MarketingPost) => void;
  onNewPost: (date: Date) => void;
}

export function MarketingCalendarGrid({ posts, onEdit, onDelete, onPublish, onNewPost }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const handleDayClick = (dateKey: string) => {
    if (!dateKey) return;
    const day = new Date(dateKey + 'T12:00:00');
    setSelectedDate(day);
    setSheetOpen(true);
  };

  const selectedPosts = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return postsByDate.get(key) || [];
  }, [selectedDate, postsByDate]);

  const renderDayContent = (day: Date, dateKey: string) => {
    const dayPosts = postsByDate.get(dateKey) || [];
    const specialDate = getDateForDay(day.getMonth() + 1, day.getDate());
    const maxChips = 3;

    return (
      <>
        {specialDate && (
          <span className="text-[10px] absolute top-0.5 right-1" title={specialDate.title}>{specialDate.emoji}</span>
        )}
        <div className="space-y-0.5 mt-0.5">
          {dayPosts.slice(0, maxChips).map(p => (
            <div
              key={p.id}
              className={`w-full h-[14px] rounded-sm px-1 flex items-center ${statusColors[p.status] || statusColors.draft}`}
            >
              <span className="text-[8px] text-white truncate font-medium leading-none">
                {p.title}
              </span>
            </div>
          ))}
          {dayPosts.length > maxChips && (
            <span className="text-[9px] text-muted-foreground pl-0.5">
              +{dayPosts.length - maxChips}
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <UnifiedMonthNav
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          showToday
          onTodayClick={() => setCurrentMonth(new Date())}
        />
      </div>

      {/* Calendar Grid */}
      <UnifiedMonthGrid
        currentMonth={currentMonth}
        selectedDate={null}
        onSelectDate={handleDayClick}
        renderDayContent={renderDayContent}
        disableOutsideMonth={false}
      />

      {/* Status Legend */}
      <div className="flex gap-3 justify-center">
        {[
          { label: 'Rascunho', color: 'bg-muted-foreground/40' },
          { label: 'Agendado', color: 'bg-primary' },
          { label: 'Publicado', color: 'bg-emerald-500' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Day Posts Sheet */}
      <DayPostsSheet
        date={selectedDate}
        posts={selectedPosts}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onPublish={onPublish}
        onNewPost={onNewPost}
      />
    </div>
  );
}
