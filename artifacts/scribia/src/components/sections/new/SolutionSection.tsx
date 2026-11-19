import { GRADIENTE_MARCA } from "@/utils/paleta";
import { Lightbulb } from "lucide-react";
import ecosystemVideo from "@/assets/videos/ecossistema-scribia.mp4";

const SolutionSection = () => {
  return (
    <section id="solucao" className="py-16 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Lightbulb className="h-4 w-4" /> A Solução
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent" style={{ backgroundImage: GRADIENTE_MARCA }}>
            Um Ecossistema Inteligente e Conectado
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            ScribIA transforma cada evento em uma plataforma de conhecimento contínuo, 
            onde todos os stakeholders se beneficiam mutuamente.
          </p>
        </div>
        
        <div className="flex justify-center">
          {/* Sem moldura branca: o vídeo já nasce no azul/roxo escuro da
              marca, então ele mesmo se integra ao fundo da seção, sem
              precisar do cartão claro que a arte estática pedia. Pedido da
              Sabrina em 19/11/2026: maior, com menos margem ao redor. */}
          <video
            src={ecosystemVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-w-6xl h-auto rounded-2xl shadow-glow"
            aria-label="Animação do ScribIA conectando participantes, organizadores, palestrantes e patrocinadores"
          />
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;