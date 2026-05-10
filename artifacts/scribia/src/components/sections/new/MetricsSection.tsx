import { Trophy, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const metrics = [
  { value: "95%", label: "Taxa de Satisfação" },
  { value: "3min", label: "Tempo Médio de Entrega" },
  { value: "10x", label: "Aumento no Engajamento" },
  { value: "85%", label: "Taxa de Download dos Livebooks" }
];

const testimonials = [
  {
    id: "zlSJkvTNFS8",
    name: "Raquel Carara",
    title: "Event Organizer"
  },
  {
    id: "0Ow8dvZ4Ngo",
    name: "Dra. Heloisa Lessa",
    title: "Médica"
  },
  {
    id: "-vi2sSjoxqA",
    name: "Dr. Diego Mattos",
    title: "Médico"
  },
  {
    id: "puSyOx1fAGk",
    name: "Dr. Paul Golden",
    title: "Médico"
  },
  {
    id: "dD2f-l-lcEI",
    name: "Luciana Bueno",
    title: "Event Organizer"
  },
  {
    id: "Wt-LpvYtf8k",
    name: "Angélica Araújo",
    title: "Enfermeira"
  }
];

const MetricsSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Trophy className="h-4 w-4" /> Resultados Comprovados
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Números que Impressionam
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dados reais de eventos que já utilizam o ScribIA
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
          {metrics.map((metric, idx) => (
            <Card key={idx} className="bg-card border border-border p-4 md:p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-2xl md:text-3xl font-bold mb-1 text-primary">{metric.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{metric.label}</div>
            </Card>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Quote className="h-4 w-4" /> Depoimentos
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              O que dizem nossos clientes
            </h3>
            <p className="text-muted-foreground">
              Veja como o ScribIA transformou eventos reais
            </p>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-2 md:pl-3 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Card className="p-2 h-full">
                    <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted mb-2">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${testimonial.id}`}
                        title={`Depoimento de ${testimonial.name}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-xs">{testimonial.name}</p>
                      <p className="text-[10px] text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
