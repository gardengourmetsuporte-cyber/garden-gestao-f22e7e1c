import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--neon-cyan) / 0.1), hsl(var(--neon-purple) / 0.08))",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-cyan) / 0.15), transparent 60%)" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Pronto para centralizar sua gestão?
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Comece grátis com Dashboard, Agenda, Checklists e Chat. Faça upgrade quando quiser — sem compromisso.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
              color: "white",
              boxShadow: "0 0 40px hsl(var(--neon-cyan) / 0.3), 0 4px 20px hsl(var(--primary) / 0.3)",
            }}
          >
            Comece grátis agora
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#planos"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl border font-bold text-lg transition-all hover:bg-secondary/50"
            style={{
              borderColor: "hsl(var(--border) / 0.6)",
              color: "hsl(var(--foreground))",
            }}
          >
            Ver planos
          </a>
        </div>
      </div>
    </section>
  );
}
