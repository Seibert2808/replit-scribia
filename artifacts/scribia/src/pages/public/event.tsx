import { useEffect, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { supabase } from '@/lib/supabase'
import { publicGet, publicGetOne } from '@/lib/public-fetch'
import { PublicHeader } from '@/components/layout/public-header'
import Footer from '@/components/sections/Footer'
import { Calendar, ChevronLeft, MapPin, Mic, Users, Lock, ArrowUpRight } from 'lucide-react'
import { SITE, LOGIN_URL } from '@/utils/constants'

interface EventDetail {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  cover_image_url: string | null
  organizer_id: string
  organizer_name: string | null
}

interface OrganizerLite {
  id: string
  full_name: string
}

interface LectureItem {
  id: string
  title: string
  status: string
  duration_seconds: number | null
  speaker_name: string | null
  speaker_avatar: string | null
  speaker_company: string | null
  speaker_id: string | null
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

// Banner (formato horizontal) da página do evento. Difere da capa do banco
// (`cover_image_url`), que é vertical e usada nos cards da listagem.
function getLocalHeroImage(name: string): string | null {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n.includes('siaparto')) return '/images/siaparto-2025.png'
  if (n.includes('eneon')) return '/images/eneon-2026.png'
  return null
}

// Link de inscrição externo por evento. O botão só aparece enquanto o evento
// não terminou (ver isRegistrationOpen).
function getRegistrationUrl(name: string): string | null {
  if (name.toLowerCase().includes('eneon')) return 'https://abenforj.org.br/eventos'
  return null
}

// Verdadeiro durante todo o dia do término; passa a falso a partir do dia
// seguinte ao end_date (ex.: evento até 17/07 → some em 18/07).
function isRegistrationOpen(endIso: string): boolean {
  const end = new Date(endIso)
  const cutoff = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0)
  return new Date() < cutoff
}

