import { Upload, Brain, BookOpen, Share2, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HowItWorksNew = () => {
  const handleScrollToPlans = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const steps = [
    {
      number: 1,
      icon: Upload,
      title: "Captura",
      description:
        "Áudios gravados em software próprio, que envia os dados à plataforma de Inteligência Artificial Agêntica, responsável por gerar diversos ativos digitais.",
    },
    {
      number: 2,
      icon: Brain,
      title: "Processamento IA",
      description: "Transcrição multilíngue, identificação de insights e personalização por perfil do usuário.",
    },
    {
      number: 3,
      icon: BookOpen,
      title: "Geração",
      description:
        "Livebooks personalizados, Plano de Ação, Cards para Redes Sociais, Slides e Áudios na íntegra — em tempo real.",
    },
    {
      number: 4,
      icon: Share2,
      title: "Distribuição",
      description:
        "Entrega inteligente com a Bia, nossa Scriba Digital, que tira dúvidas dos participantes, aprofunda o conhecimento com base no que foi discutido no evento e conecta o usuários aos palestrantes, expositores e patrocinadores, de acordo com a demanda e perfil.",
    },
  ];

  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Settings className="h-4 w-4" /> Processo Simples
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Como o ScribIA Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De palestras ao vivo para Livebooks personalizados em minutos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="relative hover:-translate-y-2 transition-transform text-center">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                  {step.number}
                </div>
                <CardContent className="pt-10 pb-6 px-6">
                  <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-primary">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={handleScrollToPlans}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 text-lg shadow-xl hover-scale"
          >
            QUERO CONTRATAR O SCRIBIA!
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksNew;