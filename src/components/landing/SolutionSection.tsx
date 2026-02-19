import { Layers, Sparkles, Smartphone, Brain } from "lucide-react";

const pillars = [
  { icon: Layers, label: "Centralizador", desc: "Tudo num único sistema" },
  { icon: Brain, label: "Inteligente", desc: "IA que ajuda a decidir" },
  { icon: Smartphone, label: "Simples", desc: "Mobile-first, fácil de usar" },
  { icon: Sparkles, label: "Assistido por IA", desc: "Copiloto para o dia a dia" },
];

export function SolutionSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            A solução
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Um sistema que substitui vários
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            O Bosst centraliza financeiro, estoque, equipe, checklists e marketing — com inteligência artificial integrada.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div
              key={p.label}
              className="flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "hsl(var(--neon-cyan) / 0.05)",
                border: "1px solid hsl(var(--neon-cyan) / 0.15)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                  boxShadow: "0 0 20px hsl(var(--neon-cyan) / 0.3)",
                }}
              >
                <p.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{p.label}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
