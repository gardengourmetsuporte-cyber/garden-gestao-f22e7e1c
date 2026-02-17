import logoImg from "@/assets/logo.png";

export function FooterSection() {
  return (
    <footer className="py-12 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Garden" className="h-7 w-7 rounded-lg" />
            <span className="font-bold text-white">Garden</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#beneficios" className="hover:text-white transition-colors">
              Benefícios
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Como funciona
            </a>
            <a href="#diferenciais" className="hover:text-white transition-colors">
              Diferenciais
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Garden Gestão. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
