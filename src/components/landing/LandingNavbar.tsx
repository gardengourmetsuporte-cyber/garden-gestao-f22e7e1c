import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import logoImg from "@/assets/logo.png";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Funcionalidades", href: "#como-funciona" },
    { label: "Planos", href: "#planos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        scrolled
          ? "bg-background/95 backdrop-blur-2xl border-b border-border/30 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm">
            <img src={logoImg} alt="Garden" className="w-7 h-7 object-contain" />
          </div>
          <span className={`font-display font-bold text-base transition-colors duration-300 ${scrolled ? "text-foreground" : "text-white"}`}>
            Garden
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className={scrolled ? "" : "text-white/70 hover:text-white hover:bg-white/10"} />
          <Link
            to="/auth"
            className={`hidden sm:inline-flex text-sm font-medium transition-colors ${
              scrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/60 hover:text-white"
            }`}
          >
            Entrar
          </Link>
          <Link
            to="/auth?plan=free"
            className={`hidden sm:inline-flex items-center justify-center h-9 px-5 rounded-xl text-sm font-bold transition-all duration-200 ${
              scrolled
                ? "gradient-primary text-primary-foreground shadow-md"
                : "bg-white text-[hsl(220,30%,15%)] hover:bg-white/90 shadow-lg"
            }`}
          >
            Começar grátis
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 transition-colors ${
              scrolled ? "text-muted-foreground" : "text-white/70"
            }`}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-2xl border-t border-border/30 px-4 pb-6 pt-2 space-y-1 animate-fade-in">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/auth" onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground">Entrar</Link>
          <Link to="/auth?plan=free" onClick={() => setOpen(false)} className="block w-full text-center py-3 mt-2 rounded-xl text-sm font-bold gradient-primary text-primary-foreground">
            Começar grátis
          </Link>
        </div>
      )}
    </nav>
  );
}
