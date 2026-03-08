import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';

interface Props {
  unitName?: string;
  logoUrl?: string;
  onSkip?: () => void;
}

export function MenuCustomerAuth({ unitName, logoUrl, onSkip }: Props) {
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
      {/* Header */}
      <div className="flex items-center justify-center h-14 border-b border-gray-200 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Entrar</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo */}
          <div className="w-28 h-28 rounded-full overflow-hidden bg-white flex items-center justify-center mb-8">
            {logoUrl ? (
              <img src={logoUrl} alt={unitName || 'Logo'} className="w-full h-full object-contain" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Seus pedidos com mais agilidade e segurança
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
            Faça login e mantenha suas informações salvas para este e os próximos pedidos.
          </p>

          {/* Subtitle */}
          <p className="text-sm text-gray-400 mb-4">Selecione uma opção para continuar:</p>

          {/* OAuth buttons */}
          <div className="w-full space-y-3">
            {/* Google - blue style like Goomer */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!loading}
              className="w-full h-14 rounded-xl flex items-center overflow-hidden border border-gray-200 disabled:opacity-60 transition-opacity"
            >
              <div className="h-full w-16 bg-white flex items-center justify-center border-r border-gray-200 shrink-0">
                {loading === 'google' ? (
                  <AppIcon name="Loader2" size={22} className="animate-spin text-gray-400" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
              </div>
              <div className="flex-1 h-full bg-[#4C8BF5] flex items-center justify-center">
                <span className="text-white font-semibold text-base">Continuar com Google</span>
              </div>
            </button>

            {/* Apple - black style like Goomer */}
            <button
              onClick={() => handleOAuth('apple')}
              disabled={!!loading}
              className="w-full h-14 rounded-xl flex items-center overflow-hidden border border-gray-200 disabled:opacity-60 transition-opacity"
            >
              <div className="h-full w-16 bg-white flex items-center justify-center border-r border-gray-200 shrink-0">
                {loading === 'apple' ? (
                  <AppIcon name="Loader2" size={22} className="animate-spin text-gray-400" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 h-full bg-black flex items-center justify-center">
                <span className="text-white font-semibold text-base">Continuar com Apple</span>
              </div>
            </button>
          </div>

          {/* Skip */}
          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4"
            >
              Continuar sem login
            </button>
          )}
        </div>
      </div>

      {/* Footer wave + branding */}
      <div className="shrink-0">
        <svg viewBox="0 0 1440 40" className="w-full h-6 text-gray-100" preserveAspectRatio="none">
          <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill="currentColor" />
        </svg>
        <div className="bg-gray-100 py-6 flex items-center justify-center">
          <p className="text-xs text-gray-400">
            Uma experiência <span className="font-bold text-gray-500">Garden</span>
          </p>
        </div>
      </div>
    </div>
  );
}
