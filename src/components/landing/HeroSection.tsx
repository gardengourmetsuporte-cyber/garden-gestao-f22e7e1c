import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Ambient glow backgrounds */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/8 blur-[160px] pointer-events-none" />
      <div className="absolute top-60 -right-20 w-[350px] h-[350px] rounded-full bg-accent/6 blur-[100px] pointer-events-none" />
      <div className="absolute top-40 -left-20 w-[300px] h-[300px] rounded-full bg-success/4 blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border border-primary/20 bg-primary/8 text-primary animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Feito por restaurante, para restaurantes
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold text-foreground leading-[1.05] tracking-tight animate-fade-in">
          Pare de perder dinheiro{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient-flow_6s_ease_infinite] bg-clip-text text-transparent">
            por falta de controle
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-7 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in [animation-delay:150ms]">
          Financeiro, estoque, equipe e IA — tudo em um app criado por quem vive a rotina de um restaurante.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:300ms]">
          <Link
            to="/auth?plan=free"
            className="group relative inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base text-white shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(224 45% 12%), hsl(220 70% 20%), hsl(234 75% 30%), hsl(220 65% 22%))',
              backgroundSize: '300% 300%',
              animation: 'navyCardFlow 8s ease-in-out infinite',
              border: '1px solid hsl(234 40% 35% / 0.5)',
            }}
          >
            Começar grátis
            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
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
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            14 dias grátis
          </span>
          <span className="text-border">·</span>
          <span>Sem cartão</span>
          <span className="text-border">·</span>
          <span>Setup em 5min</span>
        </div>
      </div>

      {/* Screenshot with premium laptop frame */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 animate-fade-in [animation-delay:500ms]">
        {/* Glow behind screenshot */}
        <div className="absolute inset-6 bg-gradient-to-b from-primary/12 via-primary/6 to-transparent blur-[60px] rounded-3xl -z-10" />
        
        <div className="rounded-2xl overflow-hidden border border-border/50 shadow-elevated bg-card/80 backdrop-blur-sm">
          {/* Browser chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-secondary/60 border-b border-border/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-warning/50" />
              <div className="w-3 h-3 rounded-full bg-success/50" />
            </div>
            <div className="flex-1 mx-10">
              <div className="h-6 rounded-lg bg-secondary/80 max-w-sm mx-auto flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground/50 font-medium tracking-wide">app.gardengestao.com.br</span>
              </div>
            </div>
          </div>
          <img
            src={dashboardMockup}
            alt="Dashboard do Garden Gestão — visão geral do sistema"
            className="w-full"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
