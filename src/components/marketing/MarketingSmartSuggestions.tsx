import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { getDatesForMonth } from '@/lib/marketingDates';

interface Props {
  currentMonth: Date;
  onSuggestionClick: (title: string, date: Date) => void;
}

export function MarketingSmartSuggestions({ currentMonth, onSuggestionClick }: Props) {
  const suggestions = useMemo(() => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    return getDatesForMonth(month).map(d => ({
      ...d,
      fullDate: new Date(year, d.month - 1, d.day),
    }));
  }, [currentMonth]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Datas importantes</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s.title, s.fullDate)}
            className="flex-shrink-0 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left max-w-[180px]"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">{s.emoji}</span>
              <span className="text-xs font-semibold text-foreground truncate">{s.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{s.suggestion}</p>
            <p className="text-[10px] text-primary font-medium mt-0.5">
              {String(s.day).padStart(2, '0')}/{String(s.month).padStart(2, '0')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
