import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import screenshotFinanceiro from "@/assets/screenshot-financeiro.png";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-green) / 0.12), transparent 60%)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-cyan) / 0.1), transparent 60%)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 animate-pulse"
              style={{
                background: "hsl(var(--neon-green) / 0.1)",
                border: "1px solid hsl(var(--neon-green) / 0.25)",
                color: "hsl(var(--neon-green))",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              🍔 Feito por restaurante, para restaurantes
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight">
              Pare de perder dinheiro{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))",
                }}
              >
                por falta de controle
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Criado por quem vive a rotina de um restaurante.
              <br />
              Financeiro, estoque, equipe e IA — tudo em um app.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/auth?plan=free"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "0 0 30px hsl(var(--neon-green) / 0.3), 0 4px 20px hsl(var(--neon-cyan) / 0.3)",
                }}
              >
                Começar grátis agora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-border/60 text-muted-foreground font-semibold text-base hover:bg-secondary/50 transition-colors"
              >
                Ver como funciona
              </a>
            </div>
          </div>

          {/* Right — phone mockup with real screenshot */}
          <div className="relative flex justify-center">
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(var(--neon-green) / 0.15), transparent 70%)" }}
            />
            <div
              className="relative w-[280px] sm:w-[300px] rounded-[2.5rem] overflow-hidden p-2"
              style={{
                background: "linear-gradient(145deg, hsl(var(--border) / 0.6), hsl(var(--border) / 0.2))",
                boxShadow: "0 0 40px hsl(var(--neon-green) / 0.15), 0 25px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div className="rounded-[2rem] overflow-hidden bg-background">
                <img
                  src={screenshotFinanceiro}
                  alt="Tela financeira do Garden Gestão"
                  className="w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
