import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Hero from "@/components/sections/Hero";
import ProblemSolution from "@/components/sections/ProblemSolution";
import HowItWorks from "@/components/sections/HowItWorks";
import Benefits from "@/components/sections/Benefits";
import SocialProof from "@/components/sections/SocialProof";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";
import { keyBlackToTransparent } from "@/utils/image";
const ParticipantesLanding = () => {
  const navigate = useNavigate();
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/scribia-logo-new.png");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    keyBlackToTransparent("/lovable-uploads/scribia-logo-new.png", 24)
      .then(setLogoSrc)
      .catch(() => {});

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const title = "Scribia — Sistema de processamento inteligente de áudio e texto";
  const description =
    "Transcrição e resumos com IA para congressos. Do palco ao material pronto em minutos após a palestra — insights organizados em mini e‑books premium. Acesso imediato por e-mail, SMS ou QR Code.";
  const canonical = "/participantes";

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Como o Scribia garante qualidade das transcrições?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Usamos modelos de IA de ponta com calibração específica para termos acadêmicos e conferimos com heurísticas de qualidade.",
        },
      },
      {
        "@type": "Question",
        name: "Como recebo os resumos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Seu livebook ficará gravado na plataforma e você poderá fazer o download em pdf ou arquivo word. Também poderá enviar o link para quem quiser.",
        },
      },
      {
        "@type": "Question",
        name: "É preciso instalar algo no evento?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Não. Nossa equipe pode captar o áudio no local com equipamentos profissionais ou você pode nos enviar as gravações/usar nosso QR Code para associar as sessões.",
        },
      },
      {
        "@type": "Question",
        name: "Posso testar gratuitamente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim, solicite uma demonstração gratuita e enviaremos um exemplo com base em uma palestra de seu interesse.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      {/* Navbar */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/98 shadow-md backdrop-blur-md" : "bg-background/98 backdrop-blur-md"
        } border-b`}
      >
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <a href="/" className="flex items-center h-12">
              <img src={logoSrc} alt="ScribIA logo" className="h-full w-auto" />
            </a>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Benefits />
        <SocialProof />
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

export default ParticipantesLanding;