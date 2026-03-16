import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'comida', label: 'Comida', icon: 'Restaurant', emoji: '🍽️' },
  { id: 'atendimento', label: 'Atendimento', icon: 'PersonCheck', emoji: '🤝' },
  { id: 'ambiente', label: 'Ambiente', icon: 'Home', emoji: '✨' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Ruim 😔',
  2: 'Regular 😐',
  3: 'Bom 👍',
  4: 'Muito bom 😊',
  5: 'Excelente 🎉',
};

function StarRow({ value, onChange, label, emoji }: { value: number; onChange: (v: number) => void; label: string; emoji: string }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-28 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-bold text-foreground">{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="transition-transform active:scale-90 hover:scale-110 p-0.5"
          >
            <AppIcon
              name="Star"
              size={32}
              className={cn(
                'transition-colors duration-200',
                star <= value ? 'text-amber-400' : 'text-muted-foreground/15'
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-[11px] text-muted-foreground font-medium w-20 text-right shrink-0">
          {RATING_LABELS[value]}
        </span>
      )}
    </div>
  );
}

export default function TabletReview() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa') || '1';

  const [ratings, setRatings] = useState<Record<string, number>>({
    comida: 0,
    atendimento: 0,
    ambiente: 0,
  });
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const setRating = (cat: string, value: number) => {
    setRatings(prev => ({ ...prev, [cat]: value }));
  };

  const avgRating = () => {
    const vals = Object.values(ratings).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const hasAnyRating = Object.values(ratings).some(v => v > 0);

  const handleSubmit = async () => {
    if (!hasAnyRating) { toast.error('Avalie pelo menos uma categoria'); return; }
    if (!unitId) return;

    setSending(true);
    try {
      const { error } = await supabase.from('customer_reviews').insert({
        unit_id: unitId,
        customer_name: name.trim().slice(0, 100) || `Mesa ${mesa}`,
        mesa,
        rating: avgRating(),
        comment: comment.trim().slice(0, 500) || null,
        category: 'geral',
        rating_comida: ratings.comida || null,
        rating_atendimento: ratings.atendimento || null,
        rating_ambiente: ratings.ambiente || null,
      } as any);
      if (error) throw error;
      setSent(true);
      toast.success('Obrigado pela sua avaliação!');
    } catch {
      toast.error('Erro ao enviar avaliação.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center gap-6 px-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
          <span className="text-5xl">💚</span>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-foreground">Obrigado!</h1>
          <p className="text-muted-foreground text-sm">Sua avaliação é muito importante para nós.</p>
        </div>

        {/* Summary */}
        <div className="w-full max-w-xs space-y-2 bg-card/50 rounded-2xl p-4 border border-border/20">
          {CATEGORIES.map(cat => (
            ratings[cat.id] > 0 && (
              <div key={cat.id} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{cat.emoji} {cat.label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <AppIcon key={s} name="Star" size={14} className={s <= ratings[cat.id] ? 'text-amber-400' : 'text-muted-foreground/15'} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <button
          onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)}
          className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center gap-3 px-5 border-b border-border/20 shrink-0">
        <button
          onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)}
          className="w-9 h-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center"
        >
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Avalie sua Experiência</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
          {/* Category ratings */}
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground mb-4">Como foi cada aspecto?</p>
            <div className="bg-card/40 rounded-2xl border border-border/15 px-4 divide-y divide-border/10">
              {CATEGORIES.map(cat => (
                <StarRow
                  key={cat.id}
                  value={ratings[cat.id]}
                  onChange={(v) => setRating(cat.id, v)}
                  label={cat.label}
                  emoji={cat.emoji}
                />
              ))}
            </div>
          </div>

          {/* Average display */}
          {hasAnyRating && (
            <div className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/15">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <AppIcon key={s} name="Star" size={20} className={s <= avgRating() ? 'text-amber-400' : 'text-muted-foreground/15'} />
                ))}
              </div>
              <span className="text-sm font-black text-amber-400">{avgRating()}/5</span>
              <span className="text-xs text-muted-foreground">média geral</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Seu nome (opcional)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como quer ser chamado?"
              maxLength={100}
              className="w-full h-12 rounded-2xl bg-card border border-border/20 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Comentário (opcional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={3}
              maxLength={500}
              className="w-full rounded-2xl bg-card border border-border/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={sending || !hasAnyRating}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-base disabled:opacity-40 active:scale-[0.97] transition-transform"
          >
            {sending ? 'Enviando...' : 'Enviar Avaliação ⭐'}
          </button>
        </div>
      </div>
    </div>
  );
}
