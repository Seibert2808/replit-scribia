import { GRADIENTE_MARCA } from "@/utils/paleta";
import { Bot, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const BiaSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <Card className="p-6 max-w-md mx-auto border-2 border-primary/20">
              <div className="flex items-center gap-3 pb-4 border-b mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-bold text-primary">BIA - a Scriba Digital</h4>
                  <small className="text-muted-foreground">Sua assistente de IA para eventos</small>
                </div>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto">
                <div className="flex gap-2">
                  <div className="bg-secondary/30 p-3 rounded-2xl max-w-[80%]">
                    <p className="text-sm">
                      Olá! Acabei de ler o Livebook sobre Transformação Digital. Como posso te ajudar?
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-2xl max-w-[80%]">
                    <p className="text-sm">Quais foram os principais KPIs mencionados?</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="bg-secondary/30 p-3 rounded-2xl max-w-[80%]">
                    <p className="text-sm">
                      Ótima pergunta! O palestrante destacou 4 KPIs essenciais:
                      <br />
                      1) Taxa de conversão digital
                      <br />
                      2) NPS digital
                      <br />
                      3) Tempo médio de resposta
                      <br />
                      4) ROI de automação
                      <br />
                      <br />
                      Quer que eu detalhe algum deles?
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <MessageCircle className="h-4 w-4" /> Tutor IA
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 bg-clip-text text-transparent" style={{ backgroundImage: GRADIENTE_MARCA }}>
              Conheça a BIA: a assistente de IA do ScribIA
            </h2>
            <h3 className="text-xl font-bold mb-4 text-primary">Aprendizado Contínuo e Personalizado</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A BIA é uma assistente inteligente que acompanha você após o evento. Ela conhece todo o conteúdo dos
              Livebooks e está pronta para:
            </p>
            <ul className="space-y-3">
              {[
                "Responder dúvidas sobre as palestras",
                "Aprofundar tópicos de seu interesse",
                "Conectar você com palestrantes e patrocinadores relevantes",
                "Sugerir conteúdos complementares",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BiaSection;