export default function PublicEventPage() {
  const [, params] = useRoute('/eventos/:id')
  const eventId = params?.id

  const [organizer, setOrganizer] = useState<OrganizerLite | null>(null)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [lectures, setLectures] = useState<LectureItem[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Conteúdo público — via REST (publicGet). O cliente supabase-js pendura
  // queries após navegação client-side, então o conteúdo visível NÃO depende
  // dele (mesmo motivo das demais páginas públicas).
  useEffect(() => {
    if (!eventId) return
    let mounted = true
    const failsafe = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    async function load() {
      try {
        const ev = await publicGetOne<EventDetail>(
          `public_events?id=eq.${eventId}&select=id,name,description,start_date,end_date,location,cover_image_url,organizer_id,organizer_name`
        )
        if (!mounted) return
        if (!ev) { setNotFound(true); setLoading(false); return }
        setEvent(ev)

        // O nome do organizador ja vem embutido em public_events, entao
        // nao ha mais nenhuma consulta a user_profiles nesta pagina.
        if (!mounted) return
        if (ev.organizer_name) setOrganizer({ id: ev.organizer_id, full_name: ev.organizer_name })

        // public_lectures traz os campos do palestrante achatados, em vez de
        // um relacionamento embutido: assim o site nao depende do PostgREST
        // inferir ligacao entre visoes, que e fragil. E o e-mail do palestrante
        // fica de fora por construcao, porque a coluna nao existe la.
        type LecRow = {
          id: string; title: string; status: string; duration_seconds: number | null
          speaker_id: string | null; speaker_name: string | null
          speaker_avatar_url: string | null; speaker_company: string | null
        }
        const rows = await publicGet<LecRow>(
          `public_lectures?event_id=eq.${ev.id}&select=id,title,status,duration_seconds,speaker_id,speaker_name,speaker_avatar_url,speaker_company&order=scheduled_at.asc`
        )
        if (!mounted) return
        setLectures(rows.map((l) => ({
          id: l.id,
          title: l.title,
          status: l.status,
          duration_seconds: l.duration_seconds,
          speaker_id: l.speaker_id,
          speaker_name: l.speaker_name,
          speaker_avatar: l.speaker_avatar_url,
          speaker_company: l.speaker_company,
        })))
      } catch (_) {
        // silent
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false; clearTimeout(failsafe) }
  }, [eventId])

  // Login/inscrição — via supabase-js (precisa da sessão). Isolado em um effect
  // próprio para que um eventual travamento do cliente não impeça o conteúdo
  // público de renderizar.
  useEffect(() => {
    const id = event?.id
    if (!id) return
    let mounted = true

    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted || !user) return
        setAuthed(true)
        const { data: enrollment } = await supabase
          .from('event_participants')
          .select('id')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!mounted) return
        setHasAccess(!!enrollment)
      } catch (_) {
        // silent
      }
    }
    checkAccess()
    return () => { mounted = false }
  }, [event?.id])

  if (notFound) return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Evento não encontrado</h1>
        <p className="text-[13px] text-text3 mb-6">Não conseguimos localizar este evento.</p>
        <Link href="/eventos" className="inline-flex items-center gap-1 text-[13px] text-purple-light hover:text-purple transition-colors">
          <ChevronLeft className="w-4 h-4" /> Ver todos os eventos
        </Link>
      </div>
    </div>
  )

  const uniqueSpeakers = Array.from(
    new Map(
      lectures
        .filter((l) => l.speaker_id && l.speaker_name)
        .map((l) => [l.speaker_id, { id: l.speaker_id!, name: l.speaker_name!, avatar: l.speaker_avatar, company: l.speaker_company }]),
    ).values(),
  )

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Cover */}
      <section className="border-b border-border-subtle">
        <div className="max-w-5xl mx-auto aspect-[16/9] sm:aspect-[21/9] bg-bg3 overflow-hidden relative">
          {event && (getLocalHeroImage(event.name) ?? event.cover_image_url) ? (
            <img src={getLocalHeroImage(event!.name) ?? event!.cover_image_url!} alt={event!.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple/60 via-purple-dark/40 to-purple-dim" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8">
          <Link href="/eventos" className="inline-flex items-center gap-1.5 text-[12px] text-text3 hover:text-purple-light transition-colors mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> Todos os eventos
          </Link>
          {loading || !event ? (
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-bg3 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-bg3 rounded animate-pulse" />
            </div>
          ) : (
            <div className="animate-fade-up">
              {organizer && <p className="text-[11px] text-text3 uppercase tracking-widest mb-1">{organizer.full_name}</p>}
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
              {getRegistrationUrl(event.name) && isRegistrationOpen(event.end_date) && (
                <a
                  href={getRegistrationUrl(event.name)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 bg-purple text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-purple-light transition-all"
                >
                  Inscreva-se <ArrowUpRight className="w-4 h-4" />
                </a>
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
          {!loading && <span className="text-[12px] text-text3">{lectures.length} no total</span>}
        </div>

        {/* Single CTA above the list, only for users without access */}
        {!loading && lectures.length > 0 && !hasAccess && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-purple-dim/40 border border-border-purple rounded-xl px-4 sm:px-5 py-4">
            <div className="flex items-start sm:items-center gap-2.5 text-[13px] text-text2">
              <Lock className="w-4 h-4 text-purple-light shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {authed
                  ? 'O conteúdo completo é liberado para quem se cadastrou neste evento.'
                  : 'Participou deste evento? Entre com o e-mail que você usou no cadastro.'}
              </span>
            </div>
            {!authed && (
              <a
                href={LOGIN_URL}
                className="inline-flex items-center justify-center bg-purple text-white px-4 py-2 rounded-lg text-[12.5px] font-medium hover:bg-purple-light transition-all shrink-0"
              >
                Entrar
              </a>
            )}
          </div>
        )}

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
                <div className={`flex items-center gap-4 px-4 sm:px-5 py-4 ${hasAccess ? 'hover:bg-bg3/40 transition-colors' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-[14px] text-text leading-snug truncate">{l.title}</div>
                    <div className="text-[11.5px] text-text3 mt-0.5 truncate">
                      {l.speaker_name ?? 'Palestrante'}
                      {l.duration_seconds ? ` · ${formatDuration(l.duration_seconds)}` : ''}
                    </div>
                  </div>
                  {hasAccess && (
                    <span className="text-[11px] text-purple-light font-medium shrink-0">Acessar →</span>
                  )}
                </div>
              )
              // Precisa apontar para o mesmo app do botao Entrar. Se apontasse para
              // o portal deste site, a pessoa logaria no app.scribia.io e cairia aqui
              // sem sessao, voltando para o login num laco.
              if (hasAccess) return <a key={l.id} href={`${SITE.appUrl}/portal/lectures/${l.id}`}>{card}</a>
              return <div key={l.id}>{card}</div>
            })}
          </div>
        )}
      </section>

      {/* Speakers */}
      {uniqueSpeakers.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pb-12">
          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold text-text inline-flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-purple-light" /> Palestrantes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
            {uniqueSpeakers.map((sp) => (
              <div key={sp.id} className="bg-bg2 border border-border-subtle rounded-xl p-4 text-center animate-fade-up">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-dim border border-border-purple overflow-hidden flex items-center justify-center font-heading font-bold text-purple-light mb-2">
                  {sp.avatar ? (
                    <img src={sp.avatar} alt={sp.name} className="w-full h-full object-cover" />
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
            <h3 className="font-heading text-[20px] sm:text-[22px] font-bold text-text">Você participou deste evento?</h3>
            <p className="text-[13px] text-text2 mt-2 max-w-xl mx-auto">
              Áudios, resumos, livebooks, playbooks e cards ficam disponíveis para quem se
              cadastrou neste evento. Entre com o e-mail que você usou no cadastro.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <a href={LOGIN_URL} className="inline-flex items-center bg-purple text-white px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-purple-light transition-all shadow-elegant">
                Entrar
              </a>
            </div>
            <p className="text-[12px] text-text3 mt-5 max-w-lg mx-auto leading-relaxed">
              Participou e está sem acesso? Escreva para{' '}
              <a href={`mailto:${SITE.supportEmail}`} className="text-purple-light hover:underline">
                {SITE.supportEmail}
              </a>
              . Criar uma conta por conta própria não libera o conteúdo do evento.
            </p>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
