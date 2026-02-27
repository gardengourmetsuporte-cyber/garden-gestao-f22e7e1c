import { useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUpcomingDates } from '@/lib/marketingDates';

interface Props {
  onSuggestionClick: (title: string, date: Date) => void;
}

export function MarketingSmartSuggestions({ onSuggestionClick }: Props) {
  const suggestions = useMemo(() => getUpcomingDates(10), []);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3 mb-2">
      <div className="flex items-center gap-1.5 px-1">
        <AppIcon name="Sparkles" size={14} className="text-primary" />
        <span className="text-xs font-semibold text-foreground">Próximas oportunidades</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {suggestions.map((s, i) => {
          const isCommercial = s.type === 'recurring';
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(s.title, s.fullDate)}
              className="flex-shrink-0 w-[200px] p-3.5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all active:scale-[0.97] text-left space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{s.emoji}</span>
                <span className="text-sm font-bold text-foreground truncate">{s.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{s.suggestion}</p>
              <div className="flex items-center gap-1 pt-0.5">
                {isCommercial && <AppIcon name="TrendingUp" size={11} className="text-[hsl(var(--neon-amber))]" />}
                <p className={`text-[11px] font-semibold ${isCommercial ? 'text-[hsl(var(--neon-amber))]' : 'text-primary'}`}>
                  {format(s.fullDate, "dd/MM", { locale: ptBR })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
