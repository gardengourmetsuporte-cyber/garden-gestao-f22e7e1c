import { Bot, Plus, X, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecurringSuggestion, useRecurringSuggestions } from '@/hooks/useRecurringSuggestions';
import { getCategoryInfo } from '@/hooks/useSubscriptions';

const sourceLabels: Record<string, string> = {
  known_service: 'Serviço conhecido',
  ai: 'IA detectou',
  pattern: 'Padrão detectado',
};

export function RecurringSuggestions() {
  const { suggestions, isLoading, accept, dismiss } = useRecurringSuggestions();

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-foreground">Sugestões da IA</h3>
          <p className="text-[10px] text-muted-foreground">Detectamos gastos recorrentes no seu financeiro</p>
        </div>
        <Badge className="ml-auto bg-primary/15 text-primary border-0 text-[10px]">
          <Sparkles className="w-3 h-3 mr-1" />
          {suggestions.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 5).map((s, i) => (
          <SuggestionCard key={`${s.name}-${i}`} suggestion={s} onAccept={accept} onDismiss={dismiss} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onAccept, onDismiss }: {
  suggestion: RecurringSuggestion;
  onAccept: (s: RecurringSuggestion) => void;
  onDismiss: (name: string) => void;
}) {
  const cat = getCategoryInfo(suggestion.category);

  return (
    <div className="bg-secondary/40 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '22' }}>
            <span className="text-xs font-bold" style={{ color: cat.color }}>{suggestion.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{suggestion.name}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] h-4 border-0 bg-muted/50 px-1.5">{cat.label}</Badge>
              <span className="text-[10px] text-muted-foreground">{sourceLabels[suggestion.source] || 'Detectado'}</span>
            </div>
          </div>
        </div>
        <p className="text-sm font-bold text-foreground shrink-0">R$ {suggestion.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 h-8 text-xs gap-1 rounded-xl"
          onClick={() => onAccept(suggestion)}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
          onClick={() => onDismiss(suggestion.name)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
