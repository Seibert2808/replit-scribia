import { Lightbulb } from "lucide-react";
import ecosystemDiagram from "@/assets/images/ecosystem-diagram-home.png";

const SolutionSection = () => {
  return (
    <section id="solucao" className="py-16 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Lightbulb className="h-4 w-4" /> A Solução
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Um Ecossistema Inteligente e Conectado
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            ScribIA transforma cada evento em uma plataforma de conhecimento contínuo, 
            onde todos os stakeholders se beneficiam mutuamente.
          </p>
        </div>
        
        <div className="flex justify-center">
          <img 
            src={ecosystemDiagram} 
            alt="Diagrama do ecossistema ScribIA conectando participantes, organizadores, palestrantes e patrocinadores" 
            className="w-full max-w-5xl h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;