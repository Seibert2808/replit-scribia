import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AgendarSessaoDialog from "@/components/AgendarSessaoDialog";

type Plan = {
  name: string;
  range: string;
  price: number | null;
  features: string[];
  cta: string;
  featured: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    range: "Até 99 participantes",
    price: 2500,
    features: [
      "Plataforma ScribIA durante o evento",
      "Livebook personalizado para cada participante",
      "Tutor IA — Bia",
      "Métricas básicas de engajamento",
    ],
    cta: "Quero este plano",
    featured: false,
  },
  {
    name: "Essencial",
    range: "100 a 999 participantes",
    price: 10000,
    features: [
      "Tudo do plano Starter",
      "Equipe ScribIA captura áudio no local",
      "Painel completo de métricas",
      "Suporte dedicado durante o evento",
    ],
    cta: "Quero este plano",
    featured: true,
  },
  {
    name: "Premium",
    range: "1.000 a 1.499 participantes",
    price: 15000,
    features: [
      "Tudo do plano Essencial",
      "Onboarding com a sua equipe",
      "Personalização de marca nos Livebooks",
      "Suporte prioritário",
    ],
    cta: "Quero este plano",
    featured: false,
  },
  {
    name: "Enterprise",
    range: "Acima de 1.500 participantes",
    price: null,
    features: [
      "Solução sob medida",
      "Equipe técnica dedicada",
      "SLA personalizado",
      "Integrações sob demanda",
    ],
    cta: "Falar com a equipe",
    featured: false,
  },
];

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

const PricingSectionNew = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <section id="precos" className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Tag className="h-4 w-4" /> Planos e Preços
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Escolha o Plano Ideal para Seu Evento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preço único por evento, baseado no número de participantes
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.featured ? "border-primary shadow-lg scale-[1.02]" : ""
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Mais Popular
                </div>
              )}
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.range}</p>

                {plan.price !== null ? (
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold">
                      R$ {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground text-sm"> /evento</span>
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className="text-2xl font-bold text-primary">Sob Consulta</span>
                  </div>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.featured ? "cta" : "outline"}
                  onClick={() => setIsDialogOpen(true)}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <AgendarSessaoDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
    </section>
  );
};

export default PricingSectionNew;
