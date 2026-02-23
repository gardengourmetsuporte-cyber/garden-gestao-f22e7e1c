import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

export function FooterSection() {
  return (
    <footer className="py-12 bg-card border-t border-border/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Garden Gourmet" className="h-7 w-7 rounded-lg" />
            <span className="text-sm text-muted-foreground">
              Garden Gourmet — Gestão inteligente para restaurantes
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
            <a href="mailto:contato@gardengourmet.com.br" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground" style={{ borderColor: "hsl(var(--border) / 0.3)" }}>
          © {new Date().getFullYear()} Garden Gourmet
        </div>
      </div>
    </footer>
  );
}
