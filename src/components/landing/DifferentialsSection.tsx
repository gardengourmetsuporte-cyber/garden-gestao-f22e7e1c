import { Bot, Gamepad2, Smartphone, Wallet } from "lucide-react";

const diffs = [
  { icon: Bot, title: "IA integrada ao dia a dia", desc: "Não é só relatório. A IA sugere, alerta e automatiza decisões operacionais.", glow: "--neon-cyan" },
  { icon: Gamepad2, title: "Gamificação real", desc: "Pontos, ranking, medalhas e recompensas que engajam a equipe de verdade.", glow: "--neon-amber" },
  { icon: Smartphone, title: "Mobile-first", desc: "Feito para usar no celular. Gestão na palma da mão, em qualquer lugar.", glow: "--neon-purple" },
  { icon: Wallet, title: "Preço justo para PMEs", desc: "Um sistema completo pelo preço de um. Pensado para quem não pode pagar vários.", glow: "--neon-green" },
];

export function DifferentialsSection() {
  return (
    <section id="diferenciais" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Diferenciais
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Por que o Garden é diferente
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {diffs.map((d) => (
            <div key={d.title} className="flex gap-5 card-surface p-7">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `hsl(var(${d.glow}) / 0.1)`,
                  border: `1px solid hsl(var(${d.glow}) / 0.2)`,
                  color: `hsl(var(${d.glow}))`,
                }}
              >
                <d.icon className="w-5 h-5" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
