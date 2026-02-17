import { useState } from "react";
import { BarChart3, Package, Users, CheckSquare } from "lucide-react";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    title: "Visão geral em tempo real",
    description: "KPIs, gráficos financeiros, agenda e alertas de estoque — tudo em uma tela.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: BarChart3,
    title: "Controle financeiro completo",
    description: "Contas a pagar/receber, categorias, gráficos e DRE automático.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "estoque",
    label: "Estoque",
    icon: Package,
    title: "Estoque inteligente",
    description: "Movimentações, alertas de mínimo, fichas técnicas e sugestão de compra com IA.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "equipe",
    label: "Equipe",
    icon: Users,
    title: "Gestão de equipe gamificada",
    description: "Escalas, ponto digital, ranking de desempenho e sistema de recompensas.",
    color: "bg-purple-50 text-purple-600",
  },
];

export function ScreenshotsSection() {
  const [active, setActive] = useState("dashboard");
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Conheça os módulos
          </h2>
          <p className="text-lg text-slate-600">
            Tudo que você precisa para gerenciar seu negócio, integrado em um único sistema.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${current.color}`}>
                <current.icon className="w-3.5 h-3.5" />
                {current.label}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">{current.title}</h3>
              <p className="text-slate-600 leading-relaxed">{current.description}</p>
            </div>

            {/* Placeholder for screenshot */}
            <div className="aspect-video bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
              <div className="text-center p-8">
                <current.icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-400">Módulo {current.label}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
