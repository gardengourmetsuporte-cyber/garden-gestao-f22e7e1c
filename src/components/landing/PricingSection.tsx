import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const plans = [
  {
    name: "Grátis",
    description: "Para quem está começando",
    monthly: 0,
    yearly: 0,
    highlight: false,
    features: [
      "Dashboard básico",
      "Agenda",
      "1 Checklist",
      "Chat interno",
      "Até 3 usuários",
    ],
    cta: "Comece grátis",
  },
  {
    name: "Pro",
    description: "O mais escolhido",
    monthly: 97,
    yearly: 77,
    highlight: true,
    features: [
      "Tudo do Grátis",
      "Financeiro completo",
      "Estoque inteligente",
      "Gestão de equipe",
      "Fichas técnicas",
      "Gamificação e ranking",
      "Fechamento de caixa",
      "Até 15 usuários",
    ],
    cta: "Assinar Pro",
  },
  {
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
    cta: "Assinar Business",
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="planos" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Planos para cada fase do seu negócio
          </h2>
          <p className="text-lg text-slate-600">
            Comece grátis e escale conforme cresce. Sem surpresas.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!yearly ? "text-slate-900" : "text-slate-500"}`}>Mensal</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={`text-sm font-medium ${yearly ? "text-slate-900" : "text-slate-500"}`}>
              Anual{" "}
              <span className="inline-block ml-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlight
                  ? "bg-white border-2 border-blue-600 shadow-xl shadow-blue-600/10 scale-[1.02]"
                  : "bg-white border border-slate-200 shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                  <Star className="w-3 h-3" /> Mais popular
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{plan.description}</p>

              <div className="mt-6 mb-8">
                <span className="text-4xl font-extrabold text-slate-900">
                  R$ {yearly ? plan.yearly : plan.monthly}
                </span>
                <span className="text-slate-500 text-sm">/mês</span>
              </div>

              <Link
                to="/auth"
                className={`block w-full text-center h-12 leading-[3rem] rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
