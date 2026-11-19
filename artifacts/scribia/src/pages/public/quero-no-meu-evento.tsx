import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PublicHeader } from "@/components/layout/public-header"
import Footer from "@/components/sections/Footer"
import { LeadWizardDialog } from "@/components/lead-wizard-dialog"
import { PricingSimulator, type SimulationResult } from "@/components/organizer/pricing-simulator"
import heroBg from "@/assets/images/organizadores-hero-bg.jpg"
import {
  BookOpen,
  Share2,
  Headphones,
  BarChart3,
  Target,
  Sparkles,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react"

// Fonte: relatório analítico do evento (gerado em 10/11/2026) + soma de audio_duration_seconds das
// palestras no banco (consultado em 10/11/2026). Números confirmados por Sabrina em 10/11/2026.
const ENEON_PROOF = {
  title: "IX ENEON",
  subtitle: "Encontro de Enfermagem Obstétrica e Neonatal do Estado do Rio de Janeiro",
  participants: 317,
  adoptionRate: 65,
  engagementRate: 67,
  audioHours: 21,
  livebooks: 21,
}

const RIW_PROOF = {
  title: "RIW",
  subtitle: "Rio Innovation Week, Palco 25, Arca Hub",
  participants: 412,
  adoptionRate: 59,
  engagementRate: 68,
  audioHours: 21,
  livebooks: 23,
}

const whatsIncluded = [
  {
    icon: BookOpen,
    title: "livebooks e playbooks de todas as palestras",
    description: "Permanentes para os participantes, disponíveis para acessar e revisitar quando quiserem.",
  },
  {
    icon: Share2,
    title: "cards para redes sociais com a marca do organizador",
    description: "White-label: a identidade visual é a do seu evento, não a do ScribIA.",
  },
  {
    icon: Headphones,
    title: "áudio na íntegra",
    description: "Disponível pela janela de tempo que você definir para o seu evento.",
  },
  {
    icon: BarChart3,
    title: "relatórios analíticos",
    description: "Dashboard e relatório final do evento, exclusivos do organizador.",
  },
]

const howItWorks = [
  {
    icon: Target,
    title: "Você decide quem recebe acesso",
    description: "Convites sem login complicado e sem fricção, geridos por você. O ScribIA também pode ser oferecido como adicional na venda dos ingressos.",
  },
  {
    icon: Headphones,
    title: "O áudio é capturado e transformado em livebook pela IA",
    description: "A captação pode ser feita pela produção do evento, pela equipe do ScribIA ou por qualquer pessoa autorizada, gravando no celular e enviando o arquivo. A partir do áudio, a IA gera o livebook de cada palestra.",
  },
  {
    icon: Users,
    title: "Seu público acessa, compartilha e revisita",
    description: "Os participantes voltam ao conteúdo quando querem, comentam e compartilham cards nas redes, mantendo o evento presente além da programação.",
  },
  {
    icon: TrendingUp,
    title: "Você recebe métricas reais de engajamento",
    description: "No relatório do evento: quem acessou, quais palestras tiveram mais audiência e o que foi baixado.",
  },
]

function ProofCard({ data }: { data: typeof ENEON_PROOF | typeof RIW_PROOF }) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-1">{data.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{data.subtitle}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-2xl font-bold">{data.participants}</p>
            <p className="text-muted-foreground">participantes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.adoptionRate}%</p>
            <p className="text-muted-foreground">entraram na plataforma</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.engagementRate}%</p>
            <p className="text-muted-foreground">de engajamento</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.livebooks}</p>
            <p className="text-muted-foreground">livebooks gerados</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Mais de {data.audioHours} horas de áudio processadas.
        </p>
      </CardContent>
    </Card>
  )
}

const faqItems = [
  {
    question: "Preciso instalar algo no evento?",
    answer: "Não. O áudio pode ser captado pela produção do evento, pela equipe do ScribIA ou por qualquer pessoa autorizada, gravando no celular e enviando o arquivo.",
  },
  {
    question: "O ScribIA altera o que o palestrante diz?",
    answer: "Não. O ScribIA preserva e estrutura a fala original, sem corrigir ou editar o conteúdo.",
  },
  {
    question: "O que continua disponível depois do evento?",
    answer: "Livebooks, playbooks e cards ficam permanentes para os participantes. O áudio na íntegra fica disponível pela janela que você definir.",
  },
  {
    question: "E se meu evento for fora do RJ e de SP?",
    answer: "A captação de áudio vem inclusa em todo o Brasil, não só no Rio de Janeiro e em São Paulo.",
  },
  {
    question: "Os patrocinadores aparecem no conteúdo?",
    answer: "O link do patrocinador aparece nos livebooks. O dashboard do patrocinador está em desenvolvimento.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function QueroNoMeuEventoPage() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardSeed, setWizardSeed] = useState<
    Partial<{
      eventDate: string
      participants: string
      city: string
      state: string
      rooms: string
      days: string
      captureTeam: "" | "event" | "scribia"
      teamCaptureCost: string
    }>
  >({})

  useEffect(() => {
    document.title = "ScribIA: Para organizadores de eventos"
  }, [])

  function scrollToOferta() {
    document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth" })
  }

  function handleRequestProposal(result: SimulationResult) {
    setWizardSeed({
      participants: String(result.participants),
      city: result.city,
      state: result.uf,
      eventDate: result.eventDate,
      rooms: String(result.rooms),
      days: String(result.days),
      captureTeam: result.captureTeam,
      teamCaptureCost: String(result.teamCaptureCost),
    })
    setWizardOpen(true)
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />

      <main className="px-4 sm:px-8 md:px-14 lg:px-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/80" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Para organizadores de eventos</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                O pós-evento que continua vendendo.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
                O ScribIA transforma o áudio das palestras do seu evento em livebooks, playbooks e cards com a
                sua marca, que continuam com os participantes depois que o palco apaga. E mostra, em
                relatórios, o que o seu público acessou.
              </p>

              <p className="text-base text-muted-foreground mb-8">
                Pacote por evento, com a sua equipe ou a equipe do ScribIA cuidando da captação de áudio.
                Contrate até 15 dias antes do evento.
              </p>

              <Button size="lg" onClick={scrollToOferta} className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="flex items-center gap-2">
                  Simular e pedir proposta
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Prova */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Resultados em eventos reais</h2>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-6">
              <motion.div variants={itemVariants}>
                <ProofCard data={ENEON_PROOF} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <ProofCard data={RIW_PROOF} />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-1">SIAPARTO: de 2025 para 2026</h3>
                  <p className="text-muted-foreground">
                    980 participantes em 2025 e contrato renovado para 2026.
                  </p>
                  {/* TODO(confirmar): depoimento da organização do SIAPARTO pendente de autorização e
                      vídeo/frase aprovada (plano de mudanças do site, 09/11/2026, seção 4). */}
                </CardContent>
              </Card>
            </motion.div>
            {/* TODO(confirmar): bloco de prova do SIAPARTO 2026 fica sem renderizar até Sabrina enviar
                os números (plano de mudanças do site, 09/11/2026, seção 4) — por isso não há um
                componente aqui ainda: não há dados reais para mostrar. */}
          </div>
        </section>

        {/* O que está incluso */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">O que está incluso</h2>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {whatsIncluded.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Oferta e simulador */}
        <section id="oferta" className="py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Como você paga</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Duas formas de contratar: pacote fechado por evento ou upsell no ingresso.
              </p>
            </motion.div>

            <PricingSimulator onRequestProposal={handleRequestProposal} />
          </div>
        </section>

        {/* Como funciona */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-6">
              {howItWorks.map((step, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <Card className="hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{idx + 1}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <step.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                          </div>
                          <p className="text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Objeções (FAQ) */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                {faqItems.map((item, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto text-center">
              <p className="text-lg text-muted-foreground mb-8">
                Leve o ScribIA para o seu próximo evento. Transforme cada palestra em um ativo vivo da sua
                marca.
              </p>

              <Button size="lg" onClick={scrollToOferta} className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="flex items-center gap-2">
                  Simular e pedir proposta
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>

              <p className="text-sm text-muted-foreground mt-6">
                Ou fale direto: WhatsApp (21) 99747-8748 ou contato@scribia.com.br.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      <LeadWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} initialData={wizardSeed} />
    </div>
  )
}
