import { Button } from '@/components/ui/button';
import type { GamificationPrize } from '@/hooks/useGamification';
import { AppIcon } from '@/components/ui/app-icon';
import { useEffect, useState } from 'react';

interface PrizeResultProps {
  prize: GamificationPrize;
  onFinish: () => void;
}

export function PrizeResult({ prize, onFinish }: PrizeResultProps) {
  const [showContent, setShowContent] = useState(false);
  const isWin = prize.type !== 'empty';

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      {/* Confetti emojis for wins */}
      {isWin && (
        <div className="text-5xl animate-bounce">🎉</div>
      )}

      <div
        className={`transition-all duration-700 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{
            background: isWin
              ? `linear-gradient(135deg, ${prize.color}, hsl(var(--primary)))`
              : 'hsl(var(--muted))',
            boxShadow: isWin ? `0 0 40px ${prize.color}60` : 'none',
          }}
        >
          <span className="text-5xl">{prize.icon}</span>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isWin ? 'Parabéns! 🎊' : 'Quase lá!'}
        </h2>

        <p className="text-lg text-muted-foreground mb-1">
          {isWin ? 'Você ganhou:' : 'Não foi dessa vez...'}
        </p>

        <p className="text-xl font-bold text-primary">
          {prize.name}
        </p>
      </div>

      {isWin && (
        <div className="bg-card border border-border/50 rounded-xl p-4 max-w-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AppIcon name="Info" size={16} />
            <span>Mostre esta tela no caixa para resgatar</span>
          </div>
        </div>
      )}

      <Button
        size="lg"
        onClick={onFinish}
        className="mt-4 min-w-[200px] text-lg py-6"
      >
        Finalizar
      </Button>
    </div>
  );
}
