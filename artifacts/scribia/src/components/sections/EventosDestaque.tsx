import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { publicGet } from '@/lib/public-fetch'
import { Calendar, MapPin } from 'lucide-react'

// Extraido de pages/public/events.tsx em 27/10/2026, para a mesma fileira
// de destaques aparecer tambem na landing do palestrante. So o que monta
// a fileira veio junto: o Calendario anual inteiro ficou la, porque so a
// pagina de eventos precisa dele.

interface PublicEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  location: string | null
  cover_image_url: string | null
  site_image_url: string | null
  organizer_name: string
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
  event_id: string | null
}

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

const DEMO_EVENT_ID = 'ea692433-bfa8-483e-b9da-82dda6fc13d1'
const URL_LOGOS = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/community-event-logos`

function soODia(iso: string): string {
  return iso.slice(0, 10)
}

function enderecoDoLogo(caminho: string): string {
  return caminho.startsWith('http') ? caminho : `${URL_LOGOS}/${caminho}`
}

function formatDateLong(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FeaturedCard({ ev, grande = false }: { ev: Destaque; grande?: boolean }) {
  const classe =
    'group relative block rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-purple-light/50 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300'

  const conteudo = (
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
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 58% 46% at 50% 36%, rgba(255,255,255,0.32), transparent 72%)',
            }}
          />
          {ev.logo_url && (
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

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/90 via-black/55 to-transparent"
      />

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

export function EventosDestaque({
  titulo = 'Em destaque: eventos com o ScribIA',
  descricao = 'Os próximos eventos que contam com a plataforma, na ordem em que vão acontecer.',
}: {
  titulo?: string
  descricao?: string
}) {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [doCalendario, setDoCalendario] = useState<EventoDoCalendario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const failsafe = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    async function load() {
      try {
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
            cover_image_url: e.cover_image_url,
            site_image_url: e.site_image_url,
            organizer_name: e.organizer_name ?? '',
          }))
        )

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

  const HOJE = new Date().toISOString().slice(0, 10)

  const noDestaquePelaPlataforma = new Set(
    events.filter((e) => soODia(e.end_date || e.start_date) >= HOJE).map((e) => e.id),
  )

  const destaques: Destaque[] = [
    ...events
      .filter((e) => soODia(e.end_date || e.start_date) >= HOJE)
      .map((e) => ({
        id: e.id,
        name: e.name,
        start_date: soODia(e.start_date),
        location: e.location,
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
        cover_image_url: c.cover_path ? enderecoDoLogo(c.cover_path) : null,
        logo_url: c.logo_path ? enderecoDoLogo(c.logo_path) : null,
        organizer_name: '',
        href: c.url,
        externo: true,
      })),
  ].sort((a, b) => {
    if (a.start_date !== b.start_date) return a.start_date < b.start_date ? -1 : 1
    return a.name.localeCompare(b.name, 'pt-BR')
  })

  return (
    <section>
      <div className="mb-4 animate-fade-up">
        <h2 className="font-heading font-extrabold leading-tight tracking-tight text-2xl sm:text-3xl">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #725EA8, #698DC5)' }}
          >
            {titulo}
          </span>
        </h2>
        <p className="mt-2 text-text2 text-[14px] sm:text-[15px] leading-relaxed max-w-2xl">
          {descricao}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 aspect-[2/1] bg-bg3 rounded-2xl animate-pulse" />
          <div className="sm:col-span-1 aspect-[2/1] bg-bg3 rounded-2xl animate-pulse" />
          <div className="sm:col-span-1 aspect-[2/1] bg-bg3 rounded-2xl animate-pulse" />
        </div>
      ) : destaques.length === 0 ? (
        <div className="text-center py-16 bg-bg2 border border-dashed border-border-subtle rounded-2xl">
          <Calendar className="w-8 h-8 text-text3 mx-auto mb-3" />
          <p className="text-[13px] text-text3">
            Nenhum evento com o ScribIA marcado no calendário por enquanto.
          </p>
        </div>
      ) : destaques.length === 1 ? (
        <div className="animate-fade-up max-w-2xl">
          <FeaturedCard ev={destaques[0]} grande />
        </div>
      ) : destaques.length === 2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {destaques.map((ev) => <FeaturedCard key={ev.id} ev={ev} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          {destaques.map((ev) => <FeaturedCard key={ev.id} ev={ev} />)}
        </div>
      )}
    </section>
  )
}
