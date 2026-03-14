import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
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
    icon: 'Star',
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
    icon: 'Zap',
    features: [
      "Tudo do Pro",
      "Copilot IA",
      "WhatsApp IA",
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
    <section id="planos" className="py-24 md:py-32 relative bg-background overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/40 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Planos
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight font-display tracking-tight">
            Planos para cada <br className="hidden sm:block" />fase do seu restaurante
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-medium">
            14 dias grátis em qualquer plano. Sem cartão de crédito. <br className="hidden sm:block" /> Cancele quando quiser.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-semibold transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <Switch
            checked={yearly}
            onCheckedChange={setYearly}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary"
          />
          <span className={`text-sm font-semibold transition-colors flex items-center ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Anual{" "}
            <span className="inline-flex ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
              -20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-center">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative rounded-3xl transition-all duration-300 ${plan.highlight
                ? "md:scale-105 z-10 p-[1px] hover:-translate-y-1"
                : "p-[1px] hover:-translate-y-1 opacity-90 hover:opacity-100"
                }`}
            >
              {plan.highlight ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary/30 rounded-3xl opacity-50 blur-md group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-transparent rounded-3xl" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-border/60 to-transparent rounded-3xl" />
              )}

              <div className={`relative h-full flex flex-col rounded-[23px] p-8 sm:p-10 ${plan.highlight
                ? "bg-card backdrop-blur-3xl overflow-hidden"
                : "bg-card backdrop-blur-2xl"
                }`}>

                {plan.highlight && (
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                )}

                <div className="h-8 mb-4">
                  {plan.highlight && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/20 text-primary border border-primary/30">
                      <AppIcon name="Star" size={14} className="fill-current" />
                      Mais popular
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${plan.highlight
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-secondary/50 border-border text-muted-foreground"
                    }`}>
                    <AppIcon name={plan.icon} size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground min-h-[40px] font-medium">
                  {plan.description}
                </p>

                <div className="mt-8 mb-10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-medium text-muted-foreground">R$</span>
                    <span className="text-6xl font-extrabold tabular-nums tracking-tighter text-foreground">
                      {yearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </div>
                  {yearly && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded-md">
                        Economize R$ {(plan.monthly - plan.yearly) * 12} no ano
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`group/btn mt-auto flex items-center justify-center gap-2 w-full h-14 rounded-xl font-bold text-base transition-all duration-300 active:scale-[0.98] ${plan.highlight
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
                    : "bg-secondary/60 hover:bg-secondary text-foreground backdrop-blur-md border border-border"
                    }`}
                >
                  {plan.cta}
                  <AppIcon name="ArrowRight" size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="mt-10 pt-8 border-t border-border">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-5 text-muted-foreground">
                    O que está incluído:
                  </p>
                  <ul className="space-y-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm font-medium text-foreground/70">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                          <AppIcon name="Check" size={12} />
                        </div>
                        <span className="leading-snug">{f}</span>
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
