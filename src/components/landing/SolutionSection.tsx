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
  },
  {
    icon: ClipboardCheck,
    title: "Checklists",
    desc: "Abertura, fechamento e rotina com progresso em tempo real.",
  },
  {
    icon: Package,
    title: "Estoque",
    desc: "Controle de ingredientes com alertas de estoque mínimo.",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    desc: "DRE, custos por categoria e resumo semanal automático.",
  },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Comece em 3 passos simples
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-20">
          {steps.map((step, i) => (
            <div key={step.number} className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
              <div className="md:[direction:ltr]">
                <span className="text-5xl font-extrabold text-muted-foreground/20">{step.number}</span>
                <h3 className="text-xl font-bold text-foreground mt-2 mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
              <div className="md:[direction:ltr]">
                <div className="rounded-2xl overflow-hidden border border-border/40 shadow-lg bg-card">
                  <img src={step.image} alt={step.alt} className="w-full" loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules grid */}
        <div className="mt-24">
          <h3 className="text-center text-2xl font-bold text-foreground mb-10">
            Tudo que você precisa, em um só lugar
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {modules.map((m) => (
              <div key={m.title} className="rounded-2xl border border-border/40 bg-card p-6 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <m.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{m.title}</h4>
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
