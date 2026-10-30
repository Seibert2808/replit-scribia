import { Link } from "wouter";
import { Check, ArrowRight } from "lucide-react";
import { GRADIENTE_MARCA } from "@/utils/paleta";
import livebookImage from "@/assets/images/livebook-tablet-home.png";

const LivebookSection = () => {
  // Leva a pagina de venda, e nao mais ao formulario do fim da home.
  // Quem clica aqui ja decidiu que quer saber como contratar.

  return (
    <section className="py-16 md:py-24 text-white relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1B1930 0%, #232041 100%)' }}>
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="min-w-0">
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
            <Link
              href="/quero-no-meu-evento"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 whitespace-normal rounded-2xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_55px_hsla(260,85%,65%,0.6)]"
              style={{ background: GRADIENTE_MARCA }}
            >
              QUERO O SCRIBIA NO MEU EVENTO!
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative flex justify-center items-center min-w-0">
            {/* Mesma moldura branca da SolutionSection: a foto em si tem
                fundo claro, sem moldura ficava um retangulo branco cru
                sobre o degrade escuro. */}
            <div className="w-full max-w-md rounded-2xl bg-white p-3 shadow-glow">
              <img
                src={livebookImage}
                alt="Profissional apresentando Livebook ScribIA em tablet"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LivebookSection;