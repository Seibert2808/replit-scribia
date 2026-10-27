import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import Footer from "@/components/sections/Footer"
import { LeadWizardDialog } from "@/components/lead-wizard-dialog"
import { FUNDO_PORTFOLIO, GRADIENTE_MARCA_CLARO } from "@/utils/paleta"
import palestraRetrato from "@/assets/images/Nicolai_Site.png"
import palestraPalco from "@/assets/images/palestrante-palco.jpeg"
import {
  Sparkles,
  Mic,
  QrCode,
  BookOpen,
  Users,
  ChevronRight,
  Flame,
  Check,
} from "lucide-react"

/**
 * Landing do palestrante.
 *
 * ⚠️ REESCRITA EM 27/10/2026, por pedido dela, e o que mudou nao foi so
 * a cor:
 *
 * 1. FUNDO ESCURO. A pagina tinha um hero lilas claro chapado
 *    (#b9b4d4) que nao existe na paleta. Agora usa FUNDO_PORTFOLIO,
 *    o mesmo da aba de eventos e do portfolio comercial.
 * 2. PRECO. A pagina nao dizia quanto custa, em lugar nenhum, e a
 *    unica saida era o formulario. Agora o modelo esta escrito:
 *    parte fixa por palestra + valor por lead em faixas marginais.
 * 3. O PASSO 1 ESTAVA ERRADO. Dizia "seu publico envia o audio da sua
 *    fala", o que nunca foi verdade. Quem grava e a organizacao, ou o
 *    proprio palestrante em app.scribia.io/enviar-audio.
 * 4. "Livebook" em maiuscula virou "livebook": e substantivo comum.
 */

const perguntas = [
  "Quem ainda lembra do que você ensinou, duas semanas depois do evento?",
  "O que sobrou da sua fala, além das fotos e do crachá?",
  "Quantas pessoas da plateia você consegue nomear hoje?",
  "Como provar, numa proposta, o que você entregou no palco?",
]

const entregas = [
  {
    icon: BookOpen,
    titulo: "O livebook da sua palestra",
    texto:
      "A sua fala vira material escrito e organizado, com os destaques e a sua bio, e fica com quem assistiu. É o que você manda para quem pediu o conteúdo.",
  },
  {
    icon: Sparkles,
    titulo: "Cards com a sua frase",
    texto:
      "A frase que você escolher vira arte para redes sociais, com a sua foto e o seu nome. Divulgação pronta, que você não precisou produzir.",
  },
  {
    icon: Users,
    titulo: "A lista de quem te procurou",
    texto:
      "Nome e contato de quem entrou na sua palestra e autorizou a identificação, com o que cada pessoa abriu do seu material.",
  },
  {
    icon: Flame,
    titulo: "A temperatura de cada pessoa",
    texto:
      "Quente, morno ou frio, conforme o quanto a pessoa já consumiu do seu conteúdo, somando todas as suas palestras no ScribIA.",
  },
  {
    icon: QrCode,
    titulo: "Um QR Code que é seu",
    texto:
      "Na tela, no slide final ou impresso. É por ele que a plateia entra, e é por ele que você sabe quem entrou.",
  },
  {
    icon: Mic,
    titulo: "O seu acervo, evento após evento",
    texto:
      "Cada palestra se soma às anteriores. Quem acompanhou duas delas aparece como uma pessoa só, com o interesse acumulado.",
  },
]

const passos = [
  {
    titulo: "O áudio da palestra é gravado",
    texto:
      "Em geral pela organização do evento. Se você gravou por conta própria, no celular ou pela mesa de som, envia o arquivo você mesmo em app.scribia.io/enviar-audio.",
  },
  {
    titulo: "O ScribIA monta o material",
    texto:
      "Livebook, resumo, cards e a página da sua palestra, com os seus dados do jeito que você cadastrou.",
  },
  {
    titulo: "A plateia entra pelo QR Code",
    texto:
      "Cada pessoa que entra é um lead seu. Ela acessa o material quando quiser, e continua acessando depois do evento.",
  },
  {
    titulo: "Você vê quem engajou, e fala com quem autorizou",
    texto:
      "O painel mostra o que cada pessoa abriu, ordena pelos mais quentes e entrega o contato de quem liberou.",
  },
]

