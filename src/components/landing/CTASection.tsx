import { Link } from "react-router-dom";
import { ArrowRight, Shield } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="landing-card-highlight p-10 md:p-14 text-center relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Criado por quem entende sua operação.
          </h2>
          <p className="opacity-60 text-lg mb-10 max-w-xl mx-auto">
            Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
          </p>
          <Link
            to="/auth?plan=free"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "var(--gradient-brand)",
              color: "white",
              boxShadow: "0 4px 20px hsl(220 45% 18% / 0.4)",
            }}
          >
            Criar minha conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-1.5 text-sm opacity-50 mt-5">
            <Shield className="w-3.5 h-3.5" />
            <span>14 dias grátis • Sem cartão • Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>
  );
}
