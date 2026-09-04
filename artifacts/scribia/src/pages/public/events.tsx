import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { PublicHeader } from '@/components/layout/public-header'
import Footer from '@/components/sections/Footer'
import { publicGet } from '@/lib/public-fetch'
import { DemoRequestDialog } from '@/components/demo-request-dialog'
import CalendarioAnual from '@/components/sections/CalendarioAnual'
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

function FeaturedCard({ ev, large }: { ev: PublicEvent; large?: boolean }) {
  return (
    <Link
      href={`/eventos/${ev.id}`}
      className={`group relative rounded-2xl overflow-hidden block bg-bg3 ${large ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
    >
      {ev.cover_image_url ? (
        <img
          src={ev.cover_image_url}
          alt={ev.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple/70 via-purple-dark/50 to-purple-dim" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">{ev.organizer_name}</p>
        <h3 className={`font-heading font-bold text-white leading-snug drop-shadow line-clamp-2 ${large ? 'text-[20px] sm:text-[22px]' : 'text-[16px] sm:text-[18px]'}`}>
          {ev.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
          <span className="flex items-center gap-1 text-[11px] text-white/75">
            <Calendar className="w-3 h-3" />
            {formatDateLong(ev.start_date)}
          </span>
          {ev.location && (
            <span className="flex items-center gap-1 text-[11px] text-white/65">
              <MapPin className="w-3 h-3" />
              {ev.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function RowCard({ ev }: { ev: PublicEvent }) {
  return (
    <Link
      href={`/eventos/${ev.id}`}
      className="group flex items-center gap-4 bg-bg2 border border-border-subtle rounded-xl p-3 hover:border-border-purple hover:bg-bg3/40 transition-all"
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

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
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
      } catch (_) {
        // silent
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false; clearTimeout(failsafe) }
  }, [])

  const featured = events.slice(0, 3)
  const rest = events.slice(3)

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pt-8 md:pt-12 pb-20">

        {/* Hero */}
        <section className="mb-10 md:mb-14 animate-fade-up">
          <h1 className="font-heading font-extrabold text-text leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl max-w-4xl">
            Scribia: o ecossistema inteligente que mantém seus eventos <span className="text-purple-light">vivos</span>.
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
        <p className="text-[11px] font-semibold text-purple-light uppercase tracking-widest mb-3 animate-fade-up">Em destaque</p>

        {/* Featured grid — Netwoo style */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="sm:col-span-1 aspect-[4/3] bg-bg3 rounded-2xl animate-pulse" />
            <div className="sm:col-span-1 aspect-[4/3] bg-bg3 rounded-2xl animate-pulse" />
            <div className="sm:col-span-1 aspect-[4/3] bg-bg3 rounded-2xl animate-pulse" />
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-20 bg-bg2 border border-dashed border-border-subtle rounded-2xl mb-10">
            <Calendar className="w-8 h-8 text-text3 mx-auto mb-3" />
            <p className="text-[13px] text-text3">Nenhum evento publicado ainda.</p>
          </div>
        ) : featured.length === 1 ? (
          <div className="mb-10 animate-fade-up">
            <FeaturedCard ev={featured[0]} large />
          </div>
        ) : featured.length === 2 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 stagger-children">
            {featured.map((ev) => <FeaturedCard key={ev.id} ev={ev} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 stagger-children">
            {featured.map((ev) => <FeaturedCard key={ev.id} ev={ev} />)}
          </div>
        )}

        {/* Rest of events */}
        {!loading && rest.length > 0 && (
          <div className="animate-fade-up">
            <p className="text-[11px] font-semibold text-text3 uppercase tracking-widest mb-3">Todos os eventos com o ScribIA</p>
            <div className="flex flex-col gap-2">
              {rest.map((ev) => <RowCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
        <CalendarioAnual />
      </main>

      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />

      <Footer />
    </div>
  )
}
