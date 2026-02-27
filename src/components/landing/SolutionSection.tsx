import { 
  DollarSign, ClipboardCheck, Package, BarChart3, 
  Users, Calendar, Bot, ShoppingCart, Gamepad2, UtensilsCrossed 
} from "lucide-react";
import screenshotFinanceiro from "@/assets/screenshot-financeiro.png";
import screenshotChecklist from "@/assets/screenshot-checklist.png";
import screenshotEstoque from "@/assets/screenshot-estoque.png";
import screenshotRelatorios from "@/assets/screenshot-relatorios.png";

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
  },
  {
    icon: ClipboardCheck,
    title: "Checklists",
    desc: "Abertura, fechamento e rotina com progresso em tempo real.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Package,
    title: "Estoque",
    desc: "Controle de ingredientes com alertas de estoque mínimo.",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    desc: "DRE, custos por categoria e resumo semanal automático.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: Users,
    title: "Gestão de Equipe",
    desc: "Escala, ponto, folha de pagamento e ranking de desempenho.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: UtensilsCrossed,
    title: "Fichas Técnicas",
    desc: "Monte receitas com custo automático baseado no estoque.",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  {
    icon: Calendar,
    title: "Agenda & Marketing",
    desc: "Calendário de tarefas, campanhas e datas comemorativas.",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  {
    icon: Bot,
    title: "IA Copiloto",
    desc: "Assistente inteligente que analisa dados e sugere ações.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: ShoppingCart,
    title: "Pedidos Online",
    desc: "Cardápio digital com pedidos via tablet e WhatsApp.",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
  {
    icon: Gamepad2,
    title: "Gamificação",
    desc: "Roleta de prêmios e ranking para engajar clientes e equipe.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-success/4 blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-5">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
            Comece em 3 passos simples
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Do zero ao controle total em menos de 10 minutos.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-24 md:space-y-32">
          {steps.map((step, i) => (
            <div key={step.number} className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
              <div className="md:[direction:ltr] space-y-5">
                <div className="inline-flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white"
                    style={{
                      background: 'linear-gradient(135deg, hsl(224 45% 12%), hsl(220 70% 20%), hsl(234 75% 30%))',
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-primary/30 to-transparent" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{step.desc}</p>
              </div>
              <div className="md:[direction:ltr]">
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent blur-[40px] rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="rounded-2xl overflow-hidden border border-border/40 shadow-card bg-card group-hover:shadow-elevated transition-all duration-500 group-hover:-translate-y-1">
                    {/* Mini browser bar */}
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-secondary/50 border-b border-border/30">
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
        <div className="mt-32 md:mt-40">
          <div className="text-center mb-14">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
              Tudo que você precisa, em um só lugar
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto text-base">
              Módulos integrados que conversam entre si para você ter uma visão completa.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group rounded-2xl border border-border/40 bg-card p-6 flex gap-4 items-start hover:-translate-y-1 transition-all duration-300 hover:shadow-card-hover hover:border-border/60"
              >
                <div className={`w-12 h-12 rounded-2xl border ${m.border} ${m.bg} flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110`}>
                  <m.icon className={`w-5.5 h-5.5 ${m.color}`} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm mb-1">{m.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
