import NewHero from "@/components/sections/new/NewHero";
import ProblemSection from "@/components/sections/new/ProblemSection";
import SolutionSection from "@/components/sections/new/SolutionSection";
import HowItWorksNew from "@/components/sections/new/HowItWorksNew";
import FeaturesSection from "@/components/sections/new/FeaturesSection";
import LivebookSection from "@/components/sections/new/LivebookSection";
import BiaSection from "@/components/sections/new/BiaSection";
import MetricsSection from "@/components/sections/new/MetricsSection";
import FAQSectionNew from "@/components/sections/new/FAQSectionNew";
import DemoSection from "@/components/sections/new/DemoSection";
import ContactSection from "@/components/sections/new/ContactSection";
import Footer from "@/components/sections/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const title = "Scribia — Sistema de processamento inteligente de áudio e texto";
  const description = "Transcrição e resumos com IA para congressos. Do palco ao material pronto em minutos após a palestra — insights organizados em mini e‑books premium. Acesso imediato por e-mail, SMS ou QR Code.";
  const canonical = "/";

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
          text: "Você pode optar por e-mail, SMS ou QR Code no final de cada sessão.",
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

      <main>
        <NewHero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksNew />
        <FeaturesSection />
        <LivebookSection />
        <BiaSection />
        <MetricsSection />
        <FAQSectionNew />
        <DemoSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
