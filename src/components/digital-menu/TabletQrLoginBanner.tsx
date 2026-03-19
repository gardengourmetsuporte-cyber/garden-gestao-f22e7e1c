import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

interface Props {
  unitId: string;
  bonusPoints?: number;
  onLoginComplete?: (email: string, name: string, userId: string) => void;
  onSkip?: () => void;
}

export function TabletQrLoginBanner({ unitId, bonusPoints = 0, onLoginComplete, onSkip }: Props) {
  const [mode, setMode] = useState<'buttons' | 'qr'>('buttons');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const createQrSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qr_login_sessions')
        .insert({ unit_id: unitId })
        .select('id, session_token')
        .single();

      if (error) throw error;

      const token = (data as any).session_token;
      const id = (data as any).id;
      sessionIdRef.current = id;
      setSessionToken(token);
      setTimeLeft(300);

      // Build QR URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/qr-login/${unitId}?session=${token}`;
      setQrUrl(url);

      // Subscribe to realtime changes
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`qr-session-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'qr_login_sessions',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const newRow = payload.new as any;
            if (newRow.status === 'completed' && newRow.customer_email) {
              toast.success(`Login realizado: ${newRow.customer_name || newRow.customer_email}`);
              onLoginComplete?.(newRow.customer_email, newRow.customer_name || '', newRow.auth_user_id);
              cleanup();
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
      setMode('qr');
    } catch (e) {
      console.error('QR session creation failed:', e);
      toast.error('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  }, [unitId, onLoginComplete]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Countdown timer
  useEffect(() => {
    if (mode !== 'qr') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setMode('buttons');
          setSessionToken(null);
          cleanup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, cleanup]);

  const handleGoogleDirect = async () => {
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

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (mode === 'qr' && qrUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-primary/25" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))' }}>
        <div className="px-4 pt-4 pb-3 text-center space-y-3">
          <p className="text-sm font-bold text-foreground">📱 Escaneie com seu celular</p>
          <p className="text-xs text-muted-foreground">Abra a câmera do celular e aponte para o QR Code</p>

          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <QRCodeSVG value={qrUrl} size={160} level="M" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AppIcon name="Clock" size={12} />
            <span>Expira em {formatTime(timeLeft)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setMode('buttons'); cleanup(); }}
              className="flex-1 h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/60 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={createQrSession}
              className="flex-1 h-9 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              Gerar novo QR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-primary/25" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))' }}>
      {/* Hero */}
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
              ? `Cadastre-se e ganhe ${bonusPoints} moedas! Acumule pontos a cada pedido.`
              : 'Faça login e acumule moedas a cada pedido. Troque por produtos grátis!'}
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-4 pb-3 flex items-center gap-3">
        {[
          { icon: 'Star', label: 'Cashback' },
          { icon: 'Gift', label: 'Produtos grátis' },
          { icon: 'Percent', label: 'Descontos' },
        ].map((b, i) => (
          <div key={b.label} className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
            {i > 0 && <div className="w-px h-3 bg-border/40 -ml-1.5 mr-0" />}
            <AppIcon name={b.icon} size={12} className="text-primary" />
            <span>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Login buttons */}
      <div className="px-4 pb-3 flex gap-2">
        {/* QR Code - primary action for tablet */}
        <button
          onClick={createQrSession}
          disabled={loading}
          className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold shadow-md"
        >
          {loading ? (
            <AppIcon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <AppIcon name="QrCode" size={18} />
          )}
          QR Code
        </button>
        {/* Google - secondary */}
        <button
          onClick={handleGoogleDirect}
          disabled={loading}
          className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 bg-card border border-border/50 hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold text-foreground shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
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
