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
      if (error) throw error;
      if (!data?.url) throw new Error('URL do portal não retornada');
      window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Portal error:', err);
      toast.error('Erro ao abrir gerenciamento.');
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
          {/* Current plan badge */}
          {isPaid && (
            <div
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{
                background: 'hsl(var(--neon-green) / 0.08)',
                border: '1px solid hsl(var(--neon-green) / 0.25)',
              }}
            >
              <div className="flex items-center gap-3">
                <AppIcon name="Crown" size={20} style={{ color: 'hsl(var(--neon-green))' }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Plano {userPlan === 'pro' ? 'Pro' : 'Business'} ativo
                  </p>
                  <p className="text-xs text-muted-foreground">Você tem acesso a todos os recursos do seu plano</p>
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-secondary"
                style={{ color: 'hsl(var(--neon-green))' }}
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerenciar'}
              </button>
            </div>
          )}

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
              const isCurrentPlan = userPlan === plan.id;
              const price = yearly ? plan.yearly : plan.monthly;

              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl p-6 transition-all"
                  style={{
                    background: plan.highlight
                      ? 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--secondary)))'
                      : 'hsl(var(--card))',
                    border: isCurrentPlan
                      ? '2px solid hsl(var(--neon-green) / 0.6)'
                      : plan.highlight
                        ? '2px solid hsl(var(--neon-cyan) / 0.5)'
                        : '1px solid hsl(var(--border) / 0.5)',
                    boxShadow: isCurrentPlan
                      ? '0 0 30px hsl(var(--neon-green) / 0.15)'
                      : plan.highlight
                        ? '0 0 40px hsl(var(--neon-cyan) / 0.15)'
                        : 'var(--shadow-card)',
                  }}
                >
                  {isCurrentPlan && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))',
                        color: 'white',
                      }}
                    >
                      <AppIcon name="Check" size={12} /> Seu Plano
                    </div>
                  )}
                  {!isCurrentPlan && plan.highlight && (
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

                  {isCurrentPlan ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="w-full h-11 rounded-xl font-semibold text-sm bg-secondary text-foreground flex items-center justify-center gap-2"
                    >
                      {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerenciar Assinatura'}
                    </button>
                  ) : (
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
                  )}

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
      </div>
    </AppLayout>
  );
}
