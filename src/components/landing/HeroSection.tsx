import { Link } from "react-router-dom";
import { ArrowRight, Brain, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import { useCountUp } from "@/hooks/useCountUp";

function StatCounter({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) {
  const value = useCountUp(target, 1200);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
        {value}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-cyan) / 0.12), transparent 60%)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-purple) / 0.1), transparent 60%)" }}
        />
        <div
          className="absolute top-[30%] left-[50%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 60%)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 animate-pulse"
              style={{
                background: "hsl(var(--neon-cyan) / 0.1)",
                border: "1px solid hsl(var(--neon-cyan) / 0.25)",
                color: "hsl(var(--neon-cyan))",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA integrada em todos os módulos
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight">
              Toda a gestão do seu negócio{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                }}
              >
                em um só lugar
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Financeiro, estoque, equipe, checklists e IA — tudo integrado para
              pequenos e médios empresários que precisam de controle sem
              complexidade.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "0 0 30px hsl(var(--neon-cyan) / 0.3), 0 4px 20px hsl(var(--primary) / 0.3)",
                }}
              >
                Comece grátis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#planos"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-border/60 text-muted-foreground font-semibold text-base hover:bg-secondary/50 transition-colors"
              >
                Ver planos
              </a>
            </div>

            {/* Counters */}
            <div className="mt-10 flex items-center gap-8 border-t border-border/40 pt-8">
              <StatCounter target={500} label="Empresas" suffix="+" />
              <StatCounter target={10} label="Módulos" suffix="+" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Brain className="w-5 h-5" style={{ color: "hsl(var(--neon-cyan))" }} />
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">IA</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Inclusa</div>
              </div>
            </div>
          </div>

          {/* Right — mockup with neon frame */}
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(var(--neon-cyan) / 0.15), transparent 70%)" }}
            />
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                border: "1px solid hsl(var(--neon-cyan) / 0.25)",
                boxShadow: "0 0 40px hsl(var(--neon-cyan) / 0.15), var(--shadow-elevated)",
              }}
            >
              <img
                src={dashboardMockup}
                alt="Dashboard do Garden Gestão"
                className="w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
