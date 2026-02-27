import { useState } from "react";
import { Check, Star } from "lucide-react";
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
    <section id="planos" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Planos para cada fase do seu restaurante
          </h2>
        </div>

        <p
          className="text-center text-sm font-semibold mb-10 py-2 px-4 rounded-full inline-flex mx-auto"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.25)",
            color: "hsl(var(--primary))",
            display: "table",
            margin: "0 auto 2.5rem",
          }}
        >
          14 dias grátis em qualquer plano. Sem cartão de crédito.
        </p>

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Anual{" "}
            <span
              className="inline-block ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
            >
              -20%
            </span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 transition-all duration-300 ${
                plan.highlight ? "landing-card-highlight scale-[1.02]" : "landing-card"
              }`}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold z-10"
                  style={{
                    background: "var(--gradient-brand)",
                    color: "white",
                    boxShadow: "0 4px 12px hsl(220 45% 18% / 0.4)",
                  }}
                >
                  <Star className="w-3 h-3" /> Mais popular
                </div>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm opacity-60 mt-1">{plan.description}</p>

              <div className="mt-6 mb-8">
                <span className="text-4xl font-extrabold">
                  R$ {yearly ? plan.yearly : plan.monthly}
                </span>
                <span className="opacity-60 text-sm">/mês</span>
              </div>

              <button
                onClick={() => setSelectedPlan(plan)}
                className="block w-full text-center h-12 leading-[3rem] rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
                style={{
                  background: "var(--gradient-brand)",
                  color: "white",
                  boxShadow: "0 4px 16px hsl(220 45% 18% / 0.3)",
                }}
              >
                {plan.cta}
              </button>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm opacity-70">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-success" />
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
