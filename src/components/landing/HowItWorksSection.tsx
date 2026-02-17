const steps = [
  { num: "1", title: "Cadastre sua empresa", desc: "Crie sua conta em menos de 2 minutos. Sem burocracia." },
  { num: "2", title: "Configure seus módulos", desc: "Ative apenas o que precisa: financeiro, estoque, equipe, checklists." },
  { num: "3", title: "Acompanhe tudo em tempo real", desc: "Dashboard unificado com os dados que importam para decidir." },
  { num: "4", title: "Use a IA para decidir melhor", desc: "O copiloto analisa seus dados e sugere ações práticas." },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Simples de começar, poderoso de usar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="text-center relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-px" style={{ background: "hsl(var(--border) / 0.5)" }} />
              )}
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg mb-5 relative z-10"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                  color: "white",
                  boxShadow: "0 0 20px hsl(var(--neon-cyan) / 0.3)",
                }}
              >
                {s.num}
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
