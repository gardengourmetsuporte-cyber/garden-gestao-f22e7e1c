import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';

interface Props {
  unitName?: string;
  logoUrl?: string;
  cuisineType?: string;
  city?: string;
  isOpen?: boolean;
  onSkip?: () => void;
  onEmailLogin?: () => void;
}

export function MenuCustomerAuth({ unitName, logoUrl, cuisineType, city, isOpen = true, onSkip, onEmailLogin }: Props) {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.href,
      });
      if (result.error) {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } catch {
      toast.error('Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSkip} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border/40 animate-in slide-in-from-bottom-8 duration-300 max-h-[90dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-8 flex flex-col items-center">
          {/* Logo */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-card border border-border/30 flex items-center justify-center mb-4 shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt={unitName || 'Logo'} className="w-full h-full object-contain p-2" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain p-3" />
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl font-bold text-foreground text-center">{unitName || 'Restaurante'}</h1>

          {/* City */}
          {city && (
            <p className="text-sm text-muted-foreground mt-1">{city}</p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2.5 mt-3">
            {cuisineType && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 text-xs text-muted-foreground">
                <AppIcon name="Restaurant" size={14} className="text-muted-foreground/60" />
                {cuisineType}
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
              isOpen
                ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'border-destructive/20 text-destructive bg-destructive/10'
            }`}>
              <AppIcon name="Schedule" size={14} />
              {isOpen ? 'Aberto' : 'Fechado'}
            </div>
          </div>

          {/* Login section */}
          <div className="mt-8 w-full">
            <p className="text-sm text-muted-foreground text-center font-medium mb-5">
              Faça login e peça com mais agilidade
            </p>

            {/* Google */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!loading}
              className="w-full h-14 rounded-xl flex items-center border border-border/50 disabled:opacity-60 transition-opacity mb-3 bg-card hover:bg-accent active:scale-[0.98]"
            >
              <div className="h-full w-16 flex items-center justify-center shrink-0">
                {loading === 'google' ? (
                  <AppIcon name="Loader2" size={22} className="animate-spin text-muted-foreground" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
              </div>
              <span className="flex-1 text-center text-sm font-medium text-foreground pr-16">Continuar com Google</span>
            </button>

            {/* Email */}
            <button
              onClick={onEmailLogin}
              disabled={!!loading}
              className="w-full h-14 rounded-xl flex items-center border border-foreground/20 disabled:opacity-60 transition-opacity bg-card hover:bg-accent active:scale-[0.98]"
            >
              <div className="h-full w-16 flex items-center justify-center shrink-0">
                <AppIcon name="Mail" size={20} className="text-foreground" />
              </div>
              <span className="flex-1 text-center text-sm font-medium text-foreground pr-16">Continuar com e-mail</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Skip */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Continuar sem conta
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pb-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Uma experiência <span className="font-bold text-foreground/60">Garden</span>
          </p>
        </div>
      </div>
    </div>
  );
}
