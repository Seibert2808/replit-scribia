import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "O que é um Livebook?",
    a: "É um resumo inteligente, personalizado por IA, baseado no conteúdo das palestras e no perfil do participante.",
  },
  {
    q: "Quanto tempo leva para gerar?",
    a: "Em média, 3 minutos após o término da palestra.",
  },
  {
    q: "Como os participantes recebem?",
    a: "Via QR Code, email, ou acesso direto na plataforma web/mobile.",
  },
  {
    q: "Há suporte para patrocinadores?",
    a: "Sim, existem recursos exclusivos para gerar leads qualificados e relatórios de engajamento.",
  },
];

const FAQSectionNew = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Perguntas Frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="max-w-2xl mx-auto">
          {faqs.map((f, idx) => (
            <AccordionItem key={idx} value={`faq_${idx}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSectionNew;