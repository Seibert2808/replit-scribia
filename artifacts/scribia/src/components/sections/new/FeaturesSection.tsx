import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Mic,
  Handshake,
  BookOpen,
  Bot,
  Network,
  Infinity,
  BarChart3,
  DollarSign,
  RefreshCw,
  Plug,
  Globe,
  Coins,
  Star,
  MessageCircle,
  Eye,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState("participantes");

  const tabs = [
    { id: "participantes", label: "Participantes", icon: Users },
    { id: "organizadores", label: "Organizadores", icon: Calendar },
    { id: "palestrantes", label: "Palestrantes", icon: Mic },
    { id: "patrocinadores", label: "Patrocinadores", icon: Handshake },
  ];

  const features = {
    participantes: [
      {
        icon: BookOpen,
        title: "Livebooks Personalizados",
        description: "Resumos adaptados ao seu perfil e interesses específicos",
      },
      {
        icon: Bot,
        title: "Scriba Digital",
        description: "Assistente inteligente para tirar dúvidas e aprofundar conhecimento",
      },
      {
        icon: Network,
        title: "Networking Facilitado",
        description: "Conexão com os palestrantes, expositores e patrocinadores de acordo com o seu interesses",
      },
      {
        icon: Infinity,
        title: "Acesso Vitalício",
        description: "Biblioteca pessoal de conhecimento sempre disponível",
      },
    ],
    organizadores: [
      {
        icon: BarChart3,
        title: "Dashboard Analítico",
        description: "Métricas detalhadas de engajamento e satisfação em tempo real",
      },
      {
        icon: DollarSign,
        title: "ROI Mensurável",
        description: "Dados concretos sobre o impacto e valor gerado pelo evento",
      },
      {
        icon: RefreshCw,
        title: "Engajamento Contínuo",
        description: "Mantenha participantes engajados mesmo após o evento",
      },
      {
        icon: Plug,
        title: "Integração Fácil",
        description: "Conecte com Zoom, Sympla, Eventbrite e outras plataformas",
      },
    ],
    palestrantes: [
      {
        icon: Globe,
        title: "Alcance Ampliado",
        description: "Seu conteúdo alcança mais pessoas através dos Livebooks",
      },
      { icon: Coins, title: "Monetização", description: "Marketplace para vender produtos e serviços relacionados" },
      { icon: Star, title: "Autoridade", description: "Construa sua reputação com conteúdo documentado e acessível" },
      {
        icon: MessageCircle,
        title: "Feedback Direto",
        description: "Receba insights sobre o que mais interessou sua audiência",
      },
    ],
    patrocinadores: [
      {
        icon: Eye,
        title: "Visibilidade Estendida",
        description: "Sua marca presente nos diversos ativos digitais e nas interações pós-evento",
      },
      {
        icon: Target,
        title: "Leads Qualificados",
        description: "Acesse participantes realmente interessados no seu segmento",
      },
      {
        icon: TrendingUp,
        title: "ROI Mensurável",
        description: "Dados concretos de impressões, engajamento e conversões",
      },
      {
        icon: Award,
        title: "Branding Duradouro",
        description: "Associação com conteúdo de valor mantém sua marca em evidência",
      },
    ],
  };

  return (
    <section id="recursos" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="h-4 w-4" /> Recursos Exclusivos
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Benefícios para Todos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades específicas que atendem às necessidades únicas de cada parte do ecossistema
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {features[activeTab as keyof typeof features].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="bg-secondary/10 hover:bg-background hover:-translate-y-1 transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/70 scale-x-0 group-hover:scale-x-100 transition-transform" />
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2 text-primary">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;