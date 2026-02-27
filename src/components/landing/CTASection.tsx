import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import logoImg from "@/assets/logo.png";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl overflow-hidden p-10 sm:p-14 md:p-20 text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(224 45% 6%) 0%, hsl(220 70% 16%) 18%, hsl(234 75% 28%) 36%, hsl(220 65% 18%) 54%, hsl(228 55% 10%) 72%, hsl(234 75% 26%) 88%, hsl(224 45% 6%) 100%)',
            backgroundSize: '350% 350%',
            animation: 'navyCardFlow 12s ease-in-out infinite',
          }}
        >
          {/* Glow orbs */}
          <div className="absolute top-[20%] left-[20%] w-[250px] h-[250px] rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ background: 'hsl(220 80% 50%)', animation: 'float-orb-1 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[20%] right-[20%] w-[200px] h-[200px] rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'hsl(234 80% 60%)', animation: 'float-orb-2 10s ease-in-out infinite' }} />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-8 shadow-lg" style={{ boxShadow: '0 0 60px hsl(220 80% 50% / 0.15)' }}>
              <img src={logoImg} alt="Garden" className="w-11 h-11 object-contain" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight font-display">
              Criado por quem entende<br className="hidden sm:block" /> sua operação.
            </h2>
            <p className="text-white/50 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
            </p>

            <Link
              to="/auth?plan=free"
              className="group inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base bg-white text-[hsl(220,30%,15%)] shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              Criar minha conta grátis
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="mt-7 flex items-center justify-center gap-4 sm:gap-5 text-xs text-white/35 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                14 dias grátis
              </span>
              <span className="text-white/15">·</span>
              <span>Sem cartão</span>
              <span className="text-white/15">·</span>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
