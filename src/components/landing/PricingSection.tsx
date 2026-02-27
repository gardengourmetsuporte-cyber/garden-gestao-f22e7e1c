import { useState } from "react";
import { Check, Star, Zap, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PlanCheckoutDialog } from "@/components/landing/PlanCheckoutDialog";

const plans = [
  {
    id: "pro",
    name: "Pro",
    description: "Para restaurantes em crescimento",
    monthly: 97,
    yearly: 77,
    highlight: true,
    icon: Star,
    gradient: "from-primary/12 via-primary/6 to-transparent",
    features: [
      "Financeiro completo",
      "Estoque inteligente",
      "Gestão de equipe",
      "Checklists ilimitados",
      "Fichas técnicas",
      "Gamificação e ranking",
      "Fechamento de caixa",
      "Até 15 usuários",
    ],
    cta: "Começar 14 dias grátis",
  },
  {
    id: "business",
    name: "Business",
    description: "Para operações avançadas",
    monthly: 197,
    yearly: 157,
    highlight: false,
    icon: Zap,
    gradient: "from-accent/8 via-accent/4 to-transparent",
    features: [
      "Tudo do Pro",
      "IA Copiloto",
      "WhatsApp Bot",
      "Marketing",
      "Pedidos online (tablet)",
      "Cardápio digital",
      "Finanças pessoais",
      "Usuários ilimitados",
      "Suporte prioritário",
    ],
    cta: "Começar 14 dias grátis",
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  return (
    <section id="planos" className="py-20 md:py-28 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/6 blur-[140px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-full mb-4">
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Planos para cada fase do seu restaurante
          </h2>
          <p className="text-base text-muted-foreground">
            14 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium transition-colors duration-200 ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium transition-colors duration-200 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Anual{" "}
            <span className="inline-block ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/25">
              Economize 20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                plan.highlight
                  ? "border-primary/30 bg-card shadow-card ring-1 ring-primary/10 hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.25)]"
                  : "border-border/50 bg-card hover:shadow-card-hover hover:border-border/70"
              }`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-b ${plan.gradient} pointer-events-none`} />

              {plan.highlight && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}

              {plan.highlight && (
                <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25 mb-4">
                  <Star className="w-3 h-3 fill-primary" />
                  Mais popular
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    plan.highlight ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                  }`}>
                    <plan.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

                <div className="mt-6 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-5xl font-extrabold text-foreground tabular-nums">
                      {yearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  {yearly && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      <span className="line-through mr-1.5">R$ {plan.monthly}/mês</span>
                      cobrado anualmente
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`group/btn flex items-center justify-center gap-2 w-full h-12 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>

                <div className="mt-8 pt-6 border-t border-border/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Inclui:</p>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0 ${
                          plan.highlight ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                        }`}>
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <PlanCheckoutDialog
          plan={selectedPlan}
          yearly={yearly}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </section>
  );
}
