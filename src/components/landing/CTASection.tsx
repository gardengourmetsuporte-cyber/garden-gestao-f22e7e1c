import { Link } from "react-router-dom";
import { AppIcon } from "@/components/ui/app-icon";
import logoImg from "@/assets/logo.png";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-[2.5rem] overflow-hidden p-10 sm:p-14 md:p-20 text-center border border-border"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--background)) 50%, hsl(var(--card)) 100%)',
            boxShadow: '0 20px 80px -20px hsl(var(--primary) / 0.15), inset 0 1px 1px hsl(var(--foreground) / 0.05)'
          }}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.15] mix-blend-screen pointer-events-none" style={{ background: 'hsl(var(--primary))', animation: 'float-orb-1 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[20%] right-[20%] w-[250px] h-[250px] rounded-full blur-[80px] opacity-[0.1] mix-blend-screen pointer-events-none" style={{ background: 'hsl(var(--primary) / 0.6)', animation: 'float-orb-2 10s ease-in-out infinite' }} />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-8 shadow-lg" style={{ boxShadow: '0 0 60px hsl(var(--primary) / 0.2)' }}>
              <img src={logoImg} alt="Garden" className="w-11 h-11 object-contain" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight font-display">
              Criado por quem entende<br className="hidden sm:block" /> sua operação.
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Nasceu dentro de uma hamburgueria de verdade. Comece hoje, veja resultado essa semana.
            </p>

            <Link
              to="/auth?plan=free"
              className="group inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base bg-foreground text-background shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              Criar minha conta grátis
              <AppIcon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="mt-7 flex items-center justify-center gap-4 sm:gap-5 text-xs text-muted-foreground/60 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                14 dias grátis
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span>Sem cartão</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
