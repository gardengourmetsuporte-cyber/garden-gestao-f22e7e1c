import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import logoImg from "@/assets/logo.png";

const features = [
  { icon: "BarChart3", label: "Financeiro" },
  { icon: "Package", label: "Estoque" },
  { icon: "Users", label: "Equipe" },
  { icon: "ListChecks", label: "Checklists" },
  { icon: "Bot", label: "IA Copiloto" },
  { icon: "ShoppingCart", label: "Pedidos" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Navy gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(224 45% 6%) 0%, hsl(220 70% 16%) 18%, hsl(234 75% 28%) 36%, hsl(220 65% 18%) 54%, hsl(228 55% 10%) 72%, hsl(234 75% 26%) 88%, hsl(224 45% 6%) 100%)',
          backgroundSize: '350% 350%',
          animation: 'navyCardFlow 12s ease-in-out infinite',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full blur-[150px] opacity-15 pointer-events-none"
        style={{ background: 'hsl(220 80% 50%)', animation: 'float-orb-1 8s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: 'hsl(234 80% 60%)', animation: 'float-orb-2 10s ease-in-out infinite' }}
      />
      <div
        className="absolute top-[60%] left-[50%] w-[200px] h-[200px] rounded-full blur-[80px] opacity-10 pointer-events-none"
        style={{ background: 'hsl(210 90% 55%)', animation: 'float-orb-3 6s ease-in-out infinite' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 md:pt-40 pb-20 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left — Text */}
          <div className="space-y-7 animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'hsl(220 60% 50% / 0.12)', color: 'hsl(220 80% 70%)', border: '1px solid hsl(220 60% 50% / 0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Feito por restaurante, para restaurantes
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-white font-display">
              A gestão completa{" "}
              <br className="hidden sm:block" />
              que seu restaurante{" "}
              <br className="hidden sm:block" />
              <span className="text-white/50">precisa pra crescer</span>
            </h1>

            <p className="text-base sm:text-lg text-white/50 max-w-md leading-relaxed">
              Financeiro, estoque, equipe e IA — tudo em um app criado por quem vive a rotina de food service.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/auth?plan=free"
                className="group inline-flex items-center gap-2.5 h-13 px-8 rounded-xl font-bold text-sm bg-white text-[hsl(220,30%,15%)] shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
              >
                Começar grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 h-13 px-6 rounded-xl text-sm font-semibold text-white/70 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all duration-200"
              >
                Já tenho conta
              </Link>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-white/30 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              <span>14 dias grátis</span>
              <span className="mx-1 text-white/10">•</span>
              <span>Sem cartão</span>
              <span className="mx-1 text-white/10">•</span>
              <span>Setup em 5min</span>
            </div>
          </div>

          {/* Right — Screenshot (desktop) */}
          <div className="relative hidden md:block animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
            <div
              className="relative"
              style={{ transform: "perspective(1200px) rotateY(-6deg) rotateX(2deg)" }}
            >
              <div className="absolute -inset-6 rounded-3xl blur-[60px]" style={{ background: 'hsl(234 80% 50% / 0.12)' }} />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5" style={{ background: 'hsl(220 30% 8%)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="h-5 rounded-md max-w-[200px] mx-auto flex items-center justify-center" style={{ background: 'hsl(220 20% 12%)' }}>
                      <span className="text-[10px] text-white/25 font-medium">app.gardengestao.com.br</span>
                    </div>
                  </div>
                </div>
                <img src={dashboardMockup} alt="Dashboard do Garden Gestão" className="w-full" loading="eager" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature pills row */}
        <div className="mt-14 md:mt-20 flex flex-wrap items-center justify-center gap-3 animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.5s_both]">
          {features.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.04]"
              style={{
                background: 'hsl(220 60% 50% / 0.08)',
                color: 'hsl(220 80% 72%)',
                border: '1px solid hsl(220 60% 50% / 0.12)',
              }}
            >
              <AppIcon name={icon} size={16} />
              {label}
            </div>
          ))}
        </div>

        {/* Mobile screenshot */}
        <div className="md:hidden mt-12 animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)_0.4s_both]">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5" style={{ background: 'hsl(220 30% 8%)' }}>
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
            </div>
            <img src={dashboardMockup} alt="Dashboard do Garden Gestão" className="w-full" loading="eager" />
          </div>
        </div>
      </div>

      {/* Bottom curve transition */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-[2rem]" />
    </section>
  );
}