const faixas = [
  { quando: "Os primeiros 100 leads", valor: "R$ 6,00" },
  { quando: "Do 101º ao 500º lead", valor: "R$ 5,80" },
  { quando: "Do 501º em diante", valor: "R$ 5,50" },
]

// Exemplos no tamanho dos eventos que existem de verdade. A peca
// comercial traz um exemplo de 600 leads, que da R$ 3.570 e esta uma
// ordem de grandeza acima da realidade medida: a palestra com mais
// acessos que ja existiu teve 71. Numero que o palestrante nao reconhece
// quebra a confianca no resto da pagina.
const exemplos = [
  { leads: "30 leads", conta: "R$ 100 + 30 × R$ 6,00", total: "R$ 280" },
  { leads: "70 leads", conta: "R$ 100 + 70 × R$ 6,00", total: "R$ 520" },
  { leads: "150 leads", conta: "R$ 100 + 100 × R$ 6,00 + 50 × R$ 5,80", total: "R$ 990" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function PalestrantesLandingPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    document.title = "ScribIA — Para palestrantes"
  }, [])

  const abrirWizard = () => setWizardOpen(true)

  return (
    <div style={FUNDO_PORTFOLIO} className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main>
        {/* ---------------------------------------------------------- hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-14 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  PARA PALESTRANTES
                </span>

                <h1 className="mt-5 text-3xl font-extrabold leading-[1.15] md:text-[2.7rem]">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: GRADIENTE_MARCA_CLARO }}
                  >
                    A sua palestra continua trabalhando
                  </span>{" "}
                  depois que você desce do palco.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  O ScribIA é a memória do evento. A sua fala vira livebook, resumo e cards que
                  ficam com quem assistiu, e cada pessoa que entra pelo seu QR Code vira um lead
                  seu, com nome, contato e o que ela leu.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#planos">
                    <Button size="lg" className="group px-7 py-5 text-base font-semibold">
                      <span className="flex items-center gap-2">
                        Ver os planos
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Button>
                  </a>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={abrirWizard}
                    className="px-7 py-5 text-base font-semibold"
                  >
                    Falar com o ScribIA
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-border">
                  <img
                    src={palestraPalco}
                    alt="Palestrante no palco"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="aspect-[3/4] translate-y-6 overflow-hidden rounded-2xl border border-border">
                  <img
                    src={palestraRetrato}
                    alt="Palestrante em destaque"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- perguntas */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-8 py-16">
            <h2 className="text-center text-2xl font-extrabold md:text-3xl">
              O evento acaba. E aí?
            </h2>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-9 grid gap-4 md:grid-cols-2"
            >
              {perguntas.map((pergunta) => (
                <motion.p
                  key={pergunta}
                  variants={itemVariants}
                  className="rounded-xl border border-border bg-card px-6 py-5 text-[15px] leading-relaxed text-muted-foreground"
                >
                  {pergunta}
                </motion.p>
              ))}
            </motion.div>

            <p className="mx-auto mt-9 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
              O que você falou não precisa terminar com os aplausos. É disso que o ScribIA cuida.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- entregas */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-16">
            <h2 className="text-center text-2xl font-extrabold md:text-3xl">
              O que você recebe de cada palestra
            </h2>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {entregas.map((entrega) => (
                <motion.div
                  key={entrega.titulo}
                  variants={itemVariants}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background">
                    <entrega.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-bold">{entrega.titulo}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{entrega.texto}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ---------------------------------------------------- como funciona */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-4xl px-4 sm:px-8 py-16">
            <h2 className="text-center text-2xl font-extrabold md:text-3xl">Como funciona</h2>

            <div className="mt-10 space-y-4">
              {passos.map((passo, i) => (
                <motion.div
                  key={passo.titulo}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-5 rounded-2xl border border-border bg-card p-6"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundImage: GRADIENTE_MARCA_CLARO }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{passo.titulo}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {passo.texto}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ leads */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-8 py-16">
            <h2 className="text-center text-2xl font-extrabold md:text-3xl">
              Lead aqui é quem entrou na sua palestra
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
              Não é quem passou pelo evento, nem quem viu o seu nome na programação: é quem abriu a
              sua palestra pelo QR Code ou pelo link. Você recebe todos, e o painel diz o quanto
              cada um já consumiu do seu conteúdo.
            </p>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[
                {
                  nome: "Quente",
                  texto: "Consumiu dois materiais seus ou mais. Já sabe do que você falou.",
                },
                {
                  nome: "Morno",
                  texto: "Consumiu um material inteiro, ou boa parte do áudio.",
                },
                {
                  nome: "Frio",
                  texto: "Entrou e quase não tocou em nada. É onde uma mensagem sua rende mais.",
                },
              ].map((faixa) => (
                <div key={faixa.nome} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-2 text-base font-bold">{faixa.nome}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{faixa.texto}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
              Nome e contato aparecem de quem autorizou, no termo do evento. Quem não autorizou
              continua contando no engajamento, sem identificação.
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------- planos */}
        <section id="planos" className="border-b border-border scroll-mt-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-8 py-16">
            <h2 className="text-center text-2xl font-extrabold md:text-3xl">
              Quanto custa
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
              Uma parte fixa por palestra e um valor por lead captado. Se a sua palestra trouxer
              pouca gente, você paga pouco.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-[1fr_1.1fr]">
              <div
                className="rounded-2xl p-7 text-white"
                style={{ backgroundImage: GRADIENTE_MARCA_CLARO }}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                  Por palestra
                </p>
                <p className="mt-2 text-4xl font-extrabold">R$ 100</p>
                <p className="mt-3 text-sm leading-relaxed text-white/90">
                  A parte fixa, que cobre o material da sua fala: livebook, resumo, cards e a
                  página da palestra com o seu QR Code.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-7">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Mais, por lead captado
                </p>
                <ul className="mt-4 space-y-3">
                  {faixas.map((faixa) => (
                    <li
                      key={faixa.quando}
                      className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">{faixa.quando}</span>
                      <span className="text-base font-bold text-primary">{faixa.valor}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  As faixas são marginais: os primeiros 100 leads saem a R$ 6,00 mesmo que você
                  passe de 500.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-7">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Na prática
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {exemplos.map((exemplo) => (
                  <div key={exemplo.leads} className="rounded-xl border border-border p-5">
                    <p className="text-sm font-bold">{exemplo.leads}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{exemplo.conta}</p>
                    <p className="mt-3 text-2xl font-extrabold text-primary">{exemplo.total}</p>
                  </div>
                ))}
              </div>
            </div>

            <ul className="mx-auto mt-7 max-w-2xl space-y-2.5">
              {[
                "Você só paga pelos leads que a sua palestra trouxer.",
                "O material fica disponível para quem entrou, e continua rendendo depois do evento.",
                "A conta fecha depois do evento, com a contagem na mão.",
              ].map((linha) => (
                <li key={linha} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {linha}
                </li>
              ))}
            </ul>

            <p className="mt-7 text-center text-xs text-muted-foreground">
              Valores vigentes em outubro de 2026.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- cta final */}
        <section>
          <div className="mx-auto max-w-3xl px-4 sm:px-8 py-20 text-center">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              Leve o ScribIA para a sua próxima palestra
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Conte em qual evento você vai falar e a gente responde com o que dá para fazer, e em
              quanto tempo.
            </p>
            <Button
              size="lg"
              onClick={abrirWizard}
              className="group mt-8 px-8 py-6 text-base font-semibold"
            >
              <span className="flex items-center gap-2">
                Falar com o ScribIA
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      <LeadWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}
