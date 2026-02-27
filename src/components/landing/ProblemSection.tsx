const problems = [
  {
    emoji: "😰",
    title: '"Quanto sobrou esse mês?"',
    desc: "Você fecha o mês sem saber se teve lucro ou prejuízo. As contas estão espalhadas em papéis e grupos de WhatsApp.",
  },
  {
    emoji: "📦",
    title: '"Faltou ingrediente de novo"',
    desc: "Estoque zerado no meio do serviço. Sem controle, você descobre na hora errada.",
  },
  {
    emoji: "👥",
    title: '"A equipe não se engaja"',
    desc: "Funcionário sem feedback, sem meta, sem motivação. Alta rotatividade, baixa produtividade.",
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
            Você reconhece alguma dessas situações?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="card-surface p-8 text-center"
            >
              <div className="text-4xl mb-5">{p.emoji}</div>
              <h3 className="text-base font-bold text-foreground mb-3">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
