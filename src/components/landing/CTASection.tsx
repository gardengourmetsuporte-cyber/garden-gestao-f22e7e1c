import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="finance-hero-card p-14 md:p-20">
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 border border-white/20 mb-8">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
              Criado por quem entende sua operação.
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
            </p>
            <Link
              to="/auth?plan=free"
              className="group inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base bg-white text-[hsl(220,30%,15%)] shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-2xl"
            >
              Criar minha conta grátis
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-white/50 mt-7 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                14 dias grátis
              </span>
              <span className="text-white/25">·</span>
              <span>Sem cartão</span>
              <span className="text-white/25">·</span>
              <span>Cancele quando quiser</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
