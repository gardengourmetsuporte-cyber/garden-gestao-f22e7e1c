import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/ui/app-icon';

export function TrialBanner() {
  const { planStatus, trialEndsAt } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || planStatus !== 'trialing' || !trialEndsAt) return null;

  const now = new Date();
  const end = new Date(trialEndsAt);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return (
    <div className="mx-3 mt-2 relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center hover:bg-amber-500/20 transition-colors"
      >
        <AppIcon name="X" size={12} className="text-amber-600 dark:text-amber-400" />
      </button>

      <div className="relative z-10 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <AppIcon name="Clock" size={14} className="text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Período de Teste
          </span>
        </div>
        <p className="text-xs font-semibold text-foreground leading-tight mb-2">
          {daysLeft === 1
            ? 'Seu teste expira amanhã!'
            : `Seu teste expira em ${daysLeft} dias`}
        </p>
        <p className="text-[11px] text-muted-foreground mb-2.5">
          Assine um plano para continuar usando todos os recursos.
        </p>
        <button
          onClick={() => navigate('/plans')}
          className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 transition-colors"
        >
          Ver Planos
        </button>
      </div>
    </div>
  );
}
