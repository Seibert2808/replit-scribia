
import { Button } from "@/components/ui/button";
import { COPY } from "@/utils/constants";
import { Mic, BrainCircuit, QrCode } from "lucide-react";
import heroImage from "@/assets/images/hero-scribia-new.png";

const Hero = () => {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background to-[hsl(var(--primary))/0.08]" />
      <div className="container mx-auto py-20 md:py-28">
        <div className="grid md:grid-cols-5 gap-10 items-center">
          <div className="space-y-6 md:col-span-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 text-secondary-foreground px-3 py-1 text-xs">
              <Mic className="h-4 w-4" />
              <span>Transcrição + Resumo Inteligente</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              {COPY.headline}
            </h1>
            <p className="text-xl md:text-2xl font-medium text-primary/80">
              {COPY.tagline}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              {COPY.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="cta" 
                size="lg" 
                className="hover-scale"
                onClick={() => {/* Link do vídeo será adicionado posteriormente */}}
              >
                Ver como funciona
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <span>Qualidade acadêmica</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <span>Entrega por QR Code</span>
              </div>
            </div>
          </div>
          <div className="relative md:col-span-2">
            <div className="rounded-xl overflow-hidden shadow-elegant ring-1 ring-border">
              <img
                src={heroImage}
                alt="Scribia - Transcrição e resumo com IA para congressos"
                className="w-full h-auto object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
