import { useState } from "react";
import { BarChart3, Package, Users, CheckSquare } from "lucide-react";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    title: "Visão geral em tempo real",
    description: "KPIs, gráficos financeiros, agenda e alertas de estoque — tudo em uma tela.",
    image: "/debug/IMG_2687.png",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: BarChart3,
    title: "Controle financeiro completo",
    description: "Contas a pagar/receber, categorias, gráficos e DRE automático.",
    image: "/debug/IMG_2688.png",
  },
  {
    id: "estoque",
    label: "Estoque",
    icon: Package,
    title: "Estoque inteligente",
    description: "Movimentações, alertas de mínimo, fichas técnicas e sugestão de compra com IA.",
    image: "/debug/IMG_2687.png",
  },
  {
    id: "equipe",
    label: "Equipe",
    icon: Users,
    title: "Gestão de equipe gamificada",
    description: "Escalas, ponto digital, ranking de desempenho e sistema de recompensas.",
    image: "/debug/IMG_2688.png",
  },
];

export function ScreenshotsSection() {
  const [active, setActive] = useState("dashboard");
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Módulos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Conheça os módulos
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo que você precisa para gerenciar seu negócio, integrado em um único sistema.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                style={isActive ? {
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                  color: "white",
                  boxShadow: "0 0 20px hsl(var(--neon-cyan) / 0.3)",
                } : {
                  background: "hsl(var(--secondary))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="card-surface p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{
                  background: "hsl(var(--neon-cyan) / 0.1)",
                  border: "1px solid hsl(var(--neon-cyan) / 0.2)",
                  color: "hsl(var(--neon-cyan))",
                }}
              >
                <current.icon className="w-3.5 h-3.5" />
                {current.label}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">{current.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{current.description}</p>
            </div>

            {/* Screenshot with neon frame */}
            <div
              className="aspect-video rounded-xl overflow-hidden"
              style={{
                border: "1px solid hsl(var(--neon-cyan) / 0.25)",
                boxShadow: "0 0 30px hsl(var(--neon-cyan) / 0.1), var(--shadow-card)",
              }}
            >
              <img
                src={current.image}
                alt={`Módulo ${current.label}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
