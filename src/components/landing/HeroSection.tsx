import { Link } from "react-router-dom";
import { AppIcon } from "@/components/ui/app-icon";
import { AnimatedMockup } from "./AnimatedMockup";

const features = [
  { icon: "BarChart3", label: "Financeiro" },
  { icon: "Package", label: "Estoque" },
  { icon: "Users", label: "Equipe" },
  { icon: "ListChecks", label: "Checklists" },
  { icon: "Bot", label: "Copilot IA" },
  { icon: "ShoppingCart", label: "Pedidos" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background — matches dashboard context bar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 100% 0%, hsl(var(--primary) / 0.7) 0%, transparent 60%),
            radial-gradient(ellipse 80% 100% at 0% 100%, hsl(var(--primary) / 0.35) 0%, transparent 60%),
            linear-gradient(165deg, hsl(var(--primary) / 0.28) 0%, hsl(var(--primary) / 0.12) 50%, hsl(var(--background)) 100%)
          `,
        }}
      />
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 md:pt-48 pb-24 md:pb-32">
        <div className="flex flex-col items-center text-center space-y-8 animate-[fade-up_0.8s_ease-out_both] max-w-4xl mx-auto">

          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md border border-border bg-secondary/50 shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-colors cursor-default">
            <AppIcon name="Sparkles" size={14} className="text-primary" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              A nova era da gestão para restaurantes
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground font-display leading-[1.1]">
            O sistema perfeito para <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50">
              o seu restaurante crescer.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed font-medium">
            Tudo em um só lugar. Esqueça planilhas confusas e sistemas lentos. Experimente o SaaS mais inteligente, rápido e bonito do mercado, construído por quem vive o food service.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Link
              to="/auth?plan=free"
              className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-bold text-base bg-foreground text-background overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: '0 0 40px hsl(var(--foreground) / 0.15)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Começar grátis agora
              <AppIcon name="ArrowRight" size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full text-base font-semibold text-muted-foreground hover:text-foreground backdrop-blur-md border border-border hover:border-border/60 bg-secondary/30 hover:bg-secondary/50 transition-all duration-300"
            >
              Já tenho uma conta
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center flex-wrap gap-2 md:gap-4 text-xs text-muted-foreground pt-2 font-medium">
            <span className="flex items-center gap-1.5"><AppIcon name="Check" size={14} className="text-primary" /> Sem cartão de crédito</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 hidden md:block" />
            <span className="flex items-center gap-1.5"><AppIcon name="Check" size={14} className="text-primary" /> Setup em 5 minutos</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 hidden md:block" />
            <span className="flex items-center gap-1.5"><AppIcon name="Check" size={14} className="text-primary" /> Cancele quando quiser</span>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3 animate-[fade-up_0.8s_ease-out_0.2s_both] max-w-4xl mx-auto">
          {features.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-[1.05] hover:bg-secondary/80 cursor-default bg-secondary/40 text-foreground/80 border border-border/50 backdrop-blur-xl"
            >
              <AppIcon name={icon} size={16} className="text-muted-foreground" />
              {label}
            </div>
          ))}
        </div>

        {/* 3D Dashboard Mockup Presentation */}
        <div className="relative mt-20 sm:mt-24 w-full max-w-5xl mx-auto animate-[fade-up_1s_ease-out_0.4s_both] group">
          <div
            className="relative transition-transform duration-700 ease-out hover:scale-[1.02]"
            style={{ transform: "perspective(1200px) rotateX(4deg)", transformStyle: "preserve-3d" }}
          >
            <div className="absolute -inset-10 rounded-[3rem] blur-[80px] bg-gradient-to-b from-primary/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
            <div className="relative rounded-2xl sm:rounded-[32px] overflow-hidden border border-border bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2 px-4 py-3 sm:py-4 border-b border-border bg-card">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56] border border-border/30" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E] border border-border/30" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F] border border-border/30" />
                </div>
                <div className="flex-1 mx-4 sm:mx-8">
                  <div className="h-6 sm:h-8 rounded-md max-w-[280px] mx-auto flex items-center justify-center bg-secondary/50 border border-border/30">
                    <AppIcon name="Lock" size={12} className="text-muted-foreground mr-1.5" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide">app.gardengestao.com.br</span>
                  </div>
                </div>
              </div>
              <AnimatedMockup />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
