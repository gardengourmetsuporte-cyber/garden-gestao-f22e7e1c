import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '@/lib/plans';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Plans() {
  const { profile, plan: userPlan, session } = useAuth();
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPaid = userPlan === 'pro' || userPlan === 'business';

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          planId,
          billing: yearly ? 'yearly' : 'monthly',
          email: session?.user?.email,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('URL de checkout não retornada');
      window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Erro ao iniciar pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) {
        // Try to read error body for manual override accounts
        const errorText = typeof error === 'object' && error.context?.body
          ? await new Response(error.context.body).text()
          : String(error);
        if (errorText.includes('No Stripe customer')) {
          toast.info('Seu plano foi ativado manualmente. Entre em contato com o suporte para alterações.');
          return;
        }
        throw error;
      }
      if (data?.error && String(data.error).includes('No Stripe customer')) {
        toast.info('Seu plano foi ativado manualmente. Entre em contato com o suporte para alterações.');
        return;
      }
      if (!data?.url) throw new Error('URL do portal não retornada');
      window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Portal error:', err);
      const msg = err?.message || String(err);
      if (msg.includes('No Stripe customer') || msg.includes('non-2xx')) {
        toast.info('Seu plano foi ativado manualmente. Entre em contato com o suporte para alterações.');
      } else {
        toast.error('Erro ao abrir gerenciamento.');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="page-header-bar">
          <div className="page-header-content flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <AppIcon name="ChevronLeft" size={20} />
            </button>
            <h1 className="page-title">Planos</h1>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6 max-w-3xl mx-auto space-y-6">
          {isPaid ? (
            /* ── Active plan management view ── */
            <div className="space-y-6">
              {/* Current plan card */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: 'hsl(var(--card))',
                  border: '2px solid hsl(var(--neon-green) / 0.4)',
                  boxShadow: '0 0 30px hsl(var(--neon-green) / 0.1)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'hsl(var(--neon-green) / 0.12)' }}
                  >
                    <AppIcon name="Crown" size={24} style={{ color: 'hsl(var(--neon-green))' }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-foreground leading-tight">
                      Plano {userPlan === 'pro' ? 'Pro' : 'Business'}
                    </h2>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                      style={{ background: 'hsl(var(--neon-green) / 0.15)', color: 'hsl(var(--neon-green))' }}
                    >
                      <AppIcon name="Check" size={10} /> Ativo
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Você tem acesso a todos os recursos do plano {userPlan === 'pro' ? 'Pro' : 'Business'}.
                </p>

                {/* Features included */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recursos inclusos</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLANS.find(p => p.id === userPlan)?.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AppIcon name="Check" size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--neon-green))' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Management actions */}
              <div className="space-y-3">
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))',
                    color: 'white',
                    boxShadow: '0 0 20px hsl(var(--neon-green) / 0.3)',
                  }}
                >
                  {portalLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo portal...</>
                  ) : (
                    <><AppIcon name="Settings" size={16} /> Gerenciar Assinatura</>
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  Altere seu plano, método de pagamento ou cancele a qualquer momento.
                </p>
              </div>

              {/* Upgrade hint if on Pro */}
              {userPlan === 'pro' && (
                <div
                  className="rounded-2xl p-5 space-y-3"
                  style={{
                    background: 'hsl(var(--secondary) / 0.5)',
                    border: '1px solid hsl(var(--border) / 0.5)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AppIcon name="Sparkles" size={16} style={{ color: 'hsl(var(--neon-cyan))' }} />
                    <h3 className="text-sm font-bold text-foreground">Quer ainda mais?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O plano Business inclui Marketing, Copilot IA, WhatsApp Bot, Cardápio Digital, Tablets e Gamificação.
                  </p>
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="h-10 px-5 rounded-xl font-semibold text-sm bg-secondary text-foreground transition-all hover:bg-secondary/80"
                  >
                    Fazer upgrade
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Free plan: show pricing cards ── */
            <div className="space-y-6">
              {/* Trial info */}
              <p
                className="text-center text-sm font-semibold py-2 px-4 rounded-full"
                style={{
                  background: 'hsl(var(--neon-green) / 0.1)',
                  border: '1px solid hsl(var(--neon-green) / 0.25)',
                  color: 'hsl(var(--neon-green))',
                  display: 'table',
                  margin: '0 auto',
                }}
              >
                14 dias grátis em qualquer plano. Sem cartão de crédito.
              </p>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3">
                <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
                <Switch checked={yearly} onCheckedChange={setYearly} />
                <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Anual{' '}
                  <span className="inline-block ml-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'hsl(var(--neon-green) / 0.15)', color: 'hsl(var(--neon-green))' }}>
                    -20%
                  </span>
                </span>
              </div>

              {/* Plan cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {PLANS.map(plan => {
                  const price = yearly ? plan.yearly : plan.monthly;

                  return (
                    <div
                      key={plan.id}
                      className="relative rounded-2xl p-6 transition-all"
                      style={{
                        background: plan.highlight
                          ? 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--secondary)))'
                          : 'hsl(var(--card))',
                        border: plan.highlight
                          ? '2px solid hsl(var(--neon-cyan) / 0.5)'
                          : '1px solid hsl(var(--border) / 0.5)',
                        boxShadow: plan.highlight
                          ? '0 0 40px hsl(var(--neon-cyan) / 0.15)'
                          : 'var(--shadow-card)',
                      }}
                    >
                      {plan.highlight && (
                        <div
                          className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))',
                            color: 'white',
                          }}
                        >
                          <AppIcon name="Star" size={12} /> Mais popular
                        </div>
                      )}

                      <h3 className="text-xl font-bold text-foreground mt-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

                      <div className="mt-4 mb-6">
                        <span className="text-3xl font-extrabold text-foreground">R$ {price}</span>
                        <span className="text-muted-foreground text-sm">/mês</span>
                      </div>

                      <button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={!!loadingPlan}
                        className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                        style={{
                          background: plan.highlight
                            ? 'linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))'
                            : 'hsl(var(--secondary))',
                          color: plan.highlight ? 'white' : 'hsl(var(--foreground))',
                          boxShadow: plan.highlight ? '0 0 20px hsl(var(--neon-green) / 0.3)' : undefined,
                        }}
                      >
                        {loadingPlan === plan.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...</>
                        ) : (
                          <>Começar 14 dias grátis</>
                        )}
                      </button>

                      <ul className="mt-6 space-y-2.5">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AppIcon name="Check" size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--neon-green))' }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
