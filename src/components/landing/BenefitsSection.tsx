import { DollarSign, Users, Trophy, Brain, Package, ClipboardCheck } from "lucide-react";

const benefits = [
  { icon: DollarSign, title: "Gestão financeira integrada", desc: "Controle receitas, despesas, contas e fluxo de caixa em tempo real.", glow: "--neon-green" },
  { icon: Users, title: "Controle de equipe", desc: "Gerencie desempenho, escalas, pagamentos e produtividade do time.", glow: "--primary" },
  { icon: Trophy, title: "Gamificação e ranking", desc: "Engaje a equipe com pontos, medalhas e competição saudável.", glow: "--neon-amber" },
  { icon: Brain, title: "Copiloto com IA", desc: "Receba insights, sugestões e automações inteligentes no dia a dia.", glow: "--neon-cyan" },
  { icon: Package, title: "Estoque inteligente", desc: "Controle de estoque com alertas, movimentações e previsão de compra.", glow: "--neon-purple" },
  { icon: ClipboardCheck, title: "Checklists e operação", desc: "Garanta que tudo seja feito no padrão, todos os dias, por toda equipe.", glow: "--neon-green" },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Benefícios
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Tudo o que você precisa para operar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="card-surface p-7 hover:scale-[1.01] transition-all duration-300"
            >
              <div
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg mb-4"
                style={{
                  background: `hsl(var(${b.glow}) / 0.1)`,
                  border: `1px solid hsl(var(${b.glow}) / 0.2)`,
                  color: `hsl(var(${b.glow}))`,
                }}
              >
                <b.icon className="w-5 h-5" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
