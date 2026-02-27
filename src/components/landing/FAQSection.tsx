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
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-full mb-4">
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
              className="card-surface !rounded-2xl px-6 transition-all duration-300 hover:border-primary/25 data-[state=open]:border-primary/30 data-[state=open]:shadow-elevated"
            >
              <AccordionTrigger className="text-left text-foreground font-semibold text-sm hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
