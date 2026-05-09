import { Upload, Brain, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useInView } from "@/hooks/useInView";

const HowItWorksSimple = () => {
  const { ref, inView } = useInView<HTMLDivElement>();

  const steps = [
    {
      icon: Upload,
      title: "Envie um áudio ou slides",
      description: "(ou use um conteúdo de exemplo)",
    },
    {
      icon: Brain,
      title: "ScribIA processa com IA",
      description: "(transcreve, organiza e sintetiza)",
    },
    {
      icon: FileText,
      title: "Receba seu ebook compacto em PDF",
      description: "(claro, objetivo e pronto para compartilhar)",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
          <p className="text-lg text-muted-foreground">
            Do upload ao ebook compacto — em minutos.
          </p>
        </div>

        <div ref={ref} className={`grid md:grid-cols-3 gap-8 ${!inView ? "opacity-0 translate-y-2" : "animate-fade-in"}`}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="text-center hover-scale shadow-elegant">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mb-2 text-sm font-semibold text-primary">
                    Passo {index + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSimple;