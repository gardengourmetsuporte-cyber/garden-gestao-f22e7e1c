import { TrendingDown, AlertTriangle, Users } from "lucide-react";

const problems = [
  {
    icon: TrendingDown,
    title: '"Quanto sobrou esse mês?"',
    desc: "Você fecha o mês sem saber se teve lucro ou prejuízo. As contas estão espalhadas em papéis e grupos de WhatsApp.",
    color: "text-destructive",
    bg: "bg-destructive/12",
    iconBorder: "border-destructive/20",
  },
  {
    icon: AlertTriangle,
    title: '"Faltou ingrediente de novo"',
    desc: "Estoque zerado no meio do serviço. Sem controle, você descobre na hora errada.",
    color: "text-warning",
    bg: "bg-warning/12",
    iconBorder: "border-warning/20",
  },
  {
    icon: Users,
    title: '"A equipe não se engaja"',
    desc: "Funcionário sem feedback, sem meta, sem motivação. Alta rotatividade, baixa produtividade.",
    color: "text-primary",
    bg: "bg-primary/12",
    iconBorder: "border-primary/20",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-5">
            O problema
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
            Você reconhece alguma dessas situações?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="card-interactive p-8 text-center"
            >
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${p.bg} border ${p.iconBorder} mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <p.icon className={`w-7 h-7 ${p.color}`} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
