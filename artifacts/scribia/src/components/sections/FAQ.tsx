import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { COPY } from "@/utils/constants";

const FAQ = () => {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        <Accordion type="single" collapsible className="w-full">
          {COPY.faq.map((item, idx) => (
            <AccordionItem value={`faq-${idx}`} key={idx}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
