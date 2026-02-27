import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import type { MarketingPost } from '@/types/marketing';

interface AISuggestion {
  title: string;
  caption: string;
  hashtags: string[];
  best_time: string;
  photo_tip?: string;
  product_name?: string;
}

interface Props {
  onSchedule: (data: Partial<MarketingPost>) => void;
}

const TOPIC_CHIPS = [
  { id: 'destaque', label: '⭐ Produto destaque', topic: 'Produto em destaque do cardápio' },
  { id: 'promo', label: '🏷️ Promoção', topic: 'Promoção ou desconto especial' },
  { id: 'novidade', label: '🆕 Novidade', topic: 'Novidade no cardápio ou no negócio' },
  { id: 'engajamento', label: '💬 Engajamento', topic: 'Post para engajar seguidores e gerar interação' },
  { id: 'bastidores', label: '🎬 Bastidores', topic: 'Bastidores do dia a dia, preparo dos pratos' },
  { id: 'data', label: '📅 Data especial', topic: 'Data comemorativa ou sazonal relevante' },
];

export function MarketingIdeasAI({ onSchedule }: Props) {
  const { activeUnitId } = useUnit();
  const [prompt, setPrompt] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async (topic?: string, customPrompt?: string) => {
    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('marketing-suggestions', {
        body: {
          prompt: customPrompt || prompt.trim() || undefined,
          unit_id: activeUnitId,
          topic: topic || undefined,
        },
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

  const handleTopicClick = (chip: typeof TOPIC_CHIPS[0]) => {
    setActiveTopic(chip.id);
    handleGenerate(chip.topic);
  };

  const handleCustomGenerate = () => {
    if (!prompt.trim()) return;
    setActiveTopic(null);
    handleGenerate(undefined, prompt.trim());
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

  const fullCaption = (s: AISuggestion) =>
    s.caption + '\n\n' + s.hashtags.map(h => `#${h}`).join(' ');

  return (
    <div className="space-y-4">
      {/* Topic chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <AppIcon name="Sparkles" size={16} className="text-foreground" />
          <span className="text-sm font-medium text-foreground">Escolha um tema</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {TOPIC_CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => handleTopicClick(chip)}
              disabled={loading}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTopic === chip.id
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground border border-border/50 hover:border-foreground/20'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground px-1">Ou descreva seu tema</span>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: 'Promoção de almoço executivo', 'Novo prato do cardápio'..."
          rows={2}
          className="resize-none"
        />
        <Button
          onClick={handleCustomGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? <AppIcon name="progress_activity" size={16} className="animate-spin" /> : <AppIcon name="Sparkles" size={16} />}
          {loading ? 'Gerando ideias...' : 'Gerar sugestões'}
        </Button>
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground px-1">
            {suggestions.length} sugestões geradas
          </h3>
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card p-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                {s.product_name && (
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground font-medium">
                    📦 {s.product_name}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{s.caption}</p>

              {/* Photo tip */}
              {s.photo_tip && (
                <div className="flex gap-2 items-start rounded-lg bg-secondary/50 p-2.5">
                  <AppIcon name="Camera" size={14} className="text-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-semibold text-foreground block mb-0.5">Dica de foto</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{s.photo_tip}</p>
                  </div>
                </div>
              )}

              {s.hashtags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {s.hashtags.map(h => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/70">
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
                  onClick={() => handleCopy(fullCaption(s), i)}
                >
                  {copiedIdx === i ? <AppIcon name="Check" size={12} /> : <AppIcon name="Copy" size={12} />}
                  {copiedIdx === i ? 'Copiado' : 'Copiar'}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs gap-1.5 bg-foreground text-background hover:bg-foreground/90"
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
            Selecione um tema acima ou descreva o que você quer publicar. A IA vai analisar seu cardápio e clientes para criar sugestões personalizadas.
          </p>
        </div>
      )}
    </div>
  );
}
