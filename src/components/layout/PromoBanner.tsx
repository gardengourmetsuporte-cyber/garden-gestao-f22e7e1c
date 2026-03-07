import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';

// Hardcoded promo end date — change as needed
const PROMO_END = new Date('2026-03-31T23:59:59');

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState(() => Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSecs = Math.floor(remaining / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return { days, hours, minutes, seconds, expired: remaining <= 0 };
}

export function PromoBanner() {
  const navigate = useNavigate();
  const { days, hours, minutes, seconds, expired } = useCountdown(PROMO_END);
  const [dismissed, setDismissed] = useState(false);

  if (expired || dismissed) return null;

  return (
    <div className="mx-3 mb-2 relative overflow-hidden rounded-xl border border-sidebar-primary/20">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--sidebar-primary)), hsl(var(--sidebar-primary) / 0.3))',
        }}
      />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors"
      >
        <AppIcon name="X" size={12} className="text-sidebar-foreground/50" />
      </button>

      <div className="relative z-10 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <AppIcon name="Sparkles" size={14} className="text-sidebar-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-primary">Oferta Especial</span>
        </div>
        <p className="text-xs font-semibold text-sidebar-foreground leading-tight mb-2">
          Upgrade para o plano Pro com 30% OFF
        </p>

        {/* Countdown */}
        <div className="flex gap-1.5 mb-2.5">
          {[
            { val: days, label: 'd' },
            { val: hours, label: 'h' },
            { val: minutes, label: 'm' },
            { val: seconds, label: 's' },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-0.5">
              <span className="bg-sidebar-accent/80 text-sidebar-foreground text-[11px] font-bold rounded px-1.5 py-0.5 min-w-[24px] text-center tabular-nums">
                {String(t.val).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-sidebar-foreground/40">{t.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/plans')}
          className="w-full py-1.5 rounded-lg text-[11px] font-bold text-sidebar-primary-foreground bg-sidebar-primary hover:bg-sidebar-primary/90 transition-colors"
        >
          Aproveitar Agora
        </button>
      </div>
    </div>
  );
}
