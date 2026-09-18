import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { PublicHeader } from '@/components/layout/public-header'
import Footer from '@/components/sections/Footer'
import { publicGet } from '@/lib/public-fetch'
import { DemoRequestDialog } from '@/components/demo-request-dialog'
import CalendarioAnual, { type EventoCalendario } from '@/components/sections/CalendarioAnual'
import { FUNDO_PORTFOLIO } from '@/utils/paleta'
import { Calendar, MapPin, ChevronRight, PlayCircle, Search, Megaphone } from 'lucide-react'

interface PublicEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  location: string | null
  // Duas imagens, e nao uma. A vertical alimenta a miniatura da lista de
  // eventos passados; a horizontal alimenta o destaque 2:1 la em cima.
  // Antes existia so um campo, e a horizontal era enfiada nele: por isso
  // a miniatura da lista acabava mostrando a imagem do site.
  cover_image_url: string | null
  site_image_url: string | null
  organizer_name: string
}

function formatDateLong(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Um destaque pode vir de dois lugares: evento da plataforma, que tem
// capa e pagina propria, ou evento do Calendario marcado como "tem
// ScribIA", que so tem logo e aponta para o site do organizador. O
// cartao aceita os dois para a fileira nao ficar desalinhada.
interface Destaque {
  id: string
  name: string
  start_date: string
  location: string | null
  cover_image_url: string | null
  logo_url: string | null
  organizer_name: string
  href: string
  externo: boolean
}

// O destaque NAO e um cartao: e a imagem do evento, com o texto por cima
// dela. O formato antigo tinha duas coisas que pesavam na tela indigo: uma
// moldura cheia (borda + bloco solido de texto embaixo da foto) e, quando o
// evento so tinha logo, uma CAIXA BRANCA em volta do logo. Aqui a foto
// sangra ate a borda, o texto vive sobre um veu escuro e o que sobra de
// moldura e um fio de 1px.
function FeaturedCard({ ev, grande = false }: { ev: Destaque; grande?: boolean }) {
  const classe =
    'group relative block rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-purple-light/50 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300'

  const conteudo = (
    // Proporcao 2:1 em todas as larguras, que e a mesma da capa pedida no
    // painel (1200 x 600). Mudar a proporcao no mobile cortaria a arte que
    // o organizador mandou.
    <div className="relative aspect-[2/1] overflow-hidden">
      {ev.cover_image_url ? (
        <img
          src={ev.cover_image_url}
          alt={ev.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-purple/60 via-purple-dark/45 to-[#698DC5]/35" />
          {/* No lugar da caixa branca, um halo sem borda. Resolve o mesmo
              problema que ela resolvia (logo de tinta escura sumir no
              fundo) sem desenhar um retangulo no meio da pagina. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 58% 46% at 50% 36%, rgba(255,255,255,0.32), transparent 72%)',
            }}
          />
          {ev.logo_url && (
            // Fica na metade de cima: a de baixo pertence ao texto.
            <div className="absolute inset-x-0 top-0 bottom-[42%] flex items-center justify-center p-5">
              <img
                src={ev.logo_url}
                alt={ev.name}
                className="max-h-full max-w-[72%] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.28)] transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
          )}
        </>
      )}

      {/* Veu. O texto passa a ficar sobre imagem de cor desconhecida, entao
          a legibilidade nao pode depender da arte que subiram. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/90 via-black/55 to-transparent"
      />

      {/* Cores fixas, e nao as variaveis de tema: aqui embaixo o fundo e
          sempre escuro por causa do veu. */}
      <div className={`absolute inset-x-0 bottom-0 ${grande ? 'p-5 sm:p-7' : 'p-4 sm:p-5'}`}>
        {ev.organizer_name && (
          <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 truncate">
            {ev.organizer_name}
          </p>
        )}
        <h3
          className={`font-heading font-bold text-white leading-snug line-clamp-2 drop-shadow-sm ${
            grande ? 'text-[19px] sm:text-[26px]' : 'text-[15px] sm:text-[17px]'
          }`}
        >
          {ev.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className={`flex items-center gap-1 text-white/85 ${grande ? 'text-[12.5px] sm:text-[13.5px]' : 'text-[11.5px]'}`}>
            <Calendar className="w-3 h-3 shrink-0" />
            {formatDateLong(ev.start_date)}
          </span>
          {ev.location && (
            <span className={`flex items-center gap-1 text-white/70 min-w-0 ${grande ? 'text-[12.5px] sm:text-[13.5px]' : 'text-[11.5px]'}`}>
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{ev.location}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (ev.externo) {
    return (
      <a href={ev.href} target="_blank" rel="noopener noreferrer" className={classe}>
        {conteudo}
      </a>
    )
  }
  return (
    <Link href={ev.href} className={classe}>
      {conteudo}
    </Link>
  )
}

function RowCard({ ev }: { ev: PublicEvent }) {
  return (
    <Link
      href={`/eventos/${ev.id}`}
      className="group flex items-center gap-4 bg-bg2 border border-border-subtle rounded-xl p-3 hover:border-border-purple hover:bg-bg3/40 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-bg3">
        {ev.cover_image_url ? (
          <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple/40 to-purple-dim" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[14px] text-text group-hover:text-purple-light transition-colors truncate">{ev.name}</p>
        <p className="text-[11.5px] text-text3 mt-0.5">{formatDateLong(ev.start_date)}{ev.location ? ` · ${ev.location}` : ''}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-text3 group-hover:text-purple-light group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  )
}

// Evento de demonstração interno do Scribia: acessível por link direto
// (participantes cadastrados entram nele), mas NÃO listado na vitrine pública.
const DEMO_EVENT_ID = 'ea692433-bfa8-483e-b9da-82dda6fc13d1'

// REMENDO REMOVIDO em 16/09/2026. Aqui existia tambem getLocalCoverImage(),
// irma da funcao descrita abaixo: devolvia um arquivo VERTICAL fixo para a
// miniatura da lista, procurando "siaparto", "pericia" ou "imersao" no nome
// do evento.
//
// Saiu pelo mesmo motivo, e nao porque incomodava: casar por NOME faz um
// evento novo herdar em silencio a imagem de um antigo so por se chamar
// parecido. Na hora da remocao os 6 eventos tinham imagem no banco, entao
// ela nao cobria mais nada. Quem responde e events.cover_image_url, a
// "Imagem do card"; sem ela, a miniatura cai no gradiente da marca.

// REMENDO REMOVIDO em 16/09/2026. Aqui existia getLocalSiteImage(), que
// devolvia um arquivo horizontal fixo procurando "siaparto" ou "eneon" no
// NOME do evento. Era o jeito de ter imagem horizontal enquanto o banco so
// guardava a vertical.
//
// Saiu por ser uma armadilha, nao so por ter virado superfluo: casando por
// nome, o SIAPARTO 2026 - que ja existe em rascunho - herdaria em silencio
// a arte de 2025 no dia em que fosse ativado.
//
// Quem responde por isso agora e events.site_image_url, enviada em
// "Imagem para o site" no painel de Identidade Visual do evento.

// Data pura AAAA-MM-DD. As datas de public_events vem com hora e fuso, e
// as do Calendario vem sem, entao tudo e cortado no dia para as duas
// origens poderem ser comparadas e ordenadas juntas.
function soODia(iso: string): string {
  return iso.slice(0, 10)
}

const HOJE = new Date().toISOString().slice(0, 10)

// Cronologica e, no empate, alfabetica. O empate acontece de verdade:
// congresso costuma comecar em dia de semana redondo, e dois eventos na
// mesma data sem criterio de desempate trocam de lugar a cada carga.
function porDataDepoisNome<T extends { start_date: string; name: string }>(a: T, b: T): number {
  if (a.start_date !== b.start_date) return a.start_date < b.start_date ? -1 : 1
  return a.name.localeCompare(b.name, 'pt-BR')
}

interface EventoDoCalendario {
  id: string
  name: string
  event_date: string
  event_end_date: string | null
  location: string | null
  url: string
  logo_path: string | null
  cover_path: string | null
  with_scribia: boolean
  // Evento correspondente na plataforma, quando o painel ligou os dois.
  // E por ele, e nao pelo nome, que as duas origens se reconhecem.
  event_id: string | null
}

// Para casar o mesmo evento vindo das duas origens. Sem acento e sem
// caixa, porque o nome digitado no calendario raramente bate letra por
// letra com o nome cadastrado na plataforma.
function chaveDoNome(nome: string): string {
  return nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

const URL_LOGOS = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/community-event-logos`

function enderecoDoLogo(caminho: string): string {
  return caminho.startsWith('http') ? caminho : `${URL_LOGOS}/${caminho}`
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [doCalendario, setDoCalendario] = useState<EventoDoCalendario[]>([])
  const [loading, setLoading] = useState(true)
  const [demoOpen, setDemoOpen] = useState(false)
  const [formCadastro, setFormCadastro] = useState(false)

  function irParaOCalendario() {
    document.getElementById('calendario')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Abre o formulario que fica DENTRO da secao do calendario e leva a
  // pessoa ate la. Abrir sem rolar deixaria a caixa aberta fora da tela,
  // e daria a impressao de que o botao nao fez nada.
  function divulgarEvento() {
    setFormCadastro(true)
    setTimeout(irParaOCalendario, 50)
  }

  useEffect(() => {
    let mounted = true
    const failsafe = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    async function load() {
      try {
        // public_events e a visao de leitura publica: so eventos active e
        // completed, e so colunas divulgaveis. O nome do organizador vem
        // embutido, entao some a segunda consulta em user_profiles, que era
        // justamente a tabela com os 1.074 cadastros.
        const list = await publicGet<{
          id: string; name: string; start_date: string; end_date: string
          location: string | null; cover_image_url: string | null
          site_image_url: string | null
          organizer_id: string; organizer_name: string | null
        }>(`public_events?status=eq.active&id=neq.${DEMO_EVENT_ID}&select=id,name,start_date,end_date,location,cover_image_url,site_image_url,organizer_id,organizer_name&order=end_date.desc`)

        if (!mounted) return
        setEvents(
          list.map((e) => ({
            id: e.id,
            name: e.name,
            start_date: e.start_date,
            end_date: e.end_date,
            location: e.location,
            // Cada imagem no seu lugar: a vertical na miniatura da lista,
            // a horizontal no destaque. As duas vem do banco.
            cover_image_url: e.cover_image_url,
            site_image_url: e.site_image_url,
            organizer_name: e.organizer_name ?? '',
          }))
        )

        // A visao ja devolve so o que ainda nao terminou e ja vem ordenada.
        // Serve para duas coisas nesta pagina: os marcados viram destaque, e
        // a lista inteira alimenta o Calendario logo abaixo.
        const calendario = await publicGet<EventoDoCalendario>(
          'public_community_events?select=id,name,event_date,event_end_date,location,url,logo_path,cover_path,with_scribia,event_id',
        )
        if (!mounted) return
        setDoCalendario(calendario)
      } catch (_) {
        // silent
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false; clearTimeout(failsafe) }
  }, [])

  // Eventos da plataforma que ja estao no destaque. A entrada do
  // Calendario ligada a um deles NAO entra de novo: seria o mesmo evento
  // duas vezes, lado a lado, hoje ate com a mesma arte, ja que a capa do
  // cartao vem justamente do evento ligado.
  const noDestaquePelaPlataforma = new Set(
    events.filter((e) => soODia(e.end_date || e.start_date) >= HOJE).map((e) => e.id),
  )

  // O destaque e so o que ainda vai acontecer, das duas origens. Evento
  // da plataforma tem pagina propria; evento do Calendario marcado com
  // ScribIA aponta para o site do organizador, porque a pagina no ScribIA
  // ainda nao existe.
  const destaques: Destaque[] = [
    ...events
      .filter((e) => soODia(e.end_date || e.start_date) >= HOJE)
      .map((e) => ({
        id: e.id,
        name: e.name,
        start_date: soODia(e.start_date),
        location: e.location,
        // A HORIZONTAL, e nao a do card. A vertical entrando aqui seria
        // recortada no meio pelo 2:1 e comeria o titulo da arte.
        cover_image_url: e.site_image_url,
        logo_url: null,
        organizer_name: e.organizer_name,
        href: `/eventos/${e.id}`,
        externo: false,
      })),
    ...doCalendario
      .filter((c) => c.with_scribia && !(c.event_id && noDestaquePelaPlataforma.has(c.event_id)))
      .map((c) => ({
        id: c.id,
        name: c.name,
        start_date: c.event_date,
        location: c.location,
        // A capa vem de graca quando existe. Sem ela o cartao cai no
        // logo sobre o gradiente, que continua funcionando.
        cover_image_url: c.cover_path ? enderecoDoLogo(c.cover_path) : null,
        logo_url: c.logo_path ? enderecoDoLogo(c.logo_path) : null,
        organizer_name: '',
        href: c.url,
        externo: true,
      })),
  ].sort(porDataDepoisNome)

  // O calendario mostra TUDO que ainda vai acontecer, com ou sem ScribIA.
  // Evento nosso entra apontando para a pagina dele aqui, e nao para o
  // site do organizador: quem procura no calendario um evento com ScribIA
  // quer chegar no material.
  const daPlataforma: EventoCalendario[] = events
    .filter((e) => soODia(e.end_date || e.start_date) >= HOJE)
    .map((e) => ({
      id: e.id,
      name: e.name,
      event_date: soODia(e.start_date),
      event_end_date: e.end_date ? soODia(e.end_date) : null,
      location: e.location,
      url: `/eventos/${e.id}`,
      logo_path: null,
      cover_path: null,
      with_scribia: true,
      interno: true,
    }))

  // Quando o mesmo evento existe nas duas origens, aqui embaixo fica o do
  // CALENDARIO, e nao o da plataforma. Parece o contrario do esperado e
  // nao e: o evento com ScribIA ja aparece no destaque logo acima, com a
  // arte grande e o caminho para a pagina dele aqui. O que falta na tela,
  // e so o Calendario tem, e o endereco de INSCRICAO do organizador.
  // Mantendo a linha da plataforma, esse link sumiria do site inteiro.
  const vinculados = new Set(
    doCalendario.map((c) => c.event_id).filter((id): id is string => Boolean(id)),
  )
  // O nome continua valendo como segunda rede, para o caso de alguem
  // cadastrar no Calendario um evento que ja existe na plataforma e nao
  // ligar os dois no painel.
  const nomesDoCalendario = new Set(doCalendario.map((c) => chaveDoNome(c.name)))
  const listaCalendario: EventoCalendario[] = [
    ...daPlataforma.filter(
      (e) => !vinculados.has(e.id) && !nomesDoCalendario.has(chaveDoNome(e.name)),
    ),
    ...doCalendario,
  ].sort((a, b) => {
    if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1
    return a.name.localeCompare(b.name, 'pt-BR')
  })

  // A lista de baixo e historico: o que ja aconteceu com o ScribIA. Do
  // mais recente para o mais antigo, que e como se le portfolio.
  const passados = events
    .filter((e) => soODia(e.end_date || e.start_date) < HOJE)
    .sort((a, b) => (a.end_date < b.end_date ? 1 : -1))

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      {/* Brilho decorativo com o gradiente da marca. aria-hidden porque e
          enfeite: leitor de tela nao deve anunciar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] opacity-[0.18] blur-[110px]"
        style={{ background: 'radial-gradient(ellipse at center, #725EA8 0%, #698DC5 45%, transparent 70%)' }}
      />
      <PublicHeader />

      <div style={FUNDO_PORTFOLIO} className="bg-bg text-text">
      <main className="container mx-auto px-4 pt-8 md:pt-12 pb-20">

        {/* Hero */}
        <section className="mb-10 md:mb-14 animate-fade-up text-center">
          <h1 className="font-heading font-extrabold text-text leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl max-w-4xl mx-auto">
            Scribia: o ecossistema inteligente que mantém eventos{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #725EA8, #698DC5)' }}
            >
              vivos
            </span>
            .
          </h1>
          <p className="mt-4 sm:mt-5 text-text2 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Programação, conteúdos, materiais e insights organizados em uma experiência contínua para participantes, palestrantes e organizadores.
          </p>
          {/* Tres publicos, tres botoes. O primeiro e cheio porque esta
              pagina existe primeiro para quem PROCURA evento; os outros
              dois falam com quem organiza. */}
          <div className="mt-6 sm:mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={irParaOCalendario}
              className="inline-flex items-center gap-2 bg-purple text-white px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-purple-light transition-all"
            >
              <Search className="w-4 h-4" />
              Encontre eventos da sua área
            </button>
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 border border-border-purple text-text px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-purple/10 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              Demonstração do ScribIA para Eventos
            </button>
            <button
              type="button"
              onClick={divulgarEvento}
              className="inline-flex items-center gap-2 border border-border-subtle text-text2 px-5 py-2.5 rounded-lg text-[14px] font-medium hover:border-border-purple hover:text-text transition-all"
            >
              <Megaphone className="w-4 h-4" />
              Divulgue seu evento
            </button>
          </div>
        </section>

        {/* Section label */}
        <p className="text-[11px] font-semibold text-purple-light uppercase tracking-widest mb-1 animate-fade-up">
          Em destaque: eventos com o ScribIA
        </p>
        <p className="text-[13px] text-text3 mb-4 animate-fade-up">
          Os próximos eventos que contam com a plataforma, na ordem em que vão acontecer.
        </p>

        {/* Featured grid — Netwoo style */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="sm:col-span-1 aspect-[2/1] bg-bg3 rounded-2xl animate-pulse" />
            <div className="sm:col-span-1 aspect-[2/1] bg-bg3 rounded-2xl animate-pulse" />
            <div className="sm:col-span-1 aspect-[2/1] bg-bg3 rounded-2xl animate-pulse" />
          </div>
        ) : destaques.length === 0 ? (
          <div className="text-center py-16 bg-bg2 border border-dashed border-border-subtle rounded-2xl mb-10">
            <Calendar className="w-8 h-8 text-text3 mx-auto mb-3" />
            <p className="text-[13px] text-text3">
              Nenhum evento com o ScribIA marcado no calendário por enquanto.
            </p>
          </div>
        ) : destaques.length === 1 ? (
          // Um destaque sozinho ganha largura de verdade, em vez de virar um
          // selo perdido na esquerda. O teto existe porque 2:1 na largura
          // inteira da pagina passaria de 500px de altura no desktop.
          <div className="mb-10 animate-fade-up max-w-2xl">
            <FeaturedCard ev={destaques[0]} grande />
          </div>
        ) : destaques.length === 2 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 stagger-children">
            {destaques.map((ev) => <FeaturedCard key={ev.id} ev={ev} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 stagger-children">
            {destaques.map((ev) => <FeaturedCard key={ev.id} ev={ev} />)}
          </div>
        )}

        <CalendarioAnual
          eventos={listaCalendario}
          carregando={loading}
          formAberto={formCadastro}
          aoAlternarForm={setFormCadastro}
        />

        {/* A lista completa vai por ultimo: e referencia para quem ja
            conhece, enquanto o Calendario acima e o que traz visita nova.
            Mesma separacao visual da secao anterior, senao as duas colam. */}
        {!loading && passados.length > 0 && (
          <div className="animate-fade-up mt-14 md:mt-20 pt-10 md:pt-14 border-t border-border-subtle">
            <p className="text-[11px] font-semibold text-text3 uppercase tracking-widest mb-1">Eventos que já aconteceram com o ScribIA</p>
            <p className="text-[12.5px] text-text3 mb-3">
              O conteúdo destes eventos continua disponível para quem participou.
            </p>
            <div className="flex flex-col gap-2">
              {passados.map((ev) => <RowCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
      </main>

      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />

      <Footer />
      </div>
    </div>
  )
}
