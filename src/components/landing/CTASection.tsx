import { Link } from "react-router-dom";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl border border-primary/20 bg-card p-12 md:p-16 overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 mb-6">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Criado por quem entende sua operação.
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
            </p>
            <Link
              to="/auth?plan=free"
              className="group inline-flex items-center gap-2 h-13 px-8 rounded-xl font-semibold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              Criar minha conta grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
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
