import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/8 to-card p-12 md:p-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Criado por quem entende sua operação.
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
          </p>
          <Link
            to="/auth?plan=free"
            className="group inline-flex items-center gap-2 h-13 px-8 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 hover:scale-[1.02]"
          >
            Criar minha conta grátis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              14 dias grátis
            </span>
            <span>·</span>
            <span>Sem cartão</span>
            <span>·</span>
            <span>Cancele quando quiser</span>
          </p>
        </div>
      </div>
    </section>
  );
}
