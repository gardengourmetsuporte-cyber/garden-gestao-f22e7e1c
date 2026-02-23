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
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <AppIcon name="Sparkles" size={14} className="text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Próximas oportunidades</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestions.map((s, i) => {
          const isCommercial = s.type === 'recurring';
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(s.title, s.fullDate)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl border transition-colors text-left max-w-[180px] ${
                isCommercial
                  ? 'border-warning/30 bg-warning/5 hover:bg-warning/10'
                  : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{s.emoji}</span>
                <span className="text-xs font-semibold text-foreground truncate">{s.title}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{s.suggestion}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isCommercial && <AppIcon name="TrendingUp" size={10} className="text-warning" />}
                <p className={`text-[10px] font-medium ${isCommercial ? 'text-warning' : 'text-primary'}`}>
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
