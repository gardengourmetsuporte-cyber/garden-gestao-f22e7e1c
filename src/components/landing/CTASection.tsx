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
          Comece agora e descubra como é ter financeiro, estoque, equipe e IA em um único sistema acessível.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-white text-blue-600 font-bold text-lg hover:bg-blue-50 shadow-lg transition-all"
        >
          Comece agora — é grátis
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
