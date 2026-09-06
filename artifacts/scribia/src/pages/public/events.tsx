import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { PublicHeader } from '@/components/layout/public-header'
import Footer from '@/components/sections/Footer'
import { publicGet } from '@/lib/public-fetch'
import { DemoRequestDialog } from '@/components/demo-request-dialog'
import CalendarioAnual, { type EventoCalendario } from '@/components/sections/CalendarioAnual'
import { FUNDO_PORTFOLIO } from '@/utils/paleta'
import { Calendar, MapPin, ChevronRight, PlayCircle } from 'lucide-react'

interface PublicEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  location: string | null
  cover_image_url: string | null
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

function FeaturedCard({ ev }: { ev: Destaque }) {
  const classe =
    'group block rounded-2xl overflow-hidden bg-bg2 border border-border-subtle hover:border-border-purple hover:-translate-y-1 hover:shadow-elegant transition-all duration-300'

  const conteudo = (
    <>
      {/* Faixa de altura FIXA. Foto de capa preenche; logo aparece pequeno
          e centrado. Antes o logo era esticado para ocupar o cartao
          inteiro, e logo ampliado nao fica elegante em tamanho nenhum. */}
      <div className="relative h-40 sm:h-44 overflow-hidden">
        {ev.cover_image_url ? (
          <img
            src={ev.cover_image_url}
            alt={ev.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple/45 via-purple-dark/35 to-[#698DC5]/25" />
            {ev.logo_url && (
              <div className="absolute inset-0 flex items-center justify-center p-5">
                <div className="bg-white rounded-xl px-4 py-3 shadow-md">
                  <img
                    src={ev.logo_url}
                    alt={ev.name}
                    className="max-h-[84px] max-w-[190px] object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {ev.organizer_name && (
          <p className="text-[10px] text-text3 uppercase tracking-widest mb-1 truncate">
            {ev.organizer_name}
          </p>
        )}
        <h3 className="font-heading font-bold text-text text-[15px] sm:text-[16px] leading-snug line-clamp-2 group-hover:text-purple-light transition-colors">
          {ev.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="flex items-center gap-1 text-[11.5px] text-text2">
            <Calendar className="w-3 h-3" />
            {formatDateLong(ev.start_date)}
          </span>
          {ev.location && (
            <span className="flex items-center gap-1 text-[11.5px] text-text3">
              <MapPin className="w-3 h-3" />
              {ev.location}
            </span>
          )}
        </div>
      </div>
    </>
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

function getLocalCoverImage(name: string): string | null {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (n.includes('siaparto')) return '/images/siaparto-2025.jpg'
  if (n.includes('pericia') || n.includes('imersa') || n.includes('imersao')) return '/images/imerso-pericia-pratica-2026.jpg'
  return null
}

// Foto da frente P\u00daBLICA (horizontal). Tem prioridade sobre a capa do banco
// (cover_image_url), que \u00e9 vertical e usada pelos cards do app/dashboard.
function getLocalSiteImage(name: string): string | null {
  const n = name.toLowerCase()
  if (n.includes('siaparto')) return '/images/siaparto-2025.png'
  if (n.includes('eneon')) return '/images/eneon-2026.png'
  return null
}

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
  with_scribia: boolean
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
          organizer_id: string; organizer_name: string | null
        }>(`public_events?status=eq.active&id=neq.${DEMO_EVENT_ID}&select=id,name,start_date,end_date,location,cover_image_url,organizer_id,organizer_name&order=end_date.desc`)

        if (!mounted) return
        setEvents(
          list.map((e) => ({
            id: e.id,
            name: e.name,
            start_date: e.start_date,
            end_date: e.end_date,
            location: e.location,
            cover_image_url: getLocalSiteImage(e.name) ?? e.cover_image_url ?? getLocalCoverImage(e.name),
            organizer_name: e.organizer_name ?? '',
          }))
        )

        // A visao ja devolve so o que ainda nao terminou e ja vem ordenada.
        // Serve para duas coisas nesta pagina: os marcados viram destaque, e
        // a lista inteira alimenta o Calendario logo abaixo.
        const calendario = await publicGet<EventoDoCalendario>(
          'public_community_events?select=id,name,event_date,event_end_date,location,url,logo_path,with_scribia',
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
        cover_image_url: e.cover_image_url,
        logo_url: null,
        organizer_name: e.organizer_name,
        href: `/eventos/${e.id}`,
        externo: false,
      })),
    ...doCalendario
      .filter((c) => c.with_scribia)
      .map((c) => ({
        id: c.id,
        name: c.name,
        start_date: c.event_date,
        location: c.location,
        cover_image_url: null,
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
      with_scribia: true,
      interno: true,
    }))

  // Quando o mesmo evento existe nas duas origens, fica o da plataforma:
  // ele tem pagina propria. E o que vai acontecer com o SIAPARTO 2026 no
  // dia em que ele for cadastrado como evento.
  const jaNaPlataforma = new Set(daPlataforma.map((e) => chaveDoNome(e.name)))
  const listaCalendario: EventoCalendario[] = [
    ...daPlataforma,
    ...doCalendario.filter((c) => !jaNaPlataforma.has(chaveDoNome(c.name))),
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pt-8 md:pt-12 pb-20">

        {/* Hero */}
        <section className="mb-10 md:mb-14 animate-fade-up">
          <h1 className="font-heading font-extrabold text-text leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl max-w-4xl">
            Scribia: o ecossistema inteligente que mantém seus eventos{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #725EA8, #698DC5)' }}
            >
              vivos
            </span>
            .
          </h1>
          <p className="mt-4 sm:mt-5 text-text2 text-base sm:text-lg leading-relaxed max-w-3xl">
            Programação, conteúdos, materiais e insights organizados em uma experiência contínua para participantes, palestrantes e organizadores.
          </p>
          <div className="mt-6 sm:mt-7">
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 bg-purple text-white px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-purple-light transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              Quero ver uma demonstração
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
            <div className="sm:col-span-1 aspect-[4/3] bg-bg3 rounded-2xl animate-pulse" />
            <div className="sm:col-span-1 aspect-[4/3] bg-bg3 rounded-2xl animate-pulse" />
            <div className="sm:col-span-1 aspect-[4/3] bg-bg3 rounded-2xl animate-pulse" />
          </div>
        ) : destaques.length === 0 ? (
          <div className="text-center py-16 bg-bg2 border border-dashed border-border-subtle rounded-2xl mb-10">
            <Calendar className="w-8 h-8 text-text3 mx-auto mb-3" />
            <p className="text-[13px] text-text3">
              Nenhum evento com o ScribIA marcado no calendário por enquanto.
            </p>
          </div>
        ) : destaques.length === 1 ? (
          <div className="mb-10 animate-fade-up max-w-sm">
            <FeaturedCard ev={destaques[0]} />
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

        <CalendarioAnual eventos={listaCalendario} carregando={loading} />

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
