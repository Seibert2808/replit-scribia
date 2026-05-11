import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import Footer from "@/components/sections/Footer"

export default function PatrocinadoresLandingPage() {
  useEffect(() => {
    document.title = "ScribIA — Patrocinadores"
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />

      <main>
        <section className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
            Conecte sua marca às ideias, temas e especialistas que realmente importam para o público.
          </h1>

          <h2 className="text-2xl font-bold mb-4">O Patrocinador que Escolhe o ScribIA</h2>
          <p className="text-muted-foreground mb-4">Você sabe que o maior desafio do patrocínio tradicional é simples: as pessoas veem sua marca, mas raramente se lembram dela.</p>
          <p className="text-muted-foreground mb-4">E você já deve ter se perguntado:</p>
          <ul className="list-disc pl-6 space-y-1 mb-6 text-muted-foreground">
            <li>Como garantir que seu investimento apareça no momento certo, para a pessoa certa?</li>
            <li>Como não depender apenas de banners, totens e estandes?</li>
            <li>Como transformar branding em impacto real e mensurável?</li>
            <li>Como saber quais temas e quais palestrantes geram melhor retorno?</li>
            <li>Como fazer parte da jornada mental do participante — não só da paisagem visual do evento?</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            É para isso que o ScribIA existe: para conectar sua marca ao conteúdo, aos assuntos relevantes e aos especialistas certos, criando visibilidade inteligente e rastreável.
          </p>

          <h2 className="text-2xl font-bold mb-4">Benefícios do ScribIA para Patrocinadores</h2>
          <ul className="list-disc pl-6 space-y-3 mb-8">
            <li>
              <span className="font-semibold">Patrocínio que aparece onde realmente importa: no conteúdo.</span>
              <p className="text-muted-foreground">Sua marca é exibida dentro dos Livebooks — no exato espaço onde os participantes estão buscando informação.</p>
            </li>
            <li>
              <span className="font-semibold">Exposição contextualizada pelo tema da palestra.</span>
              <p className="text-muted-foreground">Se você vende softwares de produtividade, sua marca aparece em Livebooks sobre gestão de tempo ou liderança.</p>
            </li>
            <li>
              <span className="font-semibold">Patrocine um palestrante ou influenciador.</span>
              <p className="text-muted-foreground">Em todo evento que ele participar, seus produtos aparecem nos Livebooks relacionados àquela fala.</p>
            </li>
            <li>
              <span className="font-semibold">Invisibilidade zero: presença estratégica e natural.</span>
              <p className="text-muted-foreground">No final dos Livebooks, em temas relacionados ao seu produto e nos conteúdos de palestrantes patrocinados.</p>
            </li>
            <li>
              <span className="font-semibold">Curadoria de segurança e adequação.</span>
              <p className="text-muted-foreground">Políticas rígidas garantem que sua marca não cause dano, não seja inadequada e respeite regulamentações.</p>
            </li>
            <li>
              <span className="font-semibold">Visibilidade orientada por interesse real.</span>
              <p className="text-muted-foreground">Veja quais temas geram busca, quais Livebooks são mais acessados e onde há maior afinidade com seus produtos.</p>
            </li>
            <li>
              <span className="font-semibold">Dashboard completo de resultados.</span>
              <p className="text-muted-foreground">Acompanhe exibições, temas associados, performance de palestrantes, engajamento por evento, taxa de leitura e cliques.</p>
            </li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">Como Funciona Para Patrocinadores</h2>
          <ol className="list-decimal pl-6 space-y-4 mb-8">
            <li>
              <p className="font-semibold">Você escolhe o formato de patrocínio</p>
              <p className="text-muted-foreground">Evento, Palestra, Tema, Palestrante/Influenciador — ou combinações estratégicas.</p>
            </li>
            <li>
              <p className="font-semibold">Sua marca é integrada aos Livebooks no contexto certo</p>
              <p className="text-muted-foreground">Nada de propaganda genérica: presença exatamente onde faz sentido para o leitor.</p>
            </li>
            <li>
              <p className="font-semibold">O participante vê seu produto no exato momento de interesse</p>
              <p className="text-muted-foreground">Usuários que buscam temas do seu nicho recebem sugestões alinhadas — marketing de contexto real.</p>
            </li>
            <li>
              <p className="font-semibold">Métricas em tempo real</p>
              <p className="text-muted-foreground">Acompanhe performance e otimize reinvestimentos com base em dados.</p>
            </li>
          </ol>

          <h2 className="text-2xl font-bold mb-4">Por que Patrocinadores Escolhem o ScribIA?</h2>
          <ul className="list-disc pl-6 space-y-1 mb-8 text-muted-foreground">
            <li>coloca a marca no conteúdo,</li>
            <li>no momento certo,</li>
            <li>para a pessoa com interesse real,</li>
            <li>com dados de retorno precisos,</li>
            <li>e com total segurança e curadoria.</li>
          </ul>

          <p className="mb-2 font-semibold">🟩 Patrocine com inteligência, não com esperança.</p>
          <p className="mb-6"><strong>Seja visto onde o interesse acontece.</strong><br />
          <strong>Seja lembrado pelo contexto certo.</strong><br />
          <strong>Seja encontrado por quem realmente importa.</strong></p>

          <div className="mt-4">
            <Button size="lg" className="bg-primary text-primary-foreground" asChild>
              <a href="/sobre#contato">Quero patrocinar com contexto e métricas</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
