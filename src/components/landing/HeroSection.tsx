import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Ambient glow backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-accent/6 blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border border-primary/20 bg-primary/10 text-primary animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Feito por restaurante, para restaurantes
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.05] tracking-tight animate-fade-in">
          Pare de perder dinheiro{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            por falta de controle
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in [animation-delay:150ms]">
          Financeiro, estoque, equipe e IA — tudo em um app criado por quem vive a rotina de um restaurante.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:300ms]">
          <Link
            to="/auth?plan=free"
            className="group inline-flex items-center gap-2 h-13 px-8 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 hover:scale-[1.02]"
          >
            Começar grátis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Já tenho conta →
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-in [animation-delay:450ms]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            14 dias grátis
          </span>
          <span>·</span>
          <span>Sem cartão</span>
          <span>·</span>
          <span>Setup em 5min</span>
        </div>
      </div>

      {/* Screenshot with glow effect */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 animate-fade-in [animation-delay:500ms]">
        <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-3xl -z-10 scale-95" />
        <div className="rounded-2xl overflow-hidden border border-primary/20 shadow-elevated bg-card ring-1 ring-primary/10">
          <img
            src={dashboardMockup}
            alt="Dashboard do Garden Gestão"
            className="w-full"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
