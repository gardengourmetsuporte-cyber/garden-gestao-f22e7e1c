import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O Garden funciona no navegador e no celular como um app (PWA). Basta acessar e adicionar à tela inicial." },
  { q: "Quantos usuários posso ter?", a: "Pro: até 15 usuários. Business: ilimitado. Cada membro da equipe tem seu login e permissões." },
  { q: "Funciona com iFood e delivery?", a: "Sim! O módulo financeiro separa automaticamente os canais de venda — iFood, delivery, cartão, Pix, dinheiro." },
  { q: "Meus dados ficam seguros?", a: "Sim. Infraestrutura em nuvem com criptografia e backup diário automático. Seus dados são 100% seus." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade. Cancele a qualquer momento sem taxas. Seus dados permanecem acessíveis por 30 dias após o cancelamento." },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--neon-cyan))" }}>
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Perguntas frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl px-6 transition-shadow"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
