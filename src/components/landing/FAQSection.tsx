import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Posso testar grátis?",
    a: "Sim! O plano Grátis é permanente e inclui Dashboard, Agenda, 1 Checklist e Chat interno. Você pode usar o tempo que quiser sem precisar de cartão de crédito.",
  },
  {
    q: "Como funciona o plano grátis?",
    a: "O plano grátis dá acesso aos módulos essenciais para até 3 usuários. Quando seu negócio crescer, basta fazer upgrade para o Pro ou Business.",
  },
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. Você cria sua conta e começa a usar o plano Grátis imediatamente, sem nenhuma cobrança.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Claro! Você pode fazer upgrade ou downgrade a qualquer momento. A mudança é instantânea e proporcional ao período restante.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Utilizamos criptografia de ponta a ponta, backups automáticos diários e infraestrutura em nuvem com certificação ISO 27001. Seus dados são 100% seus.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim! O Garden é um PWA (Progressive Web App) que funciona perfeitamente no navegador do celular, como se fosse um app nativo. Basta adicionar à tela inicial.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-lg text-slate-600">
            Tire suas dúvidas antes de começar.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-slate-200 rounded-xl px-6 data-[state=open]:shadow-sm transition-shadow"
            >
              <AccordionTrigger className="text-left text-slate-900 font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
