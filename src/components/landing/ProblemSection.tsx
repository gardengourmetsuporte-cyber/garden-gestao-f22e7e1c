import { FileSpreadsheet, Unplug, UserX } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planilhas espalhadas",
    desc: "Sem visão real do negócio. Dados em lugares diferentes, decisões no escuro.",
    glow: "--neon-red",
  },
  {
    icon: Unplug,
    title: "Sistemas que não conversam",
    desc: "Pagar por 5 ferramentas diferentes que não se integram é caro e ineficiente.",
    glow: "--neon-amber",
  },
  {
    icon: UserX,
    title: "Equipe desengajada",
    desc: "Sem acompanhamento, sem feedback, sem motivação. O time trabalha, mas ninguém vê.",
    glow: "--neon-purple",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-red))" }}>
            O problema
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Gestão fragmentada custa caro
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="card-surface p-8 text-center"
            >
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5"
                style={{
                  background: `hsl(var(${p.glow}) / 0.1)`,
                  border: `1px solid hsl(var(${p.glow}) / 0.25)`,
                  color: `hsl(var(${p.glow}))`,
                }}
              >
                <p.icon className="w-6 h-6" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
