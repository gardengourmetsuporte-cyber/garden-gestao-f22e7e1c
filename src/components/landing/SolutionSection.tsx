import { Check } from "lucide-react";

const blocks = [
  {
    title: "Saiba exatamente quanto você lucrou",
    text: "Receitas, despesas, lucro líquido e pendências em tempo real. Veja para onde vai cada real do seu restaurante, com gráficos por categoria.",
    tag: "Fechamento de caixa integrado",
    image: "/lovable-uploads/ca447a51-f07f-4e35-bd89-a1efb7fbcd9c.png",
    alt: "Tela financeira com saldo e gráficos",
  },
  {
    title: "Abertura e fechamento sem esquecimentos",
    text: "Checklists digitais para sua equipe. Cada setor, cada tarefa, com progresso em tempo real. Você vê tudo pelo celular, de onde estiver.",
    tag: "Cozinha, salão, limpeza — tudo monitorado",
    image: "/lovable-uploads/dc8e43da-017d-406f-9b66-d1984478c7e6.jpg",
    alt: "Checklist com progresso de abertura e fechamento",
  },
  {
    title: "Nunca mais falte ingrediente",
    text: "Alertas automáticos de estoque baixo. Movimentações rastreadas. Saiba o que comprar antes que acabe.",
    tag: "Alerta de estoque mínimo automático",
    image: "/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg",
    alt: "Tela de estoque com alertas",
  },
  {
    title: "Entenda seus custos sem ser contador",
    text: "Matéria-prima, folha de pagamento, despesas administrativas — tudo categorizado automaticamente. Resumo semanal com total de vendas em cada canal.",
    tag: "iFood, delivery e cartão separados",
    image: "/lovable-uploads/f33aaa21-284f-4287-9fbe-9f15768b7d65.jpg",
    alt: "Gráfico de despesas por categoria e resumo semanal",
  },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Um sistema feito para a realidade do seu restaurante
          </h2>
        </div>

        <div className="space-y-20">
          {blocks.map((b, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={b.title}
                className={`grid md:grid-cols-2 gap-10 items-center ${reversed ? "md:[direction:rtl]" : ""}`}
              >
                {/* Image */}
                <div className="md:[direction:ltr]">
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      border: "1px solid hsl(var(--border) / 0.4)",
                      boxShadow: "0 0 30px hsl(var(--neon-green) / 0.1), var(--shadow-elevated)",
                    }}
                  >
                    <img
                      src={b.image}
                      alt={b.alt}
                      className="w-full"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="md:[direction:ltr]">
                  <h3 className="text-2xl font-bold text-foreground mb-4">{b.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-5">{b.text}</p>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: "hsl(var(--neon-green) / 0.1)",
                      border: "1px solid hsl(var(--neon-green) / 0.25)",
                      color: "hsl(var(--neon-green))",
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {b.tag}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
