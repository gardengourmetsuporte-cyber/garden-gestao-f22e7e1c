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
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      {/* Promo header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <AppIcon name="CardGiftcard" size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {bonusPoints > 0
              ? `Cadastre-se e ganhe ${bonusPoints} pontos! 🎁`
              : 'Faça login e peça com mais agilidade'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bonusPoints > 0
              ? 'Use seus pontos para descontos na próxima compra'
              : 'Seus dados ficam salvos para próximos pedidos'}
          </p>
        </div>
      </div>

      {/* Quick login buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 border border-border/50 bg-card hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-medium text-foreground"
        >
          {loading ? (
            <AppIcon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
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
          className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 border border-border/50 bg-card hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-medium text-foreground"
        >
          <AppIcon name="Mail" size={16} />
          E-mail
        </button>
      </div>

      {/* Skip */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Continuar sem conta →
        </button>
      )}
    </div>
  );
}
