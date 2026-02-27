import { useState } from "react";
import { Check, Star, Zap } from "lucide-react";
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Planos para cada fase do seu restaurante
          </h2>
          <p className="text-sm text-muted-foreground">
            14 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium transition-colors ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Anual{" "}
            <span className="inline-block ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/15 text-success border border-success/20">
              -20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-primary/30 bg-gradient-to-b from-primary/8 to-card shadow-card ring-1 ring-primary/10 hover:shadow-glow-primary"
                  : "border-border/40 bg-card hover:shadow-card-hover hover:border-border/60"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-glow-primary">
                  ⭐ Mais popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  plan.highlight ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                }`}>
                  <plan.icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

              <div className="mt-6 mb-8">
                <span className="text-4xl font-extrabold text-foreground">
                  R$ {yearly ? plan.yearly : plan.monthly}
                </span>
                <span className="text-muted-foreground text-sm">/mês</span>
                {yearly && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    cobrado anualmente
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedPlan(plan)}
                className={`block w-full text-center h-12 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:shadow-glow-primary hover:scale-[1.02]"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
              </button>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      plan.highlight ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
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
