import { Shield, Lock, Scale } from "lucide-react";

const items = [
  {
    icon: Shield,
    title: "Segurança de dados",
    desc: "Seus dados são criptografados e armazenados com segurança em nuvem.",
  },
  {
    icon: Lock,
    title: "Conformidade LGPD",
    desc: "Respeitamos a Lei Geral de Proteção de Dados. Seus dados, seu controle.",
  },
  {
    icon: Scale,
    title: "Profissionalismo",
    desc: "Sistema construído com padrões de engenharia de software modernos.",
  },
];

export function TrustSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
            Confiança
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Seus dados estão seguros
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((i) => (
            <div
              key={i.title}
              className="text-center p-8 rounded-2xl bg-slate-50 border border-slate-100"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-green-50 text-green-600 mb-5">
                <i.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {i.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
