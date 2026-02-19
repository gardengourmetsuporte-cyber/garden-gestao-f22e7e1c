import logoImg from "@/assets/logo.png";

export function FooterSection() {
  return (
    <footer className="py-12 bg-card border-t border-border/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt="Garden" className="h-7 w-7 rounded-lg" />
              <span className="font-bold text-foreground">Garden</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gestão inteligente para pequenos e médios negócios.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Produto</h4>
            <div className="space-y-2">
              <a href="#beneficios" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
              <a href="#como-funciona" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
              <a href="#planos" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
              <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Recursos</h4>
            <div className="space-y-2">
              <a href="#diferenciais" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Diferenciais</a>
              <span className="block text-sm text-muted-foreground">Blog (em breve)</span>
              <span className="block text-sm text-muted-foreground">API (em breve)</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Termos de uso</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Política de privacidade</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">LGPD</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground" style={{ borderColor: "hsl(var(--border) / 0.3)" }}>
          <span>© {new Date().getFullYear()} Garden Gestão. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
