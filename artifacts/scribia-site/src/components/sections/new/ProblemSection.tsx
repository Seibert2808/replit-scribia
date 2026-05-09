import { AlertTriangle, Users, TrendingUp, Megaphone, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ProblemSection = () => {
  return (
    <section id="problema" className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <AlertTriangle className="h-4 w-4" /> O Desafio
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            95% do Conteúdo de Eventos se Perde
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Eventos geram conhecimento valioso, mas sem as ferramentas certas, 
            esse valor desaparece assim que as luzes se apagam.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <Card className="border-t-4 border-t-primary hover:-translate-y-2 transition-transform">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Participantes</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Perdem insights valiosos das palestras</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Dificuldade em reter informações complexas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Networking limitado ao momento do evento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Sem material estruturado para consulta</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-primary hover:-translate-y-2 transition-transform">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Organizadores</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Baixo engajamento pós-evento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Métricas limitadas de sucesso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Dificuldade em demonstrar ROI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Conteúdo não reutilizável</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Deixam de gerar receita recorrente</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-primary hover:-translate-y-2 transition-transform">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <Mic className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Palestrantes</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Esquecidos em 48h após o aplauso final</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Plateia promete seguir, mas raramente segue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Perdem vendas de cursos, livros e mentorias</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Sem prova social para conquistar novos palcos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Horas de preparo que viram conteúdo descartável</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-primary hover:-translate-y-2 transition-transform">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <Megaphone className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Patrocinadores</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Visibilidade apenas momentânea</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>ROI não mensurável claramente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Sem dados de engajamento real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-1">✗</span>
                  <span>Investimento sem continuidade</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;