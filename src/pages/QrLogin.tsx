import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { getPublicAppUrl } from '@/lib/publicAppUrl';
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/app-icon';

export default function QrLogin() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('session');

  const [status, setStatus] = useState<'loading' | 'ready' | 'logging_in' | 'done' | 'error'>('loading');
  const [unitName, setUnitName] = useState('');

  useEffect(() => {
    if (!unitId || !sessionToken) {
      setStatus('error');
      return;
    }

    // Load unit name
    supabase.from('units').select('name').eq('id', unitId).maybeSingle()
      .then(({ data }) => {
        if (data) setUnitName(data.name);
      });

    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Already logged in — complete the QR session
        await completeSession(session.user.email || '', session.user.user_metadata?.full_name || session.user.user_metadata?.name || '', session.user.id);
        return;
      }
      setStatus('ready');
    });

    // Listen for auth state changes (after Google login redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && _event === 'SIGNED_IN') {
        await completeSession(
          session.user.email || '',
          session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          session.user.id,
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [unitId, sessionToken]);

  const completeSession = async (email: string, name: string, userId: string) => {
    if (!sessionToken) return;
    setStatus('logging_in');
    try {
      const { error } = await supabase
        .from('qr_login_sessions')
        .update({
          status: 'completed',
          customer_email: email,
          customer_name: name,
          auth_user_id: userId,
          completed_at: new Date().toISOString(),
        })
        .eq('session_token', sessionToken)
        .eq('status', 'pending');

      if (error) throw error;
      setStatus('done');
    } catch (e) {
      console.error('QR session completion failed:', e);
      setStatus('error');
    }
  };

  const handleGoogleLogin = async () => {
    setStatus('logging_in');
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.href,
      });
      if (result.error) {
        toast.error('Erro ao fazer login');
        setStatus('ready');
      }
    } catch {
      toast.error('Erro ao conectar');
      setStatus('ready');
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AppIcon name="XCircle" size={32} className="text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Link inválido</h1>
          <p className="text-sm text-muted-foreground">Este QR Code expirou ou é inválido. Peça um novo QR Code no tablet.</p>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <AppIcon name="CheckCircle2" size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Login realizado! ✅</h1>
          <p className="text-sm text-muted-foreground">
            Volte ao tablet — seu login já foi reconhecido automaticamente.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">Pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}>
            <span className="text-3xl">🪙</span>
          </div>
          <h1 className="text-xl font-black text-foreground">
            {unitName || 'Garden'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Faça login para acumular Garden Coins e ganhar benefícios!
          </p>
        </div>

        {/* Benefits */}
        <div className="flex justify-center gap-4">
          {[
            { icon: 'Star', label: 'Cashback' },
            { icon: 'Gift', label: 'Prêmios' },
            { icon: 'Percent', label: 'Descontos' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <AppIcon name={b.icon} size={14} className="text-primary" />
              <span>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Google login button */}
        <button
          onClick={handleGoogleLogin}
          disabled={status === 'logging_in' || status === 'loading'}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 bg-card border-2 border-border/50 hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-base font-bold text-foreground shadow-md"
        >
          {status === 'logging_in' || status === 'loading' ? (
            <AppIcon name="Loader2" size={20} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Entrar com Google
        </button>

        <p className="text-[10px] text-center text-muted-foreground/50">
          Login rápido e seguro. Seus dados ficam protegidos.
        </p>
      </div>
    </div>
  );
}
