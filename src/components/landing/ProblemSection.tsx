import { FileSpreadsheet, Unplug, UserX } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planilhas espalhadas",
    desc: "Sem visão real do negócio. Dados em lugares diferentes, decisões no escuro.",
  },
  {
    icon: Unplug,
    title: "Sistemas que não conversam",
    desc: "Pagar por 5 ferramentas diferentes que não se integram é caro e ineficiente.",
  },
  {
    icon: UserX,
    title: "Equipe desengajada",
    desc: "Sem acompanhamento, sem feedback, sem motivação. O time trabalha, mas ninguém vê.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
            O problema
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Gestão fragmentada custa caro
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl border border-slate-200 p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-red-50 text-red-500 mb-5">
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {p.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
