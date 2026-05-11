import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/layout/public-header"
import Footer from "@/components/sections/Footer"
import { LeadWizardDialog } from "@/components/lead-wizard-dialog"
import palestraRetrato from "@/assets/images/Nicolai_Site.png"
import palestraPalco from "@/assets/images/palestrante-palco.jpeg"
import {
  Sparkles,
  Eye,
  Award,
  Search,
  BarChart3,
  ShoppingBag,
  Briefcase,
  Mic,
  Brain,
  BookOpen,
  TrendingUp,
  ChevronRight,
  Star,
} from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const questions = [
  "Quem realmente lembra do que você ensinou depois do evento?",
  "Como fazer seu conteúdo continuar circulando, sendo citado e compartilhado?",
  "Como descobrir o que o público realmente quer aprender de você?",
  "Como transformar cada palestra em um ativo que gera novas vendas ou convites?",
]

const benefitsData = [
  { icon: Eye, title: "Ser lembrado além do momento ao vivo", description: "Sua fala vira um Livebook estruturado e memorável que permanece acessível ao público." },
  { icon: Award, title: "Aumentar sua autoridade como especialista", description: "Livebooks circulam, viralizam trechos e reforçam sua credibilidade continuamente." },
  { icon: Search, title: "Ser mais referenciado e encontrado", description: "Conteúdo citável, pesquisável e fácil de referenciar por qualquer pessoa." },
  { icon: BarChart3, title: "Entender o que o público realmente quer", description: "Métricas mostram os trechos que geram mais atenção e interesse real." },
  { icon: ShoppingBag, title: "Criar produtos alinhados à demanda real", description: "Mentorias, cursos e trilhas nascem das métricas de engajamento do público." },
  { icon: Briefcase, title: "Transformar cada palestra em um portfólio vivo", description: "Use os Livebooks em propostas, vendas e redes para demonstrar expertise." },
]

const processSteps = [
  { icon: Mic, title: "Seu público envia o áudio da sua fala", description: "Eles mesmos gravam e enviam — sem exigir nada extra de você." },
  { icon: Brain, title: "A IA transforma sua apresentação em um Livebook", description: "Com estrutura, destaques, frases marcantes e aplicações práticas." },
  { icon: BookOpen, title: "Você recebe o Livebook pronto para divulgar", description: "Ele entra no seu portfólio e na sua estratégia de autoridade." },
  { icon: TrendingUp, title: "Você acompanha o interesse real da audiência", description: "As métricas mostram temas mais atrativos e onde aprofundar sua mensagem." },
]

export default function PalestrantesLandingPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    document.title = "ScribIA — Para palestrantes e influenciadores"
  }, [])

  const openWizard = () => setWizardOpen(true)

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="relative py-12 md:py-16 overflow-hidden" style={{ backgroundColor: "#b9b4d4" }}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-6xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex justify-center md:justify-end order-2 md:order-1">
                <div className="w-56 h-72 md:w-64 md:h-80 lg:w-72 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <img src={palestraRetrato} alt="Palestrante em destaque" className="w-full h-full object-cover object-top" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center order-1 md:order-2">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span>Para Palestrantes e Influenciadores</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 leading-tight">
                  Transforme cada palestra em presença contínua, autoridade e novas oportunidades
                </h1>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex justify-center md:justify-start order-3">
                <div className="w-56 h-72 md:w-64 md:h-80 lg:w-72 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <img src={palestraPalco} alt="Palestrante no palco" className="w-full h-full object-cover object-center" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA entre hero e próxima seção */}
        <section className="py-8 md:py-10">
          <div className="container mx-auto px-4 text-center">
            <Button size="lg" onClick={openWizard} className="group px-8 py-5 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="flex items-center gap-2">
                Quero transformar minha fala em Livebooks
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
        </section>

        {/* Você já se perguntou? */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto">
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Você já se perguntou?</h2>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {questions.map((question, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card className="h-full hover:shadow-md transition-all duration-300 border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <p className="text-muted-foreground">{question}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={itemVariants} className="text-center">
                <p className="text-lg text-muted-foreground italic">
                  O ScribIA existe para transformar sua fala em autoridade contínua, presença ampliada e oportunidades reais — mesmo quando você está offline.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Benefícios */}
        <section id="beneficios" className="py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefícios do ScribIA para Palestrantes</h2>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {benefitsData.map((benefit, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <benefit.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-lg mb-3">{benefit.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-6">
              {processSteps.map((step, idx) => (
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

        {/* Por que amam */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Por que Palestrantes Amam o ScribIA?</h2>
              <p className="text-lg text-muted-foreground mb-8">Porque finalmente existe um jeito de:</p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {["ser lembrado", "ser encontrado", "ser referenciado", "ser procurado", "ser desejado como especialista"].map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}>
                    <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-medium">
                      <Star className="h-3.5 w-3.5" />
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
              <p className="text-muted-foreground italic max-w-2xl mx-auto">
                Não só pelo que você fala, mas pelo que o seu conteúdo continua gerando depois que você sai do palco.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Leve o ScribIA para sua próxima apresentação</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Transforme cada fala em legado, autoridade e oportunidade — como Palestrante ou Influenciador.
              </p>

              <Button size="lg" onClick={openWizard} className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="flex items-center gap-2">
                  Quero transformar minha fala em Livebooks
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      <LeadWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}
