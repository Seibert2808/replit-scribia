import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FinalCTA = () => {
  const handleContactClick = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Pronto para transformar seus eventos?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fale com nosso time e descubra como os Livebooks, a distribuição inteligente e a BIA podem elevar a experiência dos seus participantes e patrocinadores.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-extrabold mb-3">Para organizadores</h3>
            <p className="text-muted-foreground mb-4">Soluções completas para tornar seu conteúdo impactante e distribuído com eficiência.</p>
            <Button onClick={handleContactClick} className="w-full">Falar com o time</Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-extrabold mb-3">Para patrocinadores</h3>
            <p className="text-muted-foreground mb-4">Captação de leads qualificados e relatórios de engajamento em tempo real.</p>
            <Button onClick={handleContactClick} className="w-full">Falar com o time</Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;