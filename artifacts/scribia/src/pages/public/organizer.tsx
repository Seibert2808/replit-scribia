import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { PublicHeader } from '@/components/layout/public-header'
import Footer from '@/components/sections/Footer'
import { Calendar, ChevronLeft, ArrowRight } from 'lucide-react'

interface OrganizerProfile {
  id: string
  slug: string
  display_name: string
  description: string | null
  logo_url: string | null
  brand_color: string | null
}

interface OrganizerEvent {
  id: string
  slug: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  cover_image_url: string | null
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const sameDay = start.toDateString() === end.toDateString()
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return sameDay ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

export default function PublicOrganizerPage({ params }: { params: { orgSlug: string } }) {
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null)
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: org } = await supabase
        .from('organizer_profiles')
        .select('id, slug, display_name, description, logo_url, brand_color')
        .eq('slug', params.orgSlug)
        .maybeSingle()

      if (!org) { setNotFound(true); setLoading(false); return }
      const o = org as OrganizerProfile
      setOrganizer(o)

      const { data: evs } = await supabase
        .from('events')
        .select('id, slug, name, description, start_date, end_date, cover_image_url')
        .in('status', ['active', 'completed'])
        .eq('organizer_id', o.id)
        .order('end_date', { ascending: false })
      setEvents((evs ?? []) as OrganizerEvent[])
      setLoading(false)
    }
    load()
  }, [params.orgSlug])

  if (notFound) return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Organizador não encontrado</h1>
        <p className="text-[13px] text-text3 mb-6">Não conseguimos achar o organizador <code className="text-purple-light">{params.orgSlug}</code>.</p>
        <Link href="/" className="inline-flex items-center gap-1 text-[13px] text-purple-light hover:text-purple transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar para a home
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Organizer hero */}
      <section className="border-b border-border-subtle bg-bg2/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14">
          <Link href="/organizadores" className="inline-flex items-center gap-1 text-[12px] text-text3 hover:text-purple-light transition-colors mb-5">
            <ChevronLeft className="w-3.5 h-3.5" /> Todos os organizadores
          </Link>
          {loading || !organizer ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-bg3 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-64 bg-bg3 rounded animate-pulse" />
                <div className="h-4 w-96 bg-bg3 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 animate-fade-up">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-purple-dim border border-border-purple flex items-center justify-center font-heading font-bold text-2xl sm:text-3xl text-purple-light shrink-0 overflow-hidden"
                style={organizer.brand_color ? { borderColor: `${organizer.brand_color}55` } : undefined}
              >
                {organizer.logo_url ? (
                  <img src={organizer.logo_url} alt={organizer.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{organizer.display_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="font-heading text-[26px] sm:text-[32px] font-extrabold text-text leading-tight">{organizer.display_name}</h1>
                {organizer.description && (
                  <p className="text-[13.5px] text-text2 mt-2 max-w-2xl leading-relaxed">{organizer.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-text">Eventos</h2>
            <p className="text-[12.5px] text-text3 mt-0.5">
              {events.length > 0
                ? `${events.length} ${events.length === 1 ? 'evento' : 'eventos'} publicados`
                : 'Sem eventos publicados ainda'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-bg3 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-bg2 border border-dashed border-border-subtle rounded-xl">
            <Calendar className="w-8 h-8 text-text3 mx-auto mb-3" />
            <p className="text-[13px] text-text3">Nenhum evento publicado por este organizador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/eventos/${ev.id}`}
                className="group bg-bg2 border border-border-subtle rounded-xl overflow-hidden hover:border-border-purple transition-all animate-fade-up"
              >
                <div className="aspect-[16/9] bg-bg3 overflow-hidden">
                  {ev.cover_image_url ? (
                    <img src={ev.cover_image_url} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple/30 via-purple-dim to-bg3 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-purple-light/60" />
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-heading font-bold text-[15px] text-text leading-snug line-clamp-2">{ev.name}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-text3">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateRange(ev.start_date, ev.end_date)}
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-[12px] text-purple-light font-medium group-hover:gap-2 transition-all">
                    Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
