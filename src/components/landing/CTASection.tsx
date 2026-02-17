import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-blue-600">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Pronto para centralizar sua gestão?
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
          Comece grátis com Dashboard, Agenda, Checklists e Chat. Faça upgrade quando quiser — sem compromisso.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-white text-blue-600 font-bold text-lg hover:bg-blue-50 shadow-lg transition-all"
          >
            Comece grátis agora
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#planos"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all"
          >
            Ver planos
          </a>
        </div>
      </div>
    </section>
  );
}
