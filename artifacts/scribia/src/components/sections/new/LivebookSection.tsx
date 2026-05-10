import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import livebookImage from "@/assets/images/livebook-tablet-home.png";

const LivebookSection = () => {
  const handleScrollToPlans = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-16 md:py-24 text-white relative overflow-hidden" style={{ backgroundColor: '#928bdd' }}>
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              O Que São Livebooks?
            </h2>
            <p className="text-lg mb-6 opacity-95 leading-relaxed">
              Livebooks são resumos inteligentes e personalizados gerados por IA a partir do conteúdo 
              das palestras. Cada participante recebe um material adaptado ao seu perfil profissional 
              e áreas de interesse.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Resumos estruturados com principais insights",
                "Personalização baseada no perfil do usuário",
                "Acesso via web, mobile ou PDF download",
                "Entrega em até 3 minutos após a palestra"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-base">
                  <Check className="h-5 w-5 text-green-300 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={handleScrollToPlans}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-6 text-lg shadow-2xl hover-scale"
            >
              QUERO CONTRATAR!
            </Button>
          </div>
          
          <div className="relative flex justify-center items-center">
            <img 
              src={livebookImage} 
              alt="Profissional apresentando Livebook ScribIA em tablet" 
              className="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LivebookSection;