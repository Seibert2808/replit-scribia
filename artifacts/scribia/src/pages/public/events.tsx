import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { PublicHeader } from '@/components/layout/public-header'
import { Calendar } from 'lucide-react'

interface PublicEvent {
  id: string
  slug: string
  name: string
  start_date: string
  end_date: string
  cover_image_url: string | null
  organizer_id: string
  organizer_slug: string
  organizer_name: string
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const sameDay = start.toDateString() === end.toDateString()
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return sameDay ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: orgsData } = await supabase
        .from('organizer_profiles')
        .select('id, slug, display_name')

      const orgs = (orgsData ?? []) as Array<{ id: string; slug: string; display_name: string }>
      const orgById = Object.fromEntries(orgs.map((o) => [o.id, o]))
      const orgIds = orgs.map((o) => o.id)

      if (orgIds.length === 0) { setEvents([]); setLoading(false); return }

      const { data: listData } = await supabase
        .from('events')
        .select('id, slug, name, start_date, end_date, cover_image_url, organizer_id')
        .eq('status', 'completed')
        .in('organizer_id', orgIds)
        .order('end_date', { ascending: false })

      const list = (listData ?? []) as Array<{
        id: string; slug: string; name: string; start_date: string; end_date: string;
        cover_image_url: string | null; organizer_id: string
      }>

      const enriched: PublicEvent[] = list
        .filter((e) => orgById[e.organizer_id])
        .map((e) => ({
          ...e,
          organizer_slug: orgById[e.organizer_id].slug,
          organizer_name: orgById[e.organizer_id].display_name,
        }))

      setEvents(enriched)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pt-10 md:pt-14 pb-4">
        <h1 className="font-heading text-[28px] sm:text-[34px] md:text-[40px] font-extrabold text-text leading-tight tracking-tight animate-fade-up">
          Eventos
        </h1>
        <p className="text-[13.5px] sm:text-[14.5px] text-text2 mt-2 max-w-2xl leading-relaxed animate-fade-up">
          Palestras transformadas em áudio, transcrição, e-book e playbook — disponíveis para acessar quando quiser.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-bg3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-bg2 border border-dashed border-border-subtle rounded-xl">
            <Calendar className="w-8 h-8 text-text3 mx-auto mb-3" />
            <p className="text-[13px] text-text3">Nenhum evento publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/o/${ev.organizer_slug}/${ev.slug}`}
                className="group bg-bg2 border border-border-subtle rounded-xl overflow-hidden hover:border-border-purple transition-all animate-fade-up"
              >
                <div className="aspect-[16/9] bg-bg3 overflow-hidden relative">
                  {ev.cover_image_url ? (
                    <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple/30 via-purple-dim to-bg3 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-purple-light/60" />
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <div className="text-[11px] text-text3 mb-1.5">{ev.organizer_name}</div>
                  <h3 className="font-heading font-bold text-[15px] text-text leading-snug line-clamp-2">{ev.name}</h3>
                  <div className="flex items-center gap-1.5 mt-3 text-[11.5px] text-text3">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateRange(ev.start_date, ev.end_date)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border-subtle py-8 text-center">
        <div className="text-[11px] text-text3">© {new Date().getFullYear()} Scribia · Do palco ao material pronto em minutos</div>
      </footer>
    </div>
  )
}
