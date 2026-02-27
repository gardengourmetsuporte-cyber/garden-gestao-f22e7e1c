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
    <section id="planos" className="py-24 md:py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-5">
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 leading-tight">
            Planos para cada fase do seu restaurante
          </h2>
          <p className="text-base text-muted-foreground">
            14 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm font-medium transition-colors duration-200 ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium transition-colors duration-200 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Anual{" "}
            <span className="inline-block ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/25">
              -20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative overflow-hidden transition-all duration-400 hover:-translate-y-1.5 ${
                plan.highlight
                  ? "finance-hero-card p-8 md:p-9"
                  : "card-surface p-8 md:p-9 hover:shadow-elevated"
              }`}
            >
              {plan.highlight && (
                <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/20 mb-5">
                  <Star className="w-3 h-3 fill-current" />
                  Mais popular
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.highlight
                        ? "bg-white/15 text-white"
                        : "bg-primary/12 text-primary"
                    }`}
                  >
                    <plan.icon className="w-5 h-5" />
                  </div>
                  <h3
                    className={`text-xl font-bold ${
                      plan.highlight ? "text-white" : "text-foreground"
                    }`}
                  >
                    {plan.name}
                  </h3>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    plan.highlight ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-7 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-sm ${
                        plan.highlight ? "text-white/60" : "text-muted-foreground"
                      }`}
                    >
                      R$
                    </span>
                    <span
                      className={`text-5xl font-extrabold tabular-nums tracking-tight ${
                        plan.highlight ? "text-white" : "text-foreground"
                      }`}
                    >
                      {yearly ? plan.yearly : plan.monthly}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlight ? "text-white/60" : "text-muted-foreground"
                      }`}
                    >
                      /mês
                    </span>
                  </div>
                  {yearly && (
                    <p
                      className={`text-xs mt-2 ${
                        plan.highlight ? "text-white/50" : "text-muted-foreground"
                      }`}
                    >
                      <span className="line-through mr-1.5 opacity-60">R$ {plan.monthly}/mês</span>
                      cobrado anualmente
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`group/btn flex items-center justify-center gap-2 w-full h-13 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] ${
                    plan.highlight
                      ? "bg-white text-[hsl(220,30%,15%)] shadow-lg hover:shadow-xl"
                      : "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>

                <div
                  className={`mt-8 pt-7 border-t ${
                    plan.highlight ? "border-white/15" : "border-border/30"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                      plan.highlight ? "text-white/50" : "text-muted-foreground"
                    }`}
                  >
                    Inclui:
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2.5 text-sm ${
                          plan.highlight ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            plan.highlight
                              ? "bg-white/15 text-white"
                              : "bg-primary/12 text-primary"
                          }`}
                        >
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
