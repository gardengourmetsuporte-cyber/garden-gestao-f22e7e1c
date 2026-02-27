import { TrendingDown, AlertTriangle, Users } from "lucide-react";

const problems = [
  {
    icon: TrendingDown,
    title: '"Quanto sobrou esse mês?"',
    desc: "Você fecha o mês sem saber se teve lucro ou prejuízo. As contas estão espalhadas em papéis e grupos de WhatsApp.",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20 hover:border-destructive/40",
    shadow: "hover:shadow-[0_8px_30px_-8px_hsl(var(--destructive)/0.2)]",
  },
  {
    icon: AlertTriangle,
    title: '"Faltou ingrediente de novo"',
    desc: "Estoque zerado no meio do serviço. Sem controle, você descobre na hora errada.",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20 hover:border-warning/40",
    shadow: "hover:shadow-[0_8px_30px_-8px_hsl(var(--warning)/0.2)]",
  },
  {
    icon: Users,
    title: '"A equipe não se engaja"',
    desc: "Funcionário sem feedback, sem meta, sem motivação. Alta rotatividade, baixa produtividade.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20 hover:border-primary/40",
    shadow: "hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.2)]",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-full mb-4">
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
              className={`group rounded-2xl border ${p.border} bg-card p-8 text-center transition-all duration-300 hover:-translate-y-1.5 ${p.shadow}`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${p.bg} mb-5 transition-transform duration-300 group-hover:scale-110`}>
                <p.icon className={`w-6 h-6 ${p.color}`} />
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
