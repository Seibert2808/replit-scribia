import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/layout/public-header"
import Footer from "@/components/sections/Footer"
import { LeadWizardDialog } from "@/components/lead-wizard-dialog"
import heroBg from "@/assets/images/organizadores-hero-bg.jpg"
import sectionImage from "@/assets/images/organizadores-section-image.png"
import {
  Sparkles,
  Users,
  TrendingUp,
  Gift,
  Zap,
  Target,
  PlayCircle,
  Brain,
  BarChart3,
  Repeat,
  Heart,
  ChevronRight,
} from "lucide-react"

const benefitsData = [
  { icon: Repeat, title: "Engajamento contínuo entre uma edição e outra", description: "Cada palestra vira um Livebook interativo, que circula, gera conversa e mantém o público em contato com o evento através da Bia - Tutora de Eventos. Seu evento deixa de ser pontual, vira recorrente na vida das pessoas." },
  { icon: Users, title: "Aumenta drasticamente a taxa de retorno dos participantes", description: "Quando o público recebe valor contínuo, ele volta. Volta para a próxima edição, para comprar o próximo workshop, para participar da próxima formação. O ScribIA cria essa ponte." },
  { icon: TrendingUp, title: "Uma nova forma de monetizar o pós-evento", description: "Com os Livebooks, você pode vender trilhas de conteúdo, oferecer bônus exclusivos, criar clubes de assinatura do evento, aquecer leads para produtos educacionais correlacionados e criar séries temáticas para manter o público ativo. É um ecossistema vivo, não apenas um 'arquivo morto'." },
  { icon: Gift, title: "Um presente que fortalece a marca do evento", description: "Participantes sentem que receberam algo exclusivo e de altíssimo valor. Palestrantes curtem ver suas ideias transformadas em ação. Patrocinadores ganham presença inteligente no conteúdo. Resultado? Seu evento vira inesquecível." },
  { icon: Zap, title: "Suas próximas vendas ficam muito mais fáceis", description: "Quando as pessoas leem o Livebook na semana seguinte, comentam, compartilham e revisitam o conteúdo, elas permanecem aquecidas. Isso diminui o custo de aquisição, o esforço de remarketing e o tempo entre edições, e aumenta o interesse, o retorno e o valor da marca do evento." },
  { icon: Heart, title: "Seus patrocinadores ficam mais engajados e planejam voltar", description: "Com métricas claras de alcance e impacto dentro dos Livebooks, seus patrocinadores enxergam valor real na parceria. Eles veem sua marca sendo revisitada, clicada e lembrada dias e semanas após o evento, cada vez que um usuário faz a busca por um livebook. Isso fortalece o relacionamento e aumenta muito a chance de renovação ou ampliação da parceria." },
]

const processSteps = [
  { icon: Target, title: "Você decide como e quem receberá o acesso ao ScribIA", description: "Ao contratar o ScribIA, os participantes poderão ganhar acesso à plataforma durante o evento sem restrições, sem login complicado, sem fricção, quem gerencia os convites é a organização. O ScribIA pode também ser oferecido como upsell durante a venda dos ingressos." },
  { icon: PlayCircle, title: "Os áudios das palestras são capturados e enviados à plataforma", description: "Os áudios podem ser captados pela produção do evento, pela equipe do ScribIA ou por qualquer pessoa autorizada. Basta gravar no celular e enviar o arquivo, ou gravar diretamente na plataforma. O processo é simples, rápido e sem fricção.", note: "A equipe do ScribIA também pode coletar todos os áudios do evento e gerar automaticamente os Livebooks oficiais de cada palestra." },
  { icon: Brain, title: "A IA transforma cada áudio em um Livebook inteligente", description: "Para cada palestra enviada, o ScribIA cria um Livebook personalizado, de acordo com o perfil do usuário. Portanto, o Livebook de um participante não será igual ao do outro, pois nossa IA cria os textos como se o próprio usuário tivesse criando. Todo esse conteúdo alimenta o tutor do ScribIA, que funcionará como um segundo cérebro especializado em tudo o que o usuário já aprendeu ou ouviu." },
  { icon: Heart, title: "Seu público lê, compartilha e revisita informações do evento com o apoio da Inteligência Artificial gerando engajamento contínuo", description: "Os participantes acessam seus Livebooks a qualquer momento, tiram dúvidas sobre o que aprenderam, buscam outras fontes dos palestrantes ou materiais para aprofundar no assunto. Na comunidade compartilham trechos, revisam o conteúdo, conversam sobre os insights e mantêm o evento vivo muito além da programação." },
  { icon: BarChart3, title: "Você recebe métricas reais de engajamento", description: "No painel do organizador, você acompanha número de Livebooks criados, temas mais acessados, palestras mais gravadas, palestrante mais procurado, engajamento por trilha, alcance social, presença do patrocinador nos conteúdos e evolução do interesse entre palestras. Dados para melhorar as próximas edições, criar novos produtos, vender ingressos com mais facilidade e justificar investimentos para patrocinadores." },
]

