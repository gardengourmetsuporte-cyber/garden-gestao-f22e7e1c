import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, hsl(160 84% 12% / 0.6), hsl(172 66% 10% / 0.4), hsl(var(--background)))",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-green) / 0.15), transparent 60%)" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Seu restaurante merece gestão profissional.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Comece hoje, veja resultado essa semana.
        </p>
        <Link
          to="/auth?plan=free"
          className="inline-flex items-center gap-2 h-14 px-10 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))",
            color: "white",
            boxShadow: "0 0 40px hsl(var(--neon-green) / 0.3), 0 4px 20px hsl(var(--neon-cyan) / 0.3)",
          }}
        >
          Criar minha conta grátis
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-muted-foreground mt-5">
          14 dias grátis • Sem cartão • Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
