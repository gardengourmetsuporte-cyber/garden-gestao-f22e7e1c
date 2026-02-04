import { useState, useEffect } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIAssistant, useSystemAlerts } from '@/hooks/useAgenda';
import { useAgenda } from '@/hooks/useAgenda';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const quickQuestions = [
  { label: 'Resumo do dia', question: 'Me dê um resumo do dia e o que devo priorizar.' },
  { label: 'Estoque', question: 'Como está meu estoque? O que preciso fazer?' },
  { label: 'Prioridades', question: 'Quais são minhas prioridades para hoje?' },
];

export function AIAssistant() {
  const [question, setQuestion] = useState('');
  const { suggestion, isLoading, error, fetchSuggestion } = useAIAssistant();
  const { alerts, criticalStockCount, zeroStockCount, pendingRedemptions } = useSystemAlerts();
  const { tasks } = useAgenda();
  const { toast } = useToast();

  const pendingTasks = tasks.filter(t => !t.is_completed).length;
  const completedTasks = tasks.filter(t => t.is_completed).length;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'manhã';
    if (hour >= 12 && hour < 18) return 'tarde';
    return 'noite';
  };

  const buildContext = (userQuestion?: string) => ({
    criticalStockCount,
    zeroStockCount,
    pendingRedemptions,
    pendingTasks,
    completedTasks,
    checklistOpeningStatus: 'não verificado',
    checklistClosingStatus: 'não verificado',
    dayOfWeek: format(new Date(), 'EEEE', { locale: ptBR }),
    timeOfDay: getTimeOfDay(),
    userQuestion,
  });

  // Fetch initial suggestion on mount
  useEffect(() => {
    fetchSuggestion(buildContext()).catch(() => {
      // Silent fail on initial load
    });
  }, []);

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    
    try {
      await fetchSuggestion(buildContext(q));
      setQuestion('');
    } catch (err) {
      toast({
        title: 'Erro',
        description: error || 'Não foi possível obter resposta',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(question);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl p-4 lg:p-6 border shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Assistente de Gestão</h3>
          <p className="text-xs text-muted-foreground">Pergunte sobre sua operação</p>
        </div>
      </div>

      {/* AI Response */}
      <div className="min-h-[80px] mb-4 p-4 bg-card rounded-xl border">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm">Pensando...</span>
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
            Olá! Como posso ajudar você hoje?
          </p>
        )}
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickQuestions.map((q, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => handleAsk(q.question)}
            disabled={isLoading}
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            {q.label}
          </Button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Pergunte algo sobre sua operação..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="h-10"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-10 w-10 shrink-0"
          disabled={!question.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
