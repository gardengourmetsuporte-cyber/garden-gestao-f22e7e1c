import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { AppIcon } from '@/components/ui/app-icon';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getPublicAppUrl } from '@/lib/publicAppUrl';

interface Props {
  unitId: string;
  bonusPoints?: number;
  onLoginComplete?: (email: string, name: string, userId: string) => void;
  onSkip?: () => void;
}

export function TabletQrLoginBanner({ unitId, bonusPoints = 0, onLoginComplete, onSkip }: Props) {
  const [mode, setMode] = useState<'buttons' | 'qr' | 'phone'>('buttons');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
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

      const baseUrl = getPublicAppUrl();
      const url = `${baseUrl}/qr-login/${unitId}?session=${token}`;
      setQrUrl(url);

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

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      toast.error('Número inválido');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = cleaned.startsWith('55') ? `+${cleaned}` : `+55${cleaned}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtpSent(true);
      toast.success('Código enviado por SMS!');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, '');
      const fullPhone = cleaned.startsWith('55') ? `+${cleaned}` : `+55${cleaned}`;
      const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: 'sms' });
      if (error) throw error;
      if (data.user) {
        toast.success('Login realizado!');
        onLoginComplete?.(data.user.phone || '', '', data.user.id);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── QR Code Mode ───
  if (mode === 'qr' && qrUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-primary/25" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
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

  // ─── Phone Mode ───
  if (mode === 'phone') {
    return (
      <div className="rounded-2xl overflow-hidden border border-primary/25" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
        <div className="px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => { setMode('buttons'); setOtpSent(false); setOtp(''); }} className="text-muted-foreground hover:text-foreground">
              <AppIcon name="ArrowLeft" size={18} />
            </button>
            <p className="text-sm font-bold text-foreground">Login por telefone</p>
          </div>

          {!otpSent ? (
            <div className="space-y-2">
              <Input
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="h-11"
              />
              <button
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold"
              >
                {loading ? <AppIcon name="Loader2" size={16} className="animate-spin" /> : <AppIcon name="Send" size={16} />}
                Enviar código SMS
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Digite o código de 6 dígitos enviado para seu celular</p>
              <Input
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="text"
                inputMode="numeric"
                className="h-11 text-center text-lg font-bold tracking-widest"
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold"
              >
                {loading ? <AppIcon name="Loader2" size={16} className="animate-spin" /> : null}
                Verificar
              </button>
              <button onClick={() => { setOtpSent(false); setOtp(''); }} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
                Alterar número
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Buttons Mode (default) ───
  return (
    <div className="rounded-2xl overflow-hidden border border-primary/25" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
      {/* Compact promo */}
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}>
          <span className="text-lg">🪙</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            Acumule pontos a cada pedido!
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Faça login e troque por produtos grátis
          </p>
        </div>
      </div>

      {/* Login buttons - 3 options */}
      <div className="px-4 pb-3 pt-1 flex gap-2">
        {/* QR Code - primary */}
        <button
          onClick={createQrSession}
          disabled={loading}
          className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold shadow-sm"
        >
          {loading ? (
            <AppIcon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <AppIcon name="QrCode" size={16} />
          )}
          QR Code
        </button>
        {/* Phone */}
        <button
          onClick={() => setMode('phone')}
          disabled={loading}
          className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 bg-card border border-border/50 hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold text-foreground shadow-sm"
        >
          <AppIcon name="Phone" size={16} />
          Telefone
        </button>
        {/* Google */}
        <button
          onClick={handleGoogleDirect}
          disabled={loading}
          className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 bg-card border border-border/50 hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm font-bold text-foreground shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
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
        <div className="px-4 pb-2.5">
          <button
            onClick={onSkip}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1 font-medium"
          >
            Continuar sem conta →
          </button>
        </div>
      )}
    </div>
  );
}
