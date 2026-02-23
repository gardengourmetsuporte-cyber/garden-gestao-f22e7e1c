import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MarketingPost } from '@/types/marketing';

interface AISuggestion {
  title: string;
  caption: string;
  hashtags: string[];
  best_time: string;
}

interface Props {
  onSchedule: (data: Partial<MarketingPost>) => void;
}

export function MarketingIdeasAI({ onSchedule }: Props) {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('marketing-suggestions', {
        body: { prompt: trimmed },
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        toast.error('Resposta inesperada da IA');
      }
    } catch (err: any) {
      if (err?.status === 429) {
        toast.error('Limite de requisições atingido. Tente novamente em instantes.');
      } else if (err?.status === 402) {
        toast.error('Créditos insuficientes para IA.');
      } else {
        toast.error('Erro ao gerar sugestões');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success('Copiado!');
  };

  const handleSchedule = (s: AISuggestion) => {
    onSchedule({
      title: s.title,
      caption: s.caption + '\n\n' + s.hashtags.map(h => `#${h}`).join(' '),
      status: 'draft',
      tags: s.hashtags,
    });
    toast.success('Post criado como rascunho!');
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <AppIcon name="Sparkles" size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Gerador de conteúdo</span>
        </div>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Sobre o que você quer postar? Ex: 'Promoção de almoço executivo', 'Novo prato do cardápio', 'Dia dos Namorados'..."
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full gap-2"
        >
          {loading ? <AppIcon name="progress_activity" size={16} className="animate-spin" /> : <AppIcon name="Sparkles" size={16} />}
          {loading ? 'Gerando ideias...' : 'Gerar sugestões com IA'}
        </Button>
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground px-1">
            {suggestions.length} sugestões geradas
          </h3>
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{s.caption}</p>

              {s.hashtags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {s.hashtags.map(h => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      #{h}
                    </span>
                  ))}
                </div>
              )}

              {s.best_time && (
                <p className="text-[10px] text-muted-foreground">
                  ⏰ Melhor horário: <span className="font-medium text-foreground">{s.best_time}</span>
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1.5"
                  onClick={() => handleCopy(s.caption + '\n\n' + s.hashtags.map(h => `#${h}`).join(' '), i)}
                >
                  {copiedIdx === i ? <AppIcon name="Check" size={12} /> : <AppIcon name="Copy" size={12} />}
                  {copiedIdx === i ? 'Copiado' : 'Copiar'}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs gap-1.5"
                  onClick={() => handleSchedule(s)}
                >
                  <AppIcon name="calendar_add_on" size={12} /> Criar post
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="text-center py-8">
          <AppIcon name="Sparkles" size={32} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Descreva o que você quer publicar e a IA criará sugestões completas com legenda, hashtags e melhor horário.
          </p>
        </div>
      )}
    </div>
  );
}
