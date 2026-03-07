import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/ui/app-icon';

export function UpgradeBanner() {
  const { isFree } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return !!sessionStorage.getItem('upgrade-banner-dismissed');
  });

  if (!isFree || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('upgrade-banner-dismissed', '1');
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden animate-fade-in cursor-pointer mb-4"
      onClick={() => navigate('/plans')}
      style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #3d1466 30%, #6b2fa0 55%, #a855f7 80%, #e74694 100%)',
        minHeight: '140px',
      }}
    >
      {/* Decorative glow orbs */}
      <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
      <div className="absolute right-20 top-0 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
      <div className="absolute right-0 bottom-0 w-48 h-24 opacity-30" style={{ background: 'linear-gradient(160deg, transparent 30%, #f97316 60%, #ef4444 100%)', filter: 'blur(8px)' }} />

      {/* Sparkle dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/40"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center px-5 py-5 gap-4">
        {/* Icon cluster */}
        <div className="shrink-0 flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20">
          <div className="relative">
            {/* Shield */}
            <div
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                boxShadow: '0 0 24px rgba(249, 115, 22, 0.5)',
              }}
            >
              <AppIcon name="ShieldCheck" size={28} className="text-white" />
            </div>
            {/* Lock badge */}
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }}
            >
              <AppIcon name="Lock" size={12} className="text-white" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base lg:text-lg leading-tight">
            Liberte o poder
            <br />
            do Garden Gestão
          </h3>
          <p className="text-white/60 text-xs lg:text-sm mt-1 leading-snug">
            Atualize para acessar todas as funcionalidades exclusivas e avançadas.
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/plans'); }}
            className="mt-3 h-9 px-6 rounded-full text-xs font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #0d9488)',
              boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
            }}
          >
            Liberar tudo
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors z-20"
        aria-label="Fechar"
      >
        <AppIcon name="X" size={14} />
      </button>
    </div>
  );
}
