import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NPSSurveyWidgetProps {
  unitId: string;
  orderId?: string;
  customerName?: string;
  onSubmit: (score: number, comment: string) => void;
  onDismiss: () => void;
}

export function NPSSurveyWidget({ unitId, orderId, customerName, onSubmit, onDismiss }: NPSSurveyWidgetProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (score === null) return;
    onSubmit(score, comment);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
          <AppIcon name="Heart" size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Obrigado!</h3>
        <p className="text-sm text-muted-foreground">Sua opinião é muito importante para nós.</p>
      </div>
    );
  }

  const getEmoji = (val: number) => {
    if (val <= 3) return '😞';
    if (val <= 5) return '😐';
    if (val <= 7) return '🙂';
    if (val <= 8) return '😊';
    return '🤩';
  };

  const getLabel = (val: number) => {
    if (val <= 6) return 'Detrator';
    if (val <= 8) return 'Neutro';
    return 'Promotor';
  };

  const getLabelColor = (val: number) => {
    if (val <= 6) return 'text-red-500';
    if (val <= 8) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <h3 className="text-base font-bold text-foreground">Como foi sua experiência?</h3>
        <p className="text-xs text-muted-foreground mt-1">De 0 a 10, quanto recomendaria nosso estabelecimento?</p>
      </div>

      {/* Score buttons */}
      <div className="flex gap-1 justify-center flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => setScore(i)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
              score === i
                ? i <= 6
                  ? 'bg-red-500 text-white scale-110'
                  : i <= 8
                  ? 'bg-amber-500 text-white scale-110'
                  : 'bg-emerald-500 text-white scale-110'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      {score !== null && (
        <div className="text-center">
          <span className="text-2xl">{getEmoji(score)}</span>
          <span className={`text-xs font-medium ml-2 ${getLabelColor(score)}`}>{getLabel(score)}</span>
        </div>
      )}

      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>

      <Textarea
        placeholder="Deixe um comentário (opcional)..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="text-sm"
        rows={2}
      />

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onDismiss} className="flex-1 text-xs">
          Pular
        </Button>
        <Button onClick={handleSubmit} disabled={score === null} className="flex-1 text-xs">
          Enviar Avaliação
        </Button>
      </div>
    </div>
  );
}
