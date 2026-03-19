import { AppIcon } from '@/components/ui/app-icon';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { useState } from 'react';

interface Props {
  bonusPoints?: number;
  onEmailLogin?: () => void;
  onSkip?: () => void;
}

export function CustomerAuthBanner({ bonusPoints = 0, onEmailLogin, onSkip }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.href,
      });
      if (result.error) toast.error('Erro ao fazer login');
    } catch {
      toast.error('Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-primary/25" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))' }}>
      {/* Hero promotional section */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}>
          <span className="text-2xl">🪙</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-foreground leading-tight">
            Ganhe Garden Coins! 🎉
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {bonusPoints > 0
              ? `Cadastre-se agora e ganhe ${bonusPoints} moedas de bônus! Acumule pontos a cada pedido e troque por produtos grátis.`
              : 'Faça login e acumule moedas a cada pedido. Troque por produtos grátis e descontos exclusivos!'}
          </p>
        </div>
      </div>

      {/* Benefits strip */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <AppIcon name="Star" size={12} className="text-primary" />
          <span>Cashback</span>
        </div>
        <div className="w-px h-3 bg-border/40" />
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <AppIcon name="CardGiftcard" size={12} className="text-primary" />
          <span>Produtos grátis</span>
        </div>
        <div className="w-px h-3 bg-border/40" />
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <AppIcon name="Percent" size={12} className="text-primary" />
          <span>Descontos</span>
        </div>
      </div>

      {/* Login buttons */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 bg-card border border-border/50 hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold text-foreground shadow-sm"
        >
          {loading ? (
            <AppIcon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Google
        </button>
        <button
          onClick={onEmailLogin}
          disabled={loading}
          className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 bg-card border border-border/50 hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold text-foreground shadow-sm"
        >
          <AppIcon name="Mail" size={18} />
          E-mail
        </button>
      </div>

      {/* Skip */}
      {onSkip && (
        <div className="px-4 pb-3">
          <button
            onClick={onSkip}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 font-medium"
          >
            Continuar sem conta →
          </button>
        </div>
      )}
    </div>
  );
}