const finalBenefits = [
  "Engajamento contínuo: Seu público permanece ativo e conectado ao evento mesmo depois do encerramento.",
  "Público aquecido para próximas edições: Os Livebooks mantêm a atenção do participante, facilitando a venda da próxima edição.",
  "Inteligência para novos produtos: As métricas mostram quais temas geraram mais interesse — perfeito para criar trilhas, workshops e eventos satélites.",
  "Patrocinadores mais satisfeitos: A marca deles aparece no conteúdo que realmente circula e engaja.",
  "Coleta completa opcional: Dependendo do plano, a equipe ScribIA pode capturar todos os áudios e gerar Livebooks oficiais.",
  "Experiência moderna e memorável: Seu evento ganha uma camada extra de valor, percebida imediatamente pelos participantes e palestrantes.",
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

  useEffect(() => {
    document.title = "Scribia — Para organizadores de eventos"
  }, [])

  const openWizard = () => setWizardOpen(true)

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
                <span>Para Organizadores de Eventos</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Transforme seu evento em um motor contínuo de engajamento, comunidade e vendas
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Você já percebeu que o verdadeiro desafio de um evento não é só realizá-lo com perfeição, mas manter as pessoas aquecidas, engajadas e conectadas depois que ele termina?
              </p>

              <Button size="lg" onClick={openWizard} className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="flex items-center gap-2">
                  Quero manter meu público engajado com o ScribIA
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Perguntas */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto">
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">E você já se perguntou:</h2>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  "Como manter seu público interessado pela marca do evento durante o ano inteiro?",
                  "Como transformar participantes em uma comunidade ativa e receptiva aos próximos convites?",
                  "Como fazer com que o evento deixe de ser 'único' e se torne parte da rotina do público?",
                  "Como vender mentorias, cursos, produtos ou novos eventos sem ter que começar do zero toda vez?",
                ].map((question, idx) => (
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
                  E se existisse uma forma de continuar presente — de manter o público engajado, aquecido e esperando ansiosamente pelo próximo movimento?
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* O que é */}
        <section id="o-que-e" className="py-16 md:py-20 overflow-hidden" style={{ backgroundColor: "#b9b4d4" }}>
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex justify-center order-2 md:order-1">
                  <div className="w-64 h-80 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
                    <img src={sectionImage} alt="Pessoa usando ScribIA" className="w-full h-full object-cover" />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="order-1 md:order-2 flex flex-col gap-5">
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">O ScribIA faz exatamente isso</h2>
                  <p className="text-lg text-foreground/80 leading-relaxed">
                    Transforma seu evento em um ecossistema vivo, onde a sua marca continua conversando com o público muito depois do encerramento.
                  </p>
                  <div>
                    <Button size="lg" onClick={openWizard} className="mt-2 text-base shadow-lg">
                      Agende sua sessão estratégica e tire suas dúvidas
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que Organizadores Inteligentes Escolhem o ScribIA?</h2>
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

        {/* Como funciona */}
        <section id="como-funciona" className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Como o ScribIA Funciona Para Organizadores</h2>
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
                          <p className="text-muted-foreground mb-2">{step.description}</p>
                          {step.note && (
                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-lg">
                              <strong>Observação:</strong> {step.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefícios finais */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefícios do ScribIA para Organizadores</h2>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
              {finalBenefits.map((benefit, idx) => {
                const [title, ...descParts] = benefit.split(":")
                const description = descParts.join(":")
                return (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card className="h-full hover:shadow-md transition-all duration-300">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">{title}:</span>
                          <span className="text-muted-foreground">{description}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto text-center">
              <p className="text-xl md:text-2xl mb-6 font-medium">
                Você quer organizar um evento… ou criar uma experiência que continua gerando valor, comunidade e vendas durante o ano inteiro?
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                ✨ Leve o ScribIA para o seu próximo evento. Transforme cada palestra em um ativo vivo da sua marca.
              </p>

              <Button size="lg" onClick={openWizard} className="group px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="flex items-center gap-2">
                  Quero manter meu público engajado com o ScribIA
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
