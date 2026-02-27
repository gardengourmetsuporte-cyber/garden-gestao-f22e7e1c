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
    <section id="planos" className="py-20 md:py-28 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-5">
            Planos
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight font-display">
            Planos para cada fase do seu restaurante
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            14 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium transition-colors ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Anual{" "}
            <span className="inline-block ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/25">
              -20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "p-7 sm:p-8"
                  : "border border-border/50 bg-card p-7 sm:p-8 hover:shadow-lg hover:border-border"
              }`}
              style={plan.highlight ? {
                background: 'linear-gradient(135deg, hsl(224 45% 6%) 0%, hsl(220 70% 16%) 18%, hsl(234 75% 28%) 36%, hsl(220 65% 18%) 54%, hsl(228 55% 10%) 72%, hsl(234 75% 26%) 88%, hsl(224 45% 6%) 100%)',
                backgroundSize: '350% 350%',
                animation: 'navyCardFlow 12s ease-in-out infinite',
              } : undefined}
            >
              {plan.highlight && (
                <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-5"
                  style={{ background: 'hsl(220 60% 50% / 0.15)', color: 'hsl(220 80% 70%)', border: '1px solid hsl(220 60% 50% / 0.2)' }}
                >
                  <Star className="w-3 h-3 fill-current" />
                  Mais popular
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.highlight ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    <plan.icon className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold ${plan.highlight ? "text-white" : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                </div>
                <p className={`text-sm mt-1 ${plan.highlight ? "text-white/60" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                <div className="mt-6 mb-7">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm ${plan.highlight ? "text-white/50" : "text-muted-foreground"}`}>R$</span>
                    <span className={`text-5xl font-extrabold tabular-nums tracking-tight ${plan.highlight ? "text-white" : "text-foreground"}`}>
                      {yearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-white/50" : "text-muted-foreground"}`}>/mês</span>
                  </div>
                  {yearly && (
                    <p className={`text-xs mt-2 ${plan.highlight ? "text-white/40" : "text-muted-foreground"}`}>
                      <span className="line-through mr-1.5 opacity-60">R$ {plan.monthly}/mês</span>
                      cobrado anualmente
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`group/btn flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
                    plan.highlight
                      ? "bg-white text-[hsl(220,30%,15%)] shadow-lg"
                      : "gradient-primary text-primary-foreground shadow-md"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>

                <div className={`mt-7 pt-6 border-t ${plan.highlight ? "border-white/10" : "border-border/30"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${plan.highlight ? "text-white/40" : "text-muted-foreground"}`}>
                    Inclui:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.highlight ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
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
