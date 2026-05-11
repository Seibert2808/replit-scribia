import { Button } from "@/components/ui/button";
import { Info, Users, Calendar, Mic, Handshake, ArrowRight, Megaphone } from "lucide-react";
import heroImage from "@/assets/images/hero-scribia-stage.png";

const NewHero = () => {
  return (
    <section id="hero" className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Text column */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center bg-primary/20 backdrop-blur-md border border-primary/30 px-4 py-2 rounded-full text-sm mb-6">
              <span className="font-semibold">Powered by AI</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Transforme Eventos em Ativos Digitais com IA
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Nosso ecossistema de inteligência artificial transforma o engajamento dos participantes,
              prolonga o impacto dos seus eventos e desbloqueia novas fontes de receita para organizadores,
              palestrantes e patrocinadores.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button variant="outline" size="lg" asChild>
                <a href="#como-funciona" className="flex items-center gap-2">
                  <Info className="h-5 w-5" /> Ver como funciona
                </a>
              </Button>
            </div>
          </div>

          {/* Image column */}
          <div className="relative order-first lg:order-last">
            <img
              src={heroImage}
              alt="Plateia em evento Scribia"
              className="w-full h-auto rounded-2xl shadow-elegant object-cover"
            />
          </div>
        </div>

        {/* Persona cards */}
        <div className="flex flex-wrap justify-center gap-4 mt-12 lg:mt-16">
          <a href="#como-funciona" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
            <Users className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm mb-2 text-center">Sou Participante</h4>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Clique aqui</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a href="#como-funciona" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm mb-2 text-center">Sou Influenciador</h4>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Clique aqui</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a href="#como-funciona" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm mb-2 text-center">Sou Organizador</h4>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Clique aqui</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a href="#como-funciona" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
            <Mic className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm mb-2 text-center">Sou Palestrante</h4>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Clique aqui</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a href="#como-funciona" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
            <Handshake className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm mb-2 text-center">Sou Patrocinador</h4>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Clique aqui</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default NewHero;
