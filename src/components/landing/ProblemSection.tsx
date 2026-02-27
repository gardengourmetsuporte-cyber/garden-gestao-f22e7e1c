const problems = [
  {
    emoji: "😰",
    title: '"Quanto sobrou esse mês?"',
    desc: "Você fecha o mês sem saber se teve lucro ou prejuízo. As contas estão espalhadas em papéis e grupos de WhatsApp.",
    gradient: "from-destructive/10 to-destructive/5",
    border: "border-destructive/15 hover:border-destructive/30",
    iconBg: "bg-destructive/10",
  },
  {
    emoji: "📦",
    title: '"Faltou ingrediente de novo"',
    desc: "Estoque zerado no meio do serviço. Sem controle, você descobre na hora errada.",
    gradient: "from-warning/10 to-warning/5",
    border: "border-warning/15 hover:border-warning/30",
    iconBg: "bg-warning/10",
  },
  {
    emoji: "👥",
    title: '"A equipe não se engaja"',
    desc: "Funcionário sem feedback, sem meta, sem motivação. Alta rotatividade, baixa produtividade.",
    gradient: "from-primary/10 to-primary/5",
    border: "border-primary/15 hover:border-primary/30",
    iconBg: "bg-primary/10",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            O problema
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Você reconhece alguma dessas situações?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className={`group rounded-2xl border ${p.border} bg-gradient-to-b ${p.gradient} p-8 text-center transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${p.iconBg} mb-5 text-3xl transition-transform group-hover:scale-110`}>
                {p.emoji}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
