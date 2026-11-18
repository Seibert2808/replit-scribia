import { Button } from "@/components/ui/button";
import { Info, Calendar, Mic, ArrowRight, MessageCircle } from "lucide-react";
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
        <div className="relative max-w-2xl">
          {/* Brilho ambiente, pulsando atras do titulo: pedido dela, "algo
              em neon roxo para chamar atencao" mesmo sem interacao. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full blur-[90px] animate-pulse-dot"
            style={{ background: 'hsla(260, 85%, 65%, 0.45)' }}
          />
          <div
            className="relative h-[3px] w-14 mb-5 rounded-full shadow-glow"
            style={{ background: GRADIENTE_MARCA }}
          />
          <h1 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
            Seu evento gera valor por 2 dias.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENTE_MARCA }}>
              Deveria gerar por 365.
            </span>
          </h1>
          <p className="relative mt-5 text-base md:text-lg text-white/80 leading-relaxed max-w-xl">
            O áudio que o seu congresso já produz vira acervo, patrocínio com audiência medida e
            receita depois do último aplauso. Sua equipe só aperta PLAY.
          </p>

          <div className="relative flex flex-wrap gap-3 mt-8">
            <Button
              size="lg"
              asChild
              className="shadow-glow transition-all duration-300 hover:shadow-[0_0_55px_hsla(260,85%,65%,0.6)] hover:-translate-y-0.5"
            >
              <a href="#contato" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> Conversar 20 minutos sobre o meu evento
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/30 text-white bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:text-white hover:border-purple-light hover:shadow-glow hover:-translate-y-0.5"
            >
              <a href="#como-funciona" className="flex items-center gap-2">
                <Info className="h-5 w-5" /> Ver como funciona
              </a>
            </Button>
          </div>
          <div className="relative flex flex-wrap gap-5 mt-6">
            <a href="/quero-no-meu-evento" className="group inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
              <Calendar className="h-4 w-4" />
              Sou Organizador
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="/palestrantes" className="group inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
              <Mic className="h-4 w-4" />
              Sou Palestrante
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewHero;
