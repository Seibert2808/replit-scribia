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
  // Vertical (9:16). Ultimo recurso do banner, quando nao ha a horizontal.
  cover_image_url: string | null
  // Horizontal (2:1). E esta que o banner quer.
  site_image_url: string | null
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
  // Cargo que o palestrante preenche no perfil. Vai embaixo do nome,
  // junto da empresa, do mesmo jeito que no card da palestra.
  speaker_role: string | null
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

// REMENDO REMOVIDO em 16/09/2026. Aqui existia getLocalHeroImage(), gemea
// da que estava em events.tsx: devolvia um arquivo horizontal fixo
// procurando "siaparto" ou "eneon" no NOME do evento.
//
// O banner desta pagina e horizontal (21:9 no desktop) e vinha caindo na
// cover_image_url, que e VERTICAL: por isso o remendo existia. Agora quem
// responde e events.site_image_url, enviada em "Imagem para o site" no
// painel de Identidade Visual.

// O link de inscrição NÃO é mais escrito à mão aqui.
//
// Antes esta função casava pelo NOME do evento e só conhecia o ENEON, o mesmo
// remendo que foi removido das imagens em 16/09. Agora o endereço vem da
// entrada do Calendário ligada a este evento (`community_events.event_id`,
// migration 71), que é onde o organizador já cadastra o site de inscrição.
// Evento sem entrada ligada simplesmente não mostra botão.

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
  // Endereço de inscrição, vindo da entrada do Calendário ligada a este evento.
  const [linkInscricao, setLinkInscricao] = useState<string | null>(null)

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
          `public_events?id=eq.${eventId}&select=id,name,description,start_date,end_date,location,cover_image_url,site_image_url,organizer_id,organizer_name`
        )
        if (!mounted) return
        if (!ev) { setNotFound(true); setLoading(false); return }
        setEvent(ev)

        // O nome do organizador ja vem embutido em public_events, entao
        // nao ha mais nenhuma consulta a user_profiles nesta pagina.
        if (!mounted) return
        if (ev.organizer_name) setOrganizer({ id: ev.organizer_id, full_name: ev.organizer_name })

        // Endereco de inscricao: vem da entrada do Calendario ligada a este
        // evento. E o mesmo campo que o organizador ja preenche no painel,
        // entao nao ha cadastro novo para ninguem fazer. Silencioso de
        // proposito: sem entrada ligada, a pagina segue sem botao.
        try {
          const doCalendario = await publicGet<{ url: string }>(
            `public_community_events?event_id=eq.${eventId}&select=url&limit=1`,
          )
          if (mounted && doCalendario[0]?.url) setLinkInscricao(doCalendario[0].url)
        } catch (_) {
          /* sem link, sem botao */
        }

        // public_lectures traz os campos do palestrante achatados, em vez de
        // um relacionamento embutido: assim o site nao depende do PostgREST
        // inferir ligacao entre visoes, que e fragil. E o e-mail do palestrante
        // fica de fora por construcao, porque a coluna nao existe la.
        type LecRow = {
          id: string; title: string; status: string; duration_seconds: number | null
          speaker_id: string | null; speaker_name: string | null
          speaker_avatar_url: string | null; speaker_company: string | null
          speaker_role: string | null
        }
        const rows = await publicGet<LecRow>(
          `public_lectures?event_id=eq.${ev.id}&select=id,title,status,duration_seconds,speaker_id,speaker_name,speaker_avatar_url,speaker_company,speaker_role&order=scheduled_at.asc`
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
          speaker_role: l.speaker_role,
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
        .map((l) => [
          l.speaker_id,
          {
            id: l.speaker_id!,
            name: l.speaker_name!,
            avatar: l.speaker_avatar,
            company: l.speaker_company,
            role: l.speaker_role,
          },
        ]),
    ).values(),
  )

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Cover */}
      <section className="border-b border-border-subtle">
        <div className="max-w-5xl mx-auto aspect-[16/9] sm:aspect-[21/9] bg-bg3 overflow-hidden relative">
          {/* A horizontal primeiro. A vertical fica como ultimo recurso:
              recortada num 21:9 ela perde muito, mas ainda e melhor que o
              gradiente vazio. */}
          {event && (event.site_image_url ?? event.cover_image_url) ? (
            <img src={(event.site_image_url ?? event.cover_image_url)!} alt={event.name} className="w-full h-full object-cover" />
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
              {linkInscricao && isRegistrationOpen(event.end_date) && (
                <a
                  href={linkInscricao}
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
                {/* 64px e nao 48px: agora que a foto aparece de verdade, ela
                    e o que identifica a pessoa. Quem nao preencheu o perfil
                    continua na inicial, e o circulo do mesmo tamanho mantem
                    a grade alinhada. */}
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-dim border border-border-purple overflow-hidden flex items-center justify-center font-heading font-bold text-purple-light mb-2">
                  {sp.avatar ? (
                    <img src={sp.avatar} alt={sp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">{sp.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="font-heading font-semibold text-[12.5px] text-text leading-snug line-clamp-2">{sp.name}</div>
                {/* "Cargo · Empresa", a mesma linha do card da palestra. Um
                    dos dois pode faltar, entao o filtro evita deixar o
                    separador solto. `break-words` porque cargo aqui chega a
                    ter 40 caracteres e a coluna e estreita no celular. */}
                {(sp.role || sp.company) && (
                  <div className="text-[10.5px] text-text3 mt-0.5 leading-snug line-clamp-2 break-words">
                    {[sp.role, sp.company].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
          O convite do rodapé muda com a data do evento.

          Evento que AINDA VAI ACONTECER: "Participe", com o endereço de
          inscrição do organizador. Perguntar "você participou?" antes do
          evento é convite para a pessoa fechar a página, porque a resposta
          é não e não há o que fazer ali.

          Evento que JÁ ACONTECEU: o texto de sempre, para quem esteve lá
          entrar e pegar o material.
          ------------------------------------------------------------------ */}
      {!authed && event && isRegistrationOpen(event.end_date) ? (
        <section className="border-t border-border-subtle bg-bg2/40">
          <div className="max-w-3xl mx-auto px-4 py-10 md:py-12 text-center">
            <h3 className="font-heading text-[20px] sm:text-[22px] font-bold text-text">Participe deste evento</h3>
            <p className="text-[13px] text-text2 mt-2 max-w-xl mx-auto">
              A inscrição é feita pela organização do evento. Depois dele, áudios, resumos,
              livebooks, playbooks e cards ficam aqui, para quem participou.
            </p>
            {linkInscricao && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                <a
                  href={linkInscricao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple text-white px-5 py-2.5 rounded-lg text-[14px] font-medium hover:bg-purple-light transition-all shadow-elegant"
                >
                  Inscrever-se no evento <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            )}
            <p className="text-[12px] text-text3 mt-5 max-w-lg mx-auto leading-relaxed">
              Já se inscreveu?{' '}
              <a href={LOGIN_URL} className="text-purple-light hover:underline">
                Entre no ScribIA
              </a>{' '}
              com o mesmo e-mail do cadastro para acompanhar o material assim que sair.
            </p>
          </div>
        </section>
      ) : !authed && lectures.length > 0 ? (
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
      ) : null}

      <Footer />
    </div>
  )
}
