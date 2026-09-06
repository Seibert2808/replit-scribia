import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { SITE } from "@/utils/constants";

const DemoSection = () => {
  // Com agenda configurada, abre a agenda em aba nova. Sem ela, rola ate
  // o formulario de contato, que funciona. O antigo abria cal.com, a
  // pagina inicial do servico, e nao agendava nada.
  const handleDemoClick = () => {
    if (SITE.agendaUrl) {
      window.open(SITE.agendaUrl, "_blank", "noopener,noreferrer");
      return;
    }
    document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Play className="h-3 w-3" /> DEMO
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Veja uma demonstração</h2>
            <p className="text-muted-foreground mb-6">
              Assista a uma demonstração do ScribIA em funcionamento e entenda como os Livebooks são gerados e distribuídos em poucos minutos.
            </p>
            <Button onClick={handleDemoClick} size="lg">
              {SITE.agendaUrl ? "Agendar demonstração" : "Falar com a gente"}
            </Button>
          </div>
          <div className="rounded-xl aspect-video overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/78P9VtLrx-4"
              title="Demonstração ScribIA"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;