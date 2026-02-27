import { AppIcon } from "@/components/ui/app-icon";

const problems = [
  {
    icon: "TrendingDown",
    title: '"Quanto sobrou esse mês?"',
    desc: "Você fecha o mês sem saber se teve lucro ou prejuízo. As contas estão espalhadas em planilhas e grupos de WhatsApp.",
    gradient: "from-red-500/10 to-orange-500/5",
    iconBg: "bg-destructive/12",
    iconColor: "text-destructive",
  },
  {
    icon: "AlertTriangle",
    title: '"Faltou ingrediente de novo"',
    desc: "Estoque zerado no meio do serviço. Sem controle, você descobre na hora errada e perde venda.",
    gradient: "from-amber-500/10 to-yellow-500/5",
    iconBg: "bg-warning/12",
    iconColor: "text-warning",
  },
  {
    icon: "Users",
    title: '"A equipe não se engaja"',
    desc: "Funcionário sem feedback, sem meta, sem motivação. Alta rotatividade e baixa produtividade.",
    gradient: "from-blue-500/10 to-indigo-500/5",
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-5">
            O problema
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight font-display">
            Você reconhece alguma dessas situações?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl ${p.iconBg} flex items-center justify-center mb-4`}>
                  <AppIcon name={p.icon} size={22} className={p.iconColor} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
