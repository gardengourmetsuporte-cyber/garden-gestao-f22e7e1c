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
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Top bar */}
      <div className="h-1.5 bg-gray-900 w-full shrink-0" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo */}
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center mb-5 shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt={unitName || 'Logo'} className="w-full h-full object-contain p-2" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain p-3" />
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900 text-center">{unitName || 'Restaurante'}</h1>

          {/* City */}
          {city && (
            <p className="text-sm text-gray-500 mt-1.5">{city}</p>
          )}

          {/* Tags: cuisine + status */}
          <div className="flex items-center gap-2.5 mt-4">
            {cuisineType && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600">
                <AppIcon name="Restaurant" size={14} className="text-gray-400" />
                {cuisineType}
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
              isOpen
                ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                : 'border-red-200 text-red-500 bg-red-50'
            }`}>
              <AppIcon name="Schedule" size={14} />
              {isOpen ? 'Aberto' : 'Fechada'}
            </div>
          </div>

          {/* Spacer */}
          <div className="mt-12 w-full">
            <p className="text-sm text-gray-700 text-center font-medium mb-5">
              Faça login e peça com mais agilidade
            </p>

            {/* Google */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!loading}
              className="w-full h-14 rounded-xl flex items-center border border-gray-200 disabled:opacity-60 transition-opacity mb-3 bg-white hover:bg-gray-50 active:scale-[0.98]"
            >
              <div className="h-full w-16 flex items-center justify-center shrink-0">
                {loading === 'google' ? (
                  <AppIcon name="Loader2" size={22} className="animate-spin text-gray-400" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
              </div>
              <span className="flex-1 text-center text-sm font-medium text-gray-700 pr-16">Continuar com Google</span>
            </button>

            {/* Email */}
            <button
              onClick={onEmailLogin}
              disabled={!!loading}
              className="w-full h-14 rounded-xl flex items-center border border-gray-900 disabled:opacity-60 transition-opacity bg-white hover:bg-gray-50 active:scale-[0.98]"
            >
              <div className="h-full w-16 flex items-center justify-center shrink-0">
                <AppIcon name="Mail" size={20} className="text-gray-900" />
              </div>
              <span className="flex-1 text-center text-sm font-medium text-gray-700 pr-16">Continuar com e-mail</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Skip - Ver cardápio */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full h-14 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 active:scale-[0.98] transition-all"
              >
                Ver cardápio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 pb-6 flex items-center justify-center">
        <p className="text-xs text-gray-400">
          Uma experiência <span className="font-bold text-gray-500">Garden</span>
        </p>
      </div>
    </div>
  );
}
