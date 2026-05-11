import { COPY } from "@/utils/constants";
import { Mic, Sparkles, Mail, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";

const icons = [Mic, Sparkles, Mail];

const HowItWorks = () => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Como funciona</h2>
        <div ref={ref} className={`grid md:grid-cols-3 gap-6 ${!inView ? "opacity-0 translate-y-2" : "animate-fade-in"}`}>
          {COPY.howItWorksSteps.map((step, i) => {
            const Icon = icons[i] || QrCode;
            return (
              <Card key={i} className="h-full hover-scale">
                <CardHeader>
                  <div className="h-10 w-10 rounded-md bg-secondary/20 flex items-center justify-center text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{`${i + 1}. ${step.title}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-12 text-center max-w-3xl mx-auto">
          <p className="text-lg md:text-xl font-semibold text-primary bg-primary/5 rounded-xl p-6 border border-primary/10">
            Mantenha todos os seus eventos organizados na plataforma do ScribIA e deixe que nossa Inteligência Artificial encontre suas anotações e o ajude a correlacionar as informações adquiridas.
          </p>
          <Button 
            onClick={() => window.location.href = '/cadastro'}
            size="lg"
            className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 text-lg shadow-xl hover-scale"
          >
            QUERO CRIAR MINHA CONTA
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
