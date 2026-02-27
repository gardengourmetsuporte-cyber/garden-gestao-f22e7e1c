import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, ClipboardCheck, Package } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const badges = [
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    desc: "Receitas, despesas e fluxo de caixa em tempo real.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklists Inteligentes",
    desc: "Abertura, fechamento e rotina com pontuação.",
  },
  {
    icon: Package,
    title: "Estoque Automático",
    desc: "Alertas de mínimo e sugestão de pedidos por IA.",
  },
];

export function HeroSection() {
  return (
    <section className="finance-hero-card !rounded-none !cursor-default !border-0" style={{ transform: "none" }}>
      {/* Main hero content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left — Text */}
          <div className="space-y-7">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-white">
              A gestão completa{" "}
              <br className="hidden sm:block" />
              que seu restaurante{" "}
              <br className="hidden sm:block" />
              <span className="text-white/60">precisa pra crescer</span>
            </h1>

            <p className="text-base sm:text-lg text-white/55 max-w-md leading-relaxed">
              Financeiro, estoque, equipe e IA — tudo em um app criado por quem vive a rotina de food service.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <Link
                to="/auth?plan=free"
                className="group inline-flex items-center gap-2.5 h-13 px-8 rounded-xl font-bold text-sm bg-white text-[hsl(220,30%,15%)] shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
              >
                Começar grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/auth"
                className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors pt-3 sm:pt-0 sm:self-center"
              >
                Já tenho conta →
              </Link>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-xs text-white/40 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                14 dias grátis
              </span>
              <span className="text-white/20">·</span>
              <span>Sem cartão</span>
              <span className="text-white/20">·</span>
              <span>Setup em 5min</span>
            </div>
          </div>

          {/* Right — Screenshot */}
          <div className="relative hidden md:block">
            <div
              className="relative"
              style={{
                transform: "perspective(1200px) rotateY(-6deg) rotateX(2deg)",
              }}
            >
              {/* Glow behind */}
              <div className="absolute -inset-6 bg-[hsl(234,80%,50%/0.15)] blur-[60px] rounded-3xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(220,30%,8%)] border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="h-5 rounded-md bg-white/5 max-w-[200px] mx-auto flex items-center justify-center">
                      <span className="text-[10px] text-white/25 font-medium">app.gardengestao.com.br</span>
                    </div>
                  </div>
                </div>
                <img
                  src={dashboardMockup}
                  alt="Dashboard do Garden Gestão — visão geral do sistema"
                  className="w-full"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature badges */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/90">{b.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed mt-1">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile screenshot */}
      <div className="md:hidden px-4 pb-12">
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(220,30%,8%)] border-b border-white/5">
            <div className="w-2 h-2 rounded-full bg-red-400/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
            <div className="w-2 h-2 rounded-full bg-green-400/60" />
          </div>
          <img
            src={dashboardMockup}
            alt="Dashboard do Garden Gestão"
            className="w-full"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
