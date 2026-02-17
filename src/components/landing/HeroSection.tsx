import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Users, CheckSquare, Brain } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 bg-white overflow-hidden">
      {/* subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/40 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
            <Brain className="w-3.5 h-3.5" />
            Gestão inteligente com IA
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Toda a gestão do seu negócio{" "}
            <span className="text-blue-600">em um só lugar</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Financeiro, estoque, equipe, checklists e IA — tudo integrado para
            pequenos e médios empresários que precisam de controle sem
            complexidade.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30"
            >
              Comece agora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-slate-200 text-slate-700 font-semibold text-base hover:bg-slate-50 transition-colors"
            >
              Saiba mais
            </a>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: BarChart3, label: "Financeiro" },
            { icon: Users, label: "Equipe" },
            { icon: CheckSquare, label: "Checklists" },
            { icon: Brain, label: "IA Copiloto" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm text-slate-700 font-medium"
            >
              <Icon className="w-4 h-4 text-blue-600" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
