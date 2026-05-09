import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { PublicHeader } from '@/components/layout/public-header'
import { Calendar, ChevronLeft, MapPin, Mic, Users, Lock } from 'lucide-react'

interface OrganizerLite {
  id: string
  slug: string
  display_name: string
  logo_url: string | null
  brand_color: string | null
}

interface EventDetail {
  id: string
  slug: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  cover_image_url: string | null
  primary_color: string | null
  secondary_color: string | null
  organizer_id: string
}

interface LectureItem {
  id: string
  title: string
  status: string
  duration_seconds: number | null
  speakers: { id: string; name: string; avatar_url: string | null; company: string | null } | null
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const sameDay = start.toDateString() === end.toDateString()
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return sameDay ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`
}

export default function PublicEventPage({ params }: { params: { orgSlug: string; eventSlug: string } }) {
  const [organizer, setOrganizer] = useState<OrganizerLite | null>(null)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [lectures, setLectures] = useState<LectureItem[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: org } = await supabase
        .from('organizer_profiles')
        .select('id, slug, display_name, logo_url, brand_color')
        .eq('slug', params.orgSlug)
        .maybeSingle()
      if (!org) { setNotFound(true); setLoading(false); return }
      const o = org as OrganizerLite
      setOrganizer(o)

      const { data: ev } = await supabase
        .from('events')
        .select('id, slug, name, description, start_date, end_date, location, cover_image_url, primary_color, secondary_color, organizer_id')
        .eq('organizer_id', o.id)
        .eq('slug', params.eventSlug)
        .eq('status', 'completed')
        .maybeSingle()
      if (!ev) { setNotFound(true); setLoading(false); return }
      const e = ev as EventDetail
      setEvent(e)

      const { data: lecs } = await supabase
        .from('lectures_public')
        .select('id, title, status, duration_seconds, speaker_id')
        .eq('event_id', e.id)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
      const lectureRows = (lecs ?? []) as Array<{
        id: string; title: string; status: string;
        duration_seconds: number | null; speaker_id: string | null
      }>

      const speakerIds = Array.from(
        new Set(lectureRows.map((l) => l.speaker_id).filter((x): x is string => !!x)),
      )
      let speakerById = new Map<string, { id: string; name: string; avatar_url: string | null; company: string | null }>()
      if (speakerIds.length > 0) {
        const { data: spks } = await supabase
          .from('speakers_public')
          .select('id, name, avatar_url, company')
          .in('id', speakerIds)
        const rows = (spks ?? []) as Array<{ id: string; name: string; avatar_url: string | null; company: string | null }>
        speakerById = new Map(rows.map((s) => [s.id, s]))
      }

      const enriched: LectureItem[] = lectureRows.map((l) => ({
        id: l.id,
        title: l.title,
        status: l.status,
        duration_seconds: l.duration_seconds,
        speakers: l.speaker_id ? (speakerById.get(l.speaker_id) ?? null) : null,
      }))
      setLectures(enriched)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAuthed(true)
        const { data: enrollment } = await supabase
          .from('event_participants')
          .select('id')
          .eq('event_id', e.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setHasAccess(!!enrollment)
      }
      setLoading(false)
    }
    load()
  }, [params.orgSlug, params.eventSlug])

  if (notFound) return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Evento não encontrado</h1>
        <p className="text-[13px] text-text3 mb-6">
          Não conseguimos localizar este evento ou ele ainda não foi publicado.
        </p>
        <Link href={`/o/${params.orgSlug}`} className="inline-flex items-center gap-1 text-[13px] text-purple-light hover:text-purple transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar para o organizador
        </Link>
      </div>
    </div>
  )

  const speakers = Array.from(
    new Map(
      lectures.filter((l) => l.speakers).map((l) => [l.speakers!.id, l.speakers!]),
    ).values(),
  )

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Cover */}
      <section className="border-b border-border-subtle">
        <div className="aspect-[21/9] sm:aspect-[3/1] max-h-[360px] bg-bg3 overflow-hidden relative">
          {event?.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${event?.primary_color ?? '#6B4EFF'}, ${event?.secondary_color ?? '#7C5CBF'})`,
              }}
            />
          )}
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8">
          {organizer && (
            <Link href={`/o/${organizer.slug}`} className="inline-flex items-center gap-2 text-[12px] text-text3 hover:text-purple-light transition-colors mb-3">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="font-medium">{organizer.display_name}</span>
            </Link>
          )}
          {loading || !event ? (
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-bg3 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-bg3 rounded animate-pulse" />
            </div>
          ) : (
            <div className="animate-fade-up">
              <h1 className="font-heading text-[26px] sm:text-[32px] md:text-[36px] font-extrabold text-text leading-tight">{event.name}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[12.5px] text-text3">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatDateRange(event.start_date, event.end_date)}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {event.location}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-[13.5px] text-text2 mt-4 max-w-3xl leading-relaxed">{event.description}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Lectures */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-12">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-text inline-flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-light" /> Palestras
          </h2>
          <span className="text-[12px] text-text3">{lectures.length} no total</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-bg3 rounded-lg animate-pulse" />)}
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-10 bg-bg2 border border-dashed border-border-subtle rounded-xl">
            <p className="text-[13px] text-text3">Nenhuma palestra publicada para este evento.</p>
          </div>
        ) : (
          <div className="bg-bg2 border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden">
            {lectures.map((l) => {
              const card = (
                <div className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-bg3/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-[14px] text-text leading-snug truncate">{l.title}</div>
                    <div className="text-[11.5px] text-text3 mt-0.5 truncate">
                      {l.speakers?.name ?? 'Palestrante'}
                      {l.duration_seconds ? ` · ${formatDuration(l.duration_seconds)}` : ''}
                    </div>
                  </div>
                  {hasAccess ? (
                    <span className="text-[11px] text-purple-light font-medium shrink-0">Acessar →</span>
                  ) : authed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-text3 shrink-0">
                      <Lock className="w-3 h-3" /> Restrito
                    </span>
                  ) : (
                    <span className="text-[11px] text-text3 shrink-0">Entrar para acessar</span>
                  )}
                </div>
              )
              if (hasAccess) return <Link key={l.id} href={`/portal/lectures/${l.id}`}>{card}</Link>
              if (!authed) return <Link key={l.id} href="/login">{card}</Link>
              return <div key={l.id}>{card}</div>
            })}
          </div>
        )}
      </section>

      {/* Speakers */}
      {speakers.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pb-12">
          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-text inline-flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-purple-light" /> Palestrantes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
            {speakers.map((sp) => (
              <div key={sp.id} className="bg-bg2 border border-border-subtle rounded-xl p-4 text-center animate-fade-up">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-dim border border-border-purple overflow-hidden flex items-center justify-center font-heading font-bold text-purple-light mb-2">
                  {sp.avatar_url ? (
                    <img src={sp.avatar_url} alt={sp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{sp.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="font-heading font-semibold text-[12.5px] text-text leading-snug line-clamp-2">{sp.name}</div>
                {sp.company && <div className="text-[10.5px] text-text3 mt-0.5 truncate">{sp.company}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {!authed && lectures.length > 0 && (
        <section className="border-t border-border-subtle bg-bg2/40">
          <div className="max-w-3xl mx-auto px-4 py-10 md:py-12 text-center">
            <h3 className="font-heading text-[20px] sm:text-[22px] font-bold text-text">Acesse os materiais deste evento</h3>
            <p className="text-[13px] text-text2 mt-2 max-w-xl mx-auto">
              Áudios, transcrições, e-books e playbooks ficam disponíveis para participantes inscritos. Entre com sua conta para ouvir e baixar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <Link href="/login" className="inline-flex items-center bg-purple text-white px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-purple-light transition-all shadow-elegant">
                Entrar
              </Link>
              <Link href="/register" className="inline-flex items-center text-[14px] text-text2 hover:text-purple-light transition-colors px-3 py-2.5">
                Criar conta
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
