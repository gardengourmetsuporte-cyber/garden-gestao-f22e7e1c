import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/6 blur-[140px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl border border-border/40 bg-card p-14 md:p-20 overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          {/* Background ambient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-transparent to-transparent pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/12 border border-primary/20 mb-8">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-5 leading-tight">
              Criado por quem entende sua operação.
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
            </p>
            <Link
              to="/auth?plan=free"
              className="group inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base text-white shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(224 45% 12%), hsl(220 70% 20%), hsl(234 75% 30%), hsl(220 65% 22%))',
                backgroundSize: '300% 300%',
                animation: 'navyCardFlow 8s ease-in-out infinite',
                border: '1px solid hsl(234 40% 35% / 0.5)',
              }}
            >
              Criar minha conta grátis
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-muted-foreground mt-7 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                14 dias grátis
              </span>
              <span className="text-border">·</span>
              <span>Sem cartão</span>
              <span className="text-border">·</span>
              <span>Cancele quando quiser</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
