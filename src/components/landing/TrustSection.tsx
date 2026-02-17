import { Shield, Lock, Scale } from "lucide-react";

const items = [
  { icon: Shield, title: "Segurança de dados", desc: "Seus dados são criptografados e armazenados com segurança em nuvem." },
  { icon: Lock, title: "Conformidade LGPD", desc: "Respeitamos a Lei Geral de Proteção de Dados. Seus dados, seu controle." },
  { icon: Scale, title: "Profissionalismo", desc: "Sistema construído com padrões de engenharia de software modernos." },
];

export function TrustSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-green))" }}>
            Confiança
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Seus dados estão seguros
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((i) => (
            <div key={i.title} className="text-center card-surface p-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5"
                style={{
                  background: "hsl(var(--neon-green) / 0.1)",
                  border: "1px solid hsl(var(--neon-green) / 0.2)",
                  color: "hsl(var(--neon-green))",
                }}
              >
                <i.icon className="w-6 h-6" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{i.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
