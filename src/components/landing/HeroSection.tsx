import { Link } from "react-router-dom";
import { ArrowRight, Brain, Building2, Layers, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import { useCountUp } from "@/hooks/useCountUp";

function StatCounter({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) {
  const value = useCountUp(target, 1200);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
        {value}{suffix}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/40 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              IA integrada em todos os módulos
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Toda a gestão do seu negócio{" "}
              <span className="text-blue-600">em um só lugar</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Financeiro, estoque, equipe, checklists e IA — tudo integrado para
              pequenos e médios empresários que precisam de controle sem
              complexidade.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30"
              >
                Comece grátis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#planos"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-slate-200 text-slate-700 font-semibold text-base hover:bg-slate-50 transition-colors"
              >
                Ver planos
              </a>
            </div>

            {/* Counters */}
            <div className="mt-10 flex items-center gap-8 border-t border-slate-100 pt-8">
              <StatCounter target={500} label="Empresas" suffix="+" />
              <StatCounter target={10} label="Módulos" suffix="+" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">IA</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Inclusa</div>
              </div>
            </div>
          </div>

          {/* Right — mockup */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100/40 to-slate-100/40 rounded-3xl blur-2xl" />
            <img
              src={dashboardMockup}
              alt="Dashboard do Garden Gestão exibido em um laptop"
              className="relative w-full rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
