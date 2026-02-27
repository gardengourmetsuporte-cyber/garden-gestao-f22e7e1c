import { AppIcon } from "@/components/ui/app-icon";
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
  { icon: "DollarSign", title: "Financeiro", desc: "Receitas, despesas, contas e fechamento de caixa integrado." },
  { icon: "ClipboardCheck", title: "Checklists", desc: "Abertura, fechamento e rotina com progresso em tempo real." },
  { icon: "Package", title: "Estoque", desc: "Controle de ingredientes com alertas e sugestão de pedidos." },
  { icon: "BarChart3", title: "Relatórios", desc: "DRE, custos por categoria e resumo semanal automático." },
  { icon: "Users", title: "Gestão de Equipe", desc: "Escala, ponto, folha de pagamento e ranking de desempenho." },
  { icon: "UtensilsCrossed", title: "Fichas Técnicas", desc: "Monte receitas com custo automático baseado no estoque." },
  { icon: "Calendar", title: "Agenda & Marketing", desc: "Calendário de tarefas, campanhas e datas comemorativas." },
  { icon: "Bot", title: "IA Copiloto", desc: "Assistente inteligente que analisa dados e sugere ações." },
  { icon: "ShoppingCart", title: "Pedidos Online", desc: "Cardápio digital com pedidos via tablet e WhatsApp." },
  { icon: "Gamepad2", title: "Gamificação", desc: "Roleta de prêmios e ranking para engajar clientes e equipe." },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-5">
            Como funciona
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight font-display">
            Comece em 3 passos simples
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Do zero ao controle total em menos de 10 minutos.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`grid md:grid-cols-2 gap-10 md:gap-14 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}
            >
              <div className="md:[direction:ltr] space-y-5">
                <div className="inline-flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm text-white"
                    style={{
                      background: 'linear-gradient(135deg, hsl(220 70% 16%), hsl(234 75% 28%))',
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-primary/30 to-transparent" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{step.desc}</p>
              </div>
              <div className="md:[direction:ltr]">
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent blur-[40px] rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-400">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b border-border/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-warning/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-success/30" />
                    </div>
                    <img src={step.image} alt={step.alt} className="w-full" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules grid */}
        <div className="mt-24 md:mt-32">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3 font-display">
              Tudo que você precisa, em um só lugar
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
              10 módulos integrados que conversam entre si para você ter uma visão completa.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group relative rounded-2xl border border-border/50 bg-card p-4 sm:p-5 text-center transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/12 transition-colors">
                  <AppIcon name={m.icon} size={20} className="text-primary" />
                </div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm mb-1">{m.title}</h4>
                <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed hidden sm:block">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
