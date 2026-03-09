import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AISuggestionCard } from './AISuggestionCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUpcomingDates } from '@/lib/marketingDates';

interface Props {
  onSchedule: (data: any) => void;
}

export function MarketingDailyFeed({ onSchedule }: Props) {
  const { activeUnitId } = useUnit();
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const upcomingDates = getUpcomingDates(5);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['marketing-daily-suggestions', activeUnitId, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('marketing-daily-suggestions', {
        body: { unit_id: activeUnitId },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!activeUnitId,
    staleTime: 1000 * 60 * 60 * 12, // 12h cache
    retry: 1,
  });

  const handleGenerateImage = async (prompt: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('marketing-generate-image', {
        body: { prompt, unit_id: activeUnitId },
      });
      if (error) throw error;
      return data?.image_url || null;
    } catch (e) {
      toast.error('Erro ao gerar imagem');
      return null;
    }
  };

  const suggestions = data?.suggestions || [];

  return (
    <div className="space-y-5">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground capitalize">{todayLabel}</h2>
          <p className="text-xs text-muted-foreground">Sugestões personalizadas pela IA</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 text-xs"
        >
          <AppIcon name={isFetching ? "Loader2" : "RefreshCw"} size={14} className={isFetching ? "animate-spin mr-1" : "mr-1"} />
          Novas ideias
        </Button>
      </div>

      {/* Upcoming dates chips */}
      {upcomingDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {upcomingDates.map((d, i) => (
            <div key={i} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/40 text-xs">
              <span>{d.emoji}</span>
              <span className="font-medium text-foreground whitespace-nowrap">{d.title}</span>
              <span className="text-muted-foreground">{format(d.fullDate, 'dd/MM')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-center py-12 space-y-3">
          <AppIcon name="AlertCircle" size={32} className="mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Erro ao gerar sugestões</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <AppIcon name="RefreshCw" size={14} className="mr-1" /> Tentar novamente
          </Button>
        </div>
      )}

      {/* Suggestions grid */}
      {!isLoading && !error && suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion: any, i: number) => (
            <AISuggestionCard
              key={i}
              suggestion={suggestion}
              onSchedule={onSchedule}
              onGenerateImage={handleGenerateImage}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && suggestions.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <AppIcon name="Sparkles" size={32} className="mx-auto text-primary/40" />
          <p className="text-sm text-muted-foreground">Clique em "Novas ideias" para gerar sugestões</p>
        </div>
      )}
    </div>
  );
}
