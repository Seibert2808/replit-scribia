import { useEffect, useState } from "react";
import { FUNDO_PORTFOLIO, GRADIENTE_MARCA_CLARO } from "@/utils/paleta";
import { publicGet } from "@/lib/public-fetch";
import { Trophy, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Os numeros vem do banco, e nao de texto fixo. Antes eram 95% de
// satisfacao, 3min de entrega, 10x de engajamento e 85% de download:
// nenhum vinha de lugar nenhum. Alem de verdadeiros, agora CRESCEM
// SOZINHOS a cada evento.
interface Numeros {
  participantes: number
  palestrantes: number
  palestras: number
  eventos: number
  ativos_digitais: number
  horas_audio: number
  downloads: number
}

// Ordem escolhida por forca: o que mais impressiona primeiro.
function montarCartoes(n: Numeros) {
  return [
    { valor: n.ativos_digitais.toLocaleString('pt-BR'), rotulo: 'Ativos digitais gerados' },
    { valor: `${n.horas_audio.toLocaleString('pt-BR')}h`, rotulo: 'De áudio disponibilizadas' },
    { valor: n.participantes.toLocaleString('pt-BR'), rotulo: 'Participantes alcançados' },
    { valor: n.palestras.toLocaleString('pt-BR'), rotulo: 'Palestras processadas' },
    { valor: n.palestrantes.toLocaleString('pt-BR'), rotulo: 'Palestrantes na plataforma' },
    { valor: n.downloads.toLocaleString('pt-BR'), rotulo: 'Materiais baixados' },
  ]
}

const testimonials = [
  {
    id: "zlSJkvTNFS8",
    name: "Raquel Carara",
    title: "Participante"
  },
  {
    id: "0Ow8dvZ4Ngo",
    name: "Dra. Heloisa Lessa",
    title: "Palestrante"
  },
  {
    id: "-vi2sSjoxqA",
    name: "Dr. Diego Mattos",
    title: "Palestrante e organização"
  },
  {
    id: "puSyOx1fAGk",
    name: "Dr. Paul Golden",
    title: "Palestrante"
  },
  {
    id: "dD2f-l-lcEI",
    name: "Luciana Bueno",
    title: "Participante"
  },
  {
    id: "Wt-LpvYtf8k",
    name: "Angélica Araújo",
    title: "Participante"
  }
];

const MetricsSection = () => {
  const [numeros, setNumeros] = useState<Numeros | null>(null)

  useEffect(() => {
    let montado = true
    publicGet<Numeros>('public_platform_stats?select=*')
      .then((linhas) => { if (montado && linhas[0]) setNumeros(linhas[0]) })
      .catch(() => { /* sem numeros a secao nao aparece: melhor faltar que mentir */ })
    return () => { montado = false }
  }, [])

  return (
    <section style={FUNDO_PORTFOLIO} className="py-16 md:py-24 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Trophy className="h-4 w-4" /> Resultados Comprovados
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent" style={{ backgroundImage: GRADIENTE_MARCA_CLARO }}>
            Números que Impressionam
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O ecossistema do ScribIA só faz crescer. Estes números são contados agora,
            direto da plataforma.
          </p>
        </div>
        
        {/* Se a consulta falhar, a secao nao mostra numero nenhum. Melhor
            faltar do que exibir valor velho como se fosse de agora. */}
        {numeros && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
            {montarCartoes(numeros).map((m) => (
              <Card key={m.rotulo} className="bg-card border border-border p-4 md:p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div
                  className="text-2xl md:text-4xl font-extrabold mb-1 bg-clip-text text-transparent"
                  style={{ backgroundImage: GRADIENTE_MARCA_CLARO }}
                >
                  {m.valor}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">{m.rotulo}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Testimonials Carousel */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-light/10 text-[#A794DC] px-4 py-2 rounded-full text-sm font-semibold mb-4">
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
