import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O Garden funciona no navegador e no celular como um app (PWA). Basta acessar e adicionar à tela inicial." },
  { q: "Quantos usuários posso ter?", a: "Pro: até 15 usuários. Business: ilimitado. Cada membro da equipe tem seu login e permissões." },
  { q: "Tem suporte se eu precisar de ajuda?", a: "Sim! Oferecemos suporte por WhatsApp e email. No plano Business, o atendimento é prioritário com tempo de resposta reduzido." },
  { q: "Meus dados ficam seguros?", a: "Sim. Infraestrutura em nuvem com criptografia e backup diário automático. Seus dados são 100% seus." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade. Cancele a qualquer momento sem taxas. Seus dados permanecem acessíveis por 30 dias após o cancelamento." },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
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
              className="rounded-2xl border border-border/40 bg-card px-6 transition-shadow"
            >
              <AccordionTrigger className="text-left text-foreground font-medium text-sm hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
