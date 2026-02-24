// Auth page v2
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { lovable } from '@/integrations/lovable/index';
import atlasIcon from '@/assets/atlas-icon.png';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isNewPassword, setIsNewPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user, signIn, signUp, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  const tokenFromUrl = searchParams.get('token');
  const paymentSuccess = searchParams.get('payment');

  // No redirect restrictions - all users can access auth freely

  // Listen for PASSWORD_RECOVERY event from AuthContext's session
  useEffect(() => {
    // Check URL hash for recovery token (handles redirect from email link)
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsNewPassword(true);
      setIsResetPassword(false);
      setIsLogin(true);
    }
  }, []);

  useEffect(() => {
    if (user && !isLoading && !isNewPassword) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate, isNewPassword]);

  // Signup is always available
  const canSignUp = true;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (e: any) { newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e: any) { newErrors.password = e.errors[0].message; }
    if (!isLogin) {
      try { nameSchema.parse(fullName); } catch (e: any) { newErrors.fullName = e.errors[0].message; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    try { passwordSchema.parse(password); } catch (err: any) { newErrors.password = err.errors[0].message; }
    if (password !== confirmPassword) { newErrors.confirmPassword = 'As senhas não coincidem'; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Senha alterada com sucesso!');
      setIsNewPassword(false);
      setPassword('');
      setConfirmPassword('');
      navigate('/', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (err: any) { newErrors.email = err.errors[0].message; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setIsResetPassword(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Confirme seu email antes de fazer login');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Bem-vindo de volta!');
      } else {
        // Build redirect URL preserving plan context for post-confirmation
        const redirectUrl = planFromUrl 
          ? `${window.location.origin}/auth?plan=${planFromUrl}&payment=success`
          : tokenFromUrl
          ? `${window.location.origin}/invite?token=${tokenFromUrl}`
          : `${window.location.origin}/`;
        const { error } = await signUp(email, password, fullName, redirectUrl);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Cadastro realizado! Verifique seu email para confirmar.');
        setIsLogin(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const inputClasses = (field: string) => cn(
    "pl-11 h-12 rounded-xl border bg-secondary/30 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300",
    focusedField === field
      ? "border-primary/60 bg-secondary/50"
      : "border-border/30 hover:border-border/60",
    errors[field] && "border-destructive/50"
  );

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-x-hidden overflow-y-auto">
      {/* Back to Landing */}
      <div className="absolute top-8 left-4 z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate('/landing')} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </Button>
      </div>
      {/* Theme Toggle */}
      <div className="absolute top-8 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Animated background effects */}
      <div
        className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] animate-float"
        style={{ background: 'radial-gradient(circle, hsl(var(--neon-cyan) / 0.1), transparent 60%)' }}
      />
      <div
        className="absolute bottom-[-25%] right-[-15%] w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--neon-purple) / 0.08), transparent 60%)',
          animation: 'floatLogo 4s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full blur-[80px]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 60%)',
          animation: 'floatLogo 5s ease-in-out infinite',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--neon-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neon-cyan)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 py-10 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-5 animate-slide-up">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden animate-float flex items-center justify-center"
              style={{
                border: '2px solid hsl(var(--neon-cyan) / 0.3)',
                boxShadow: '0 0 40px hsl(var(--neon-cyan) / 0.2), 0 0 80px hsl(var(--neon-cyan) / 0.08), 0 8px 32px hsl(222 47% 3% / 0.5)',
              }}
            >
              {/* Rotating neon ring */}
              <div
                className="absolute -inset-[2px] rounded-full opacity-60"
                style={{
                  background: 'conic-gradient(from var(--neon-angle, 0deg), hsl(var(--neon-cyan)), transparent, hsl(var(--neon-purple)), transparent, hsl(var(--neon-cyan)))',
                  animation: 'neonRotate 4s linear infinite',
                  filter: 'blur(3px)',
                }}
              />
              <div className="absolute inset-[1px] rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img
                  alt="Atlas"
                  className="w-[70%] h-[70%] object-contain"
                  src={atlasIcon}
                />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                Atlas
              </h1>
              <p className="text-sm text-muted-foreground tracking-widest uppercase">
                Gestão Inteligente
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div
            className="animate-slide-up rounded-2xl p-6 space-y-6 backdrop-blur-xl"
            style={{
              animationDelay: '100ms',
              background: 'linear-gradient(145deg, hsl(var(--card) / 0.9), hsl(var(--card) / 0.6))',
              border: '1px solid hsl(var(--neon-cyan) / 0.15)',
              boxShadow: '0 0 40px hsl(var(--neon-cyan) / 0.06), var(--shadow-elevated)',
            }}
          >
            {/* Title with icon */}
            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <AppIcon name="Sparkles" size={20} className="text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  {isNewPassword ? 'Nova Senha' : isResetPassword ? 'Recuperar Senha' : isLogin ? 'Bem-vindo' : 'Criar Conta'}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNewPassword
                  ? 'Defina sua nova senha'
                  : isResetPassword
                  ? 'Informe seu email para recuperação'
                  : isLogin
                  ? 'Acesse sua conta para continuar'
                  : planFromUrl
                  ? `Cadastre-se para ativar o plano ${planFromUrl.charAt(0).toUpperCase() + planFromUrl.slice(1)}`
                  : 'Preencha os dados para se cadastrar'}
              </p>
            </div>

            {isNewPassword ? (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="newPassword" className="text-sm text-muted-foreground font-medium">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300", focusedField === 'newPassword' ? "text-primary" : "text-muted-foreground/60")}>
                      <AppIcon name="Lock" size={20} />
                    </div>
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className={cn(inputClasses('password'), "pr-11")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                      {showPassword ? <AppIcon name="EyeOff" size={20} /> : <AppIcon name="Eye" size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive animate-fade-in">{errors.password}</p>}
                </div>

                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground font-medium">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <div className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300", focusedField === 'confirmPassword' ? "text-primary" : "text-muted-foreground/60")}>
                      <AppIcon name="Lock" size={20} />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className={inputClasses('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive animate-fade-in">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan) / 0.8))',
                    boxShadow: '0 4px 24px hsl(var(--primary) / 0.35), 0 0 40px hsl(var(--neon-cyan) / 0.1)',
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Aguarde...
                    </span>
                  ) : (
                    <>Salvar nova senha<AppIcon name="Check" size={20} className="ml-2" /></>
                  )}
                </Button>
              </form>
            ) : isResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="resetEmail" className="text-sm text-muted-foreground font-medium">
                    Email
                  </Label>
                  <div className="relative group">
                    <div
                      className={cn(
                        "absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
                        focusedField === 'resetEmail' ? "text-primary" : "text-muted-foreground/60"
                      )}
                    >
                      <AppIcon name="Mail" size={20} />
                    </div>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('resetEmail')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="seu@email.com"
                      className={inputClasses('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive animate-fade-in">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan) / 0.8))',
                    boxShadow: '0 4px 24px hsl(var(--primary) / 0.35), 0 0 40px hsl(var(--neon-cyan) / 0.1)',
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Aguarde...
                    </span>
                  ) : (
                    <>Enviar link<AppIcon name="ArrowRight" size={20} className="ml-2" /></>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="fullName" className="text-sm text-muted-foreground font-medium">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <div
                        className={cn(
                          "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
                          focusedField === 'fullName' ? "text-primary" : "text-muted-foreground/60"
                        )}
                      >
                        <AppIcon name="User" size={20} />
                      </div>
                      <Input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        autoCapitalize="words"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        onFocus={() => setFocusedField('fullName')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Seu nome"
                        className={inputClasses('fullName')}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-destructive animate-fade-in">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
                  <Label htmlFor="email" className="text-sm text-muted-foreground font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <div
                      className={cn(
                        "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
                        focusedField === 'email' ? "text-primary" : "text-muted-foreground/60"
                      )}
                    >
                      <AppIcon name="Mail" size={20} />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="seu@email.com"
                      className={inputClasses('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive animate-fade-in">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-muted-foreground font-medium">
                      Senha
                    </Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setIsResetPassword(true); setErrors({}); }}
                        className="text-xs text-primary/80 hover:text-primary transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className={cn(
                        "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
                        focusedField === 'password' ? "text-primary" : "text-muted-foreground/60"
                      )}
                    >
                      <AppIcon name="Lock" size={20} />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className={cn(inputClasses('password'), "pr-11")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <AppIcon name="EyeOff" size={20} /> : <AppIcon name="Eye" size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive animate-fade-in">{errors.password}</p>
                  )}
                </div>

                <div className="pt-1 animate-slide-up" style={{ animationDelay: '150ms' }}>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan) / 0.8))',
                      boxShadow: '0 4px 24px hsl(var(--primary) / 0.35), 0 0 40px hsl(var(--neon-cyan) / 0.1)',
                    }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Aguarde...
                      </span>
                    ) : (
                      <>
                        {isLogin ? 'Entrar' : 'Cadastrar'}
                        <AppIcon name="ArrowRight" size={20} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Social Login Divider + Buttons (only on login/signup, not reset) */}
            {!isNewPassword && !isResetPassword && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                  <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">ou</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                          extraParams: { prompt: "select_account" },
                        });
                      } catch {
                        toast.error('Erro ao conectar com Google');
                      }
                    }}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] border border-border/30 bg-secondary/30 backdrop-blur-sm hover:border-border/60 hover:bg-secondary/50 text-foreground"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Entrar com Google
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await lovable.auth.signInWithOAuth("apple", {
                          redirect_uri: window.location.origin,
                        });
                      } catch {
                        toast.error('Erro ao conectar com Apple');
                      }
                    }}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] border border-border/30 bg-secondary/30 backdrop-blur-sm hover:border-border/60 hover:bg-secondary/50 text-foreground"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Entrar com Apple
                  </button>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </div>

            <div className="text-center">
              {isResetPassword ? (
                <button
                  type="button"
                  onClick={() => { setIsResetPassword(false); setErrors({}); }}
                  className="text-sm text-primary/80 hover:text-primary transition-colors font-medium"
                >
                  ← Voltar para o login
                </button>
              ) : canSignUp ? (
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setErrors({}); setPassword(''); setFullName(''); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin ? (
                    <>Não tem conta? <span className="text-primary font-medium">Cadastre-se</span></>
                  ) : (
                    <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/landing')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar para o site
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-muted-foreground/50 relative z-10">
        © {new Date().getFullYear()} Garden — Gestão Inteligente
      </div>
    </div>
  );
}
