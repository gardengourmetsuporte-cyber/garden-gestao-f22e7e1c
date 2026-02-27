import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-40 md:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 border border-border/60 bg-secondary/50 text-muted-foreground">
          🍔 Feito por restaurante, para restaurantes
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-[1.08] tracking-tight">
          Pare de perder dinheiro{" "}
          <br className="hidden sm:block" />
          por falta de controle
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Financeiro, estoque, equipe e IA — tudo em um app criado por quem vive a rotina de um restaurante.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth?plan=free"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-semibold text-base bg-foreground text-background hover:opacity-90 transition-all"
          >
            Começar grátis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </div>

      {/* Screenshot */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="rounded-2xl overflow-hidden border border-border/40 shadow-xl bg-card">
          <img
            src={dashboardMockup}
            alt="Dashboard do Garden Gestão"
            className="w-full"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
