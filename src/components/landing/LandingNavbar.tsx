import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${scrolled
          ? "bg-[#050505]/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/landing" className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
            <img src={logoImg} alt="Garden" className="w-6 h-6 sm:w-7 sm:h-7 object-contain brightness-0 invert" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">
            Garden
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/auth"
            className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/auth?plan=free"
            className="group relative inline-flex items-center justify-center h-10 px-6 rounded-full text-sm font-bold bg-white text-black overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{ boxShadow: '0 0 20px hsl(0 0% 100% / 0.1)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            Começar grátis
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[400px] border-b border-white/10 shadow-2xl" : "max-h-0"
          }`}
      >
        <div className="bg-[#0a0a0a]/95 backdrop-blur-3xl px-4 pt-2 pb-6 space-y-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 px-4 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Entrar na conta
            </Link>
            <Link
              to="/auth?plan=free"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3.5 rounded-xl text-base font-bold bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-transform"
            >
              Começar grátis agora
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
