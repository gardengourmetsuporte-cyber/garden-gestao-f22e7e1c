import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'comida', label: 'Comida', icon: 'Restaurant' },
  { id: 'atendimento', label: 'Atendimento', icon: 'PersonCheck' },
  { id: 'ambiente', label: 'Ambiente', icon: 'Home' },
  { id: 'geral', label: 'Geral', icon: 'Star' },
];

export default function TabletReview() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa') || '1';

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('geral');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Selecione uma nota'); return; }
    if (!unitId) return;

    setSending(true);
    try {
      const { error } = await supabase.from('customer_reviews').insert({
        unit_id: unitId,
        customer_name: name || `Mesa ${mesa}`,
        mesa,
        rating,
        comment: comment || null,
        category,
      });
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
          <AppIcon name="Heart" size={48} className="text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Obrigado!</h1>
          <p className="text-muted-foreground mt-2">Sua avaliação é muito importante para nós.</p>
        </div>
        <button
          onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)}
          className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
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
        <h1 className="text-base font-bold text-foreground">Avalie o Local</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
          {/* Stars */}
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Como foi sua experiência?</p>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90 hover:scale-110"
                >
                  <AppIcon
                    name="Star"
                    size={44}
                    className={cn(
                      'transition-colors',
                      star <= rating ? 'text-amber-400' : 'text-muted-foreground/20'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground animate-in fade-in duration-200">
                {rating <= 2 ? 'Sentimos muito 😔' : rating <= 3 ? 'Pode melhorar!' : rating === 4 ? 'Muito bom! 😊' : 'Excelente! 🎉'}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">O que você está avaliando?</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all',
                    category === cat.id
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-card border-border/20 text-muted-foreground hover:border-border/40'
                  )}
                >
                  <AppIcon name={cat.icon} size={20} />
                  <span className="text-[11px] font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Seu nome (opcional)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como quer ser chamado?"
              className="w-full h-12 rounded-xl bg-card border border-border/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Comentário (opcional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={4}
              maxLength={500}
              className="w-full rounded-xl bg-card border border-border/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={sending || rating === 0}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {sending ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}
