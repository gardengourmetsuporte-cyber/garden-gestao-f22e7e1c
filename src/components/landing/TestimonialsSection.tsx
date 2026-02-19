import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Carolina",
    role: "Dona de restaurante",
    text: "Antes eu usava 4 sistemas diferentes. Com o Bosst, centralizei tudo e economizo mais de R$ 400/mês em assinaturas.",
    avatar: "AC",
  },
  {
    name: "Rafael Mendes",
    role: "Gerente de cafeteria",
    text: "A gamificação mudou a cultura da equipe. O pessoal ficou mais engajado e a produtividade subiu 30% no primeiro mês.",
    avatar: "RM",
  },
  {
    name: "Juliana Santos",
    role: "Proprietária de padaria",
    text: "O copiloto de IA me ajudou a identificar desperdícios que eu nem sabia que existiam. Reduzi custos em 15%.",
    avatar: "JS",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Depoimentos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Quem usa, recomenda
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card-surface p-7">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: "hsl(var(--neon-amber))" }} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                    color: "white",
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
