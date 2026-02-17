import { DollarSign, Users, Trophy, Brain, Package, ClipboardCheck } from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Gestão financeira integrada",
    desc: "Controle receitas, despesas, contas e fluxo de caixa em tempo real.",
  },
  {
    icon: Users,
    title: "Controle de equipe",
    desc: "Gerencie desempenho, escalas, pagamentos e produtividade do time.",
  },
  {
    icon: Trophy,
    title: "Gamificação e ranking",
    desc: "Engaje a equipe com pontos, medalhas e competição saudável.",
  },
  {
    icon: Brain,
    title: "Copiloto com IA",
    desc: "Receba insights, sugestões e automações inteligentes no dia a dia.",
  },
  {
    icon: Package,
    title: "Estoque inteligente",
    desc: "Controle de estoque com alertas, movimentações e previsão de compra.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklists e operação",
    desc: "Garanta que tudo seja feito no padrão, todos os dias, por toda equipe.",
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
            Benefícios
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Tudo o que você precisa para operar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-blue-50 text-blue-600 mb-4">
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {b.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
