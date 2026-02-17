import { Layers, Sparkles, Smartphone, Brain } from "lucide-react";

const pillars = [
  { icon: Layers, label: "Centralizador", desc: "Tudo num único sistema" },
  { icon: Brain, label: "Inteligente", desc: "IA que ajuda a decidir" },
  { icon: Smartphone, label: "Simples", desc: "Mobile-first, fácil de usar" },
  { icon: Sparkles, label: "Assistido por IA", desc: "Copiloto para o dia a dia" },
];

export function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
            A solução
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Um sistema que substitui vários
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            O Garden centraliza financeiro, estoque, equipe, checklists e marketing — com inteligência artificial integrada.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div
              key={p.label}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-blue-50/50 border border-blue-100"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{p.label}</h3>
              <p className="text-sm text-slate-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
