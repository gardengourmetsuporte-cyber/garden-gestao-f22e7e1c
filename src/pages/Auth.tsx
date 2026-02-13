import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

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

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Neon background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, hsl(var(--neon-cyan) / 0.08), transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, hsl(var(--neon-purple) / 0.06), transparent 70%)' }} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm space-y-8 animate-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 rounded-full overflow-hidden relative animate-float"
              style={{
                background: 'white',
                border: '2px solid hsl(var(--neon-cyan) / 0.3)',
                boxShadow: '0 0 30px hsl(var(--neon-cyan) / 0.15), 0 8px 32px hsl(222 47% 3% / 0.4)',
              }}
            >
              <img alt="Logo" className="w-full h-full object-cover" src="/lovable-uploads/dc8e43da-017d-406f-9b66-d1984478c7e6.jpg" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Garden</h1>
              <p className="text-muted-foreground text-sm">Gestão Inteligente</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="card-command p-6 space-y-6 animate-neon-border">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {isResetPassword ? 'Recuperar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isResetPassword ? 'Informe seu email para receber o link de recuperação' : isLogin ? 'Acesse sua conta para continuar' : 'Preencha os dados para se cadastrar'}
              </p>
            </div>

            {isResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="resetEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-12 bg-input/50 border-border/40 focus:border-primary/50" />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold"
                  style={{ boxShadow: '0 4px 20px hsl(var(--neon-cyan) / 0.3)' }}
                >
                  {isSubmitting ? <span className="animate-pulse">Aguarde...</span> : <>Enviar link de recuperação<ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-muted-foreground">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" className="pl-10 h-12 bg-input/50 border-border/40 focus:border-primary/50" />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 h-12 bg-input/50 border-border/40 focus:border-primary/50" />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-muted-foreground">Senha</Label>
                    {isLogin && (
                      <button type="button" onClick={() => { setIsResetPassword(true); setErrors({}); }} className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 h-12 bg-input/50 border-border/40 focus:border-primary/50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold"
                  style={{ boxShadow: '0 4px 20px hsl(var(--neon-cyan) / 0.3)' }}
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
              </form>
            )}

            <div className="text-center space-y-2">
              {isResetPassword ? (
                <button type="button" onClick={() => { setIsResetPassword(false); setErrors({}); }} className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Voltar para o login
                </button>
              ) : (
                <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-sm text-primary hover:text-primary/80 transition-colors">
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-muted-foreground relative z-10">
        © {new Date().getFullYear()} Garden
      </div>
    </div>
  );
}
