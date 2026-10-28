import { Button } from "@/components/ui/button";
import { Info, Users, Calendar, Mic, Handshake, ArrowRight, Megaphone, MessageCircle } from "lucide-react";
import heroImage from "@/assets/images/organizadores-hero-bg.jpg";
import { GRADIENTE_MARCA } from "@/utils/paleta";

// Reescrito em 28/10/2026, pedido dela: a foto do auditorio vira fundo
// de tela cheia da primeira secao, como https://institutodbpericias.com/
// (texto ancorado embaixo, sobre a foto, header solido por cima).
//
// A foto (organizadores-hero-bg.jpg) tem uma marca d'agua "SCRIBIA"
// impressa no canto superior esquerdo, de outro uso que nao este. O
// gradiente ESCURO_CANTO cobre justo aquele canto, e o nosso logo de
// verdade, no PublicHeader, fica por cima dele.
const NewHero = () => {
  return (
    <section
      id="hero"
      className="relative -mx-4 sm:-mx-8 md:-mx-14 lg:-mx-16 min-h-screen flex flex-col overflow-hidden"
    >
      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Veu uniforme, pra legibilidade e pra foto parecer ScribIA e nao
          um banco de imagens solto. */}
      <div aria-hidden className="absolute inset-0 bg-[#1B1930]/60" />
      {/* Canto onde a marca d'agua da foto mora, escurecido ate sumir. */}
      <div
        aria-hidden
        className="absolute left-0 top-0 h-[55%] w-full sm:w-[55%]"
        style={{ background: 'radial-gradient(ellipse at top left, #1B1930 0%, rgba(27,25,48,0.5) 55%, transparent 80%)' }}
      />
      {/* Degrade de baixo, onde o texto fica. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[70%]"
        style={{ background: 'linear-gradient(to top, #1B1930 15%, rgba(27,25,48,0.75) 55%, transparent 100%)' }}
      />

      <div className="relative mt-auto w-full px-4 sm:px-8 md:px-14 lg:px-16 pb-16 pt-24 md:pb-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold text-purple-light uppercase tracking-widest mb-4">
            Ecossistema ScribIA
          </p>
          <div className="h-[3px] w-14 mb-5 rounded-full" style={{ background: GRADIENTE_MARCA }} />
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
            Transforme eventos em ativos digitais{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENTE_MARCA }}>
              com IA
            </span>
            .
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/80 leading-relaxed max-w-xl">
            Nosso ecossistema de inteligência artificial transforma o engajamento dos participantes,
            prolonga o impacto dos seus eventos e desbloqueia novas fontes de receita para
            organizadores, palestrantes e patrocinadores.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button size="lg" asChild>
              <a href="#contato" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> Fale conosco
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:text-white transition-colors"
            >
              <a href="#como-funciona" className="flex items-center gap-2">
                <Info className="h-5 w-5" /> Ver como funciona
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// As cartas de persona saiam da FOTO: uma foto de tela cheia pedindo
// atencao e cinco cartoes por cima virava poluicao visual. Agora moram
// logo abaixo, como a continuacao natural do heroi.
export function PersonaCards() {
  return (
    <div className="flex flex-wrap justify-center gap-4 py-12 md:py-16">
      <a href="/participantes" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
        <Users className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-sm mb-2 text-center">Sou Participante</h4>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Clique aqui</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
      <a href="/influenciadores" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
        <Megaphone className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-sm mb-2 text-center">Sou Influenciador</h4>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Clique aqui</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
      <a href="/quero-no-meu-evento" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
        <Calendar className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-sm mb-2 text-center">Sou Organizador</h4>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Clique aqui</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
      <a href="/palestrantes" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
        <Mic className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-sm mb-2 text-center">Sou Palestrante</h4>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Clique aqui</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
      <a href="/patrocinadores" className="group bg-background/80 backdrop-blur-md border-2 border-primary/20 hover:border-primary hover:bg-background hover:shadow-xl p-6 rounded-2xl transition-all hover:-translate-y-2 cursor-pointer min-w-[160px]">
        <Handshake className="h-10 w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
        <h4 className="font-semibold text-sm mb-2 text-center">Sou Patrocinador</h4>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>Clique aqui</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
    </div>
  );
}

export default NewHero;
