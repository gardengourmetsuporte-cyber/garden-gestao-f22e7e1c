import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { user, signIn, signUp, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (err: any) { newErrors.email = err.errors[0].message; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
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
        const { error } = await signUp(email, password, fullName);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
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

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-5 animate-slide-up">
            <div
              className="relative w-28 h-28 rounded-full overflow-hidden animate-float"
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
              <div className="absolute inset-[1px] rounded-full overflow-hidden bg-white">
                <img
                  alt="Garden Logo"
                  className="w-full h-full object-cover"
                  src="/lovable-uploads/dc8e43da-017d-406f-9b66-d1984478c7e6.jpg"
                />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                Garden
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
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  {isResetPassword ? 'Recuperar Senha' : isLogin ? 'Bem-vindo' : 'Criar Conta'}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isResetPassword
                  ? 'Informe seu email para recuperação'
                  : isLogin
                  ? 'Acesse sua conta para continuar'
                  : 'Preencha os dados para se cadastrar'}
              </p>
            </div>

            {isResetPassword ? (
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
                      <Mail className="w-5 h-5" />
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
                    <>Enviar link<ArrowRight className="w-5 h-5 ml-2" /></>
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
                        <User className="w-5 h-5" />
                      </div>
                      <Input
                        id="fullName"
                        type="text"
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
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      id="email"
                      type="email"
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
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
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
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
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
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin ? (
                    <>Não tem conta? <span className="text-primary font-medium">Cadastre-se</span></>
                  ) : (
                    <>Já tem conta? <span className="text-primary font-medium">Entrar</span></>
                  )}
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
