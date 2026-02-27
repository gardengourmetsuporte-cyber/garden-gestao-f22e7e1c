import { DollarSign, ClipboardCheck, Package, BarChart3 } from "lucide-react";
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
    accent: "primary",
  },
  {
    number: "02",
    title: "Configure os checklists da sua equipe",
    desc: "Crie tarefas para abertura, fechamento e rotina. Cada funcionário sabe exatamente o que fazer — e você acompanha de qualquer lugar.",
    image: screenshotChecklist,
    alt: "Checklist de abertura e fechamento",
    accent: "success",
  },
  {
    number: "03",
    title: "Acompanhe tudo em tempo real",
    desc: "Dashboard com lucro, estoque, equipe e alertas. Sem surpresas no final do mês.",
    image: screenshotEstoque,
    alt: "Dashboard com visão geral",
    accent: "accent",
  },
];

const modules = [
  {
    icon: DollarSign,
    title: "Financeiro",
    desc: "Receitas, despesas, contas e fechamento de caixa integrado.",
    color: "text-success bg-success/10 border-success/20",
  },
  {
    icon: ClipboardCheck,
    title: "Checklists",
    desc: "Abertura, fechamento e rotina com progresso em tempo real.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: Package,
    title: "Estoque",
    desc: "Controle de ingredientes com alertas de estoque mínimo.",
    color: "text-warning bg-warning/10 border-warning/20",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    desc: "DRE, custos por categoria e resumo semanal automático.",
    color: "text-accent bg-accent/10 border-accent/20",
  },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 relative">
      {/* Background accent */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -translate-y-1/2" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Comece em 3 passos simples
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-24">
          {steps.map((step, i) => (
            <div key={step.number} className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
              <div className="md:[direction:ltr]">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <span className="text-lg font-extrabold text-primary">{step.number}</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mt-2 mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{step.desc}</p>
              </div>
              <div className="md:[direction:ltr]">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/8 blur-[40px] rounded-3xl -z-10 scale-95 group-hover:bg-primary/12 transition-all duration-500" />
                  <div className="rounded-2xl overflow-hidden border border-border/40 shadow-card bg-card group-hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
                    <img src={step.image} alt={step.alt} className="w-full" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules grid */}
        <div className="mt-28">
          <h3 className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Tudo que você precisa, em um só lugar
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Módulos integrados que conversam entre si para você ter uma visão completa.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group rounded-2xl border border-border/40 bg-card p-6 flex gap-4 items-start hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${m.color} transition-transform group-hover:scale-110`}>
                  <m.icon className="w-5 h-5" />
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
