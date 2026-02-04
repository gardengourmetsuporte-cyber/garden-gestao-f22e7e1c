import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AISuggestionsProps {
  suggestion: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function AISuggestions({ suggestion, isLoading, error, onRefresh }: AISuggestionsProps) {
  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm">Sugestão do Assistente</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      <div className="min-h-[60px]">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
            <span className="text-sm ml-2">Analisando sua agenda...</span>
          </div>
        )}

        {error && !isLoading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {suggestion && !isLoading && !error && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {suggestion}
          </p>
        )}

        {!suggestion && !isLoading && !error && (
          <p className="text-sm text-muted-foreground">
            Clique em atualizar para obter sugestões personalizadas.
          </p>
        )}
      </div>
    </div>
  );
}
