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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/40"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Garden Gestão" className="h-10 w-10 rounded-full object-contain" />
          <span className="font-bold text-lg text-foreground">Garden</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center justify-center h-9 px-5 rounded-xl text-sm font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            Entrar
          </Link>
          <Link
            to="/auth?plan=free"
            className="hidden sm:inline-flex items-center justify-center h-9 px-5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--gradient-brand)",
              color: "white",
              boxShadow: "0 4px 16px hsl(220 45% 18% / 0.3)",
            }}
          >
            Teste grátis
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40 px-4 pb-6 pt-2 space-y-1 animate-fade-in">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="block w-full text-center py-3 mt-2 rounded-xl text-sm font-semibold border border-border/60 text-muted-foreground"
          >
            Entrar
          </Link>
          <Link
            to="/auth?plan=free"
            onClick={() => setOpen(false)}
            className="block w-full text-center py-3 mt-1 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--gradient-brand)",
              color: "white",
              boxShadow: "0 4px 16px hsl(220 45% 18% / 0.3)",
            }}
          >
            Teste grátis
          </Link>
        </div>
      )}
    </nav>
  );
}
