import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      {/* Ambient glow backgrounds */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-60 -right-20 w-[300px] h-[300px] rounded-full bg-accent/8 blur-[80px] pointer-events-none" />
      <div className="absolute top-40 -left-20 w-[250px] h-[250px] rounded-full bg-success/6 blur-[80px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border border-primary/25 bg-primary/10 text-primary shadow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Feito por restaurante, para restaurantes
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold text-foreground leading-[1.06] tracking-tight animate-fade-in">
          Pare de perder dinheiro{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient-flow_6s_ease_infinite] bg-clip-text text-transparent">
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
            className="group relative inline-flex items-center gap-2 h-13 px-8 rounded-xl font-semibold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Começar grátis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/auth"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Já tenho conta →
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground animate-fade-in [animation-delay:450ms]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            14 dias grátis
          </span>
          <span className="text-border">·</span>
          <span>Sem cartão</span>
          <span className="text-border">·</span>
          <span>Setup em 5min</span>
        </div>
      </div>

      {/* Screenshot with premium frame */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 animate-fade-in [animation-delay:500ms]">
        {/* Glow behind screenshot */}
        <div className="absolute inset-4 bg-gradient-to-b from-primary/15 via-primary/8 to-transparent blur-[50px] rounded-3xl -z-10" />
        <div className="rounded-2xl overflow-hidden border border-border/60 shadow-elevated bg-card">
          {/* Browser chrome bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border-b border-border/40">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </div>
            <div className="flex-1 mx-8">
              <div className="h-5 rounded-md bg-secondary/80 max-w-xs mx-auto flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/60 font-medium">app.gardengestao.com.br</span>
              </div>
            </div>
          </div>
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
