import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

export function FooterSection() {
  return (
    <footer className="py-12 border-t border-border/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Garden Gestão" className="h-8 w-8 rounded-full object-contain" />
            <span className="text-sm font-semibold text-foreground">
              Garden Gestão
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
            <a href="mailto:contato@gardengestao.com.br" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Garden Gestão · Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
