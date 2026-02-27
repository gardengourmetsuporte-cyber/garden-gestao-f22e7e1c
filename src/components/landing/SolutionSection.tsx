import { DollarSign, ClipboardCheck, Package, BarChart3, ArrowRight } from "lucide-react";
import screenshotFinanceiro from "@/assets/screenshot-financeiro.png";
import screenshotChecklist from "@/assets/screenshot-checklist.png";
import screenshotEstoque from "@/assets/screenshot-estoque.png";

const steps = [
  {
    number: "01",
    title: "Cadastre suas contas e categorias",
    desc: "Em minutos, configure suas contas bancárias, categorias de despesas e receitas. O sistema já vem com sugestões prontas para restaurantes.",
    image: screenshotFinanceiro,
    alt: "Configuração financeira do Garden",
  },
  {
    number: "02",
    title: "Configure os checklists da sua equipe",
    desc: "Crie tarefas para abertura, fechamento e rotina. Cada funcionário sabe exatamente o que fazer — e você acompanha de qualquer lugar.",
    image: screenshotChecklist,
    alt: "Checklist de abertura e fechamento",
  },
  {
    number: "03",
    title: "Acompanhe tudo em tempo real",
    desc: "Dashboard com lucro, estoque, equipe e alertas. Sem surpresas no final do mês.",
    image: screenshotEstoque,
    alt: "Dashboard com visão geral",
  },
];

const modules = [
  {
    icon: DollarSign,
    title: "Financeiro",
    desc: "Receitas, despesas, contas e fechamento de caixa integrado.",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    shadow: "group-hover:shadow-[0_8px_24px_-8px_hsl(var(--success)/0.15)]",
  },
  {
    icon: ClipboardCheck,
    title: "Checklists",
    desc: "Abertura, fechamento e rotina com progresso em tempo real.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    shadow: "group-hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.15)]",
  },
  {
    icon: Package,
    title: "Estoque",
    desc: "Controle de ingredientes com alertas de estoque mínimo.",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    shadow: "group-hover:shadow-[0_8px_24px_-8px_hsl(var(--warning)/0.15)]",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    desc: "DRE, custos por categoria e resumo semanal automático.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
    shadow: "group-hover:shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.15)]",
  },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 relative">
      {/* Ambient */}
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-success/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-full mb-4">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Comece em 3 passos simples
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            Do zero ao controle total em menos de 10 minutos.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-20 md:space-y-28">
          {steps.map((step, i) => (
            <div key={step.number} className={`grid md:grid-cols-2 gap-10 md:gap-14 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
              <div className="md:[direction:ltr] space-y-4">
                {/* Step number badge */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <span className="text-sm font-extrabold text-primary">{step.number}</span>
                  </div>
                  <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-primary/40 to-transparent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{step.desc}</p>
              </div>
              <div className="md:[direction:ltr]">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-[30px] rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="rounded-2xl overflow-hidden border border-border/50 shadow-card bg-card group-hover:shadow-card-hover transition-all duration-500 group-hover:-translate-y-1">
                    {/* Mini browser bar */}
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-secondary/40 border-b border-border/30">
                      <div className="w-2 h-2 rounded-full bg-destructive/40" />
                      <div className="w-2 h-2 rounded-full bg-warning/40" />
                      <div className="w-2 h-2 rounded-full bg-success/40" />
                    </div>
                    <img src={step.image} alt={step.alt} className="w-full" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules grid */}
        <div className="mt-28 md:mt-36">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Tudo que você precisa, em um só lugar
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Módulos integrados que conversam entre si para você ter uma visão completa.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className={`group rounded-2xl border border-border/40 bg-card p-6 flex gap-4 items-start hover:-translate-y-0.5 transition-all duration-300 ${m.shadow}`}
              >
                <div className={`w-11 h-11 rounded-xl border ${m.border} ${m.bg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{m.title}</h4>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
