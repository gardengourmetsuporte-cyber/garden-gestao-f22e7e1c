import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Criado por quem entende sua operação.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
        </p>
        <Link
          to="/auth?plan=free"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-semibold text-base bg-foreground text-background hover:opacity-90 transition-all"
        >
          Criar minha conta grátis
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-sm text-muted-foreground mt-5">
          14 dias grátis · Sem cartão · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
