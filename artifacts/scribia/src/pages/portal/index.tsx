import { useEffect, useState } from 'react'
import { useLocation, Redirect } from 'wouter'
import { supabase } from '@/lib/supabase'
import { PortalHeader } from '@/components/layout/portal-header'
import { Headphones, BookOpen, Users } from 'lucide-react'

interface Lecture {
  id: string; title: string; status: string; duration_seconds: number | null
  ebook_content: string | null; speakers: { name: string } | null
  events: { name: string } | null
}

function formatDuration(seconds: number | null) {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`
  return `${m}min`
}

export default function PortalPage() {
  const [, navigate] = useLocation()
  const [userName, setUserName] = useState('Participante')
  const [eventName, setEventName] = useState('ScribIA')
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUnauthorized(true); setLoading(false); return }
      const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single()
      setUserName((profile as { full_name: string } | null)?.full_name ?? user.email?.split('@')[0] ?? 'Participante')

      const { data: participations } = await supabase.from('event_participants').select('event_id').eq('user_id', user.id)
      const eventIds = (participations ?? []).map((p: { event_id: string }) => p.event_id)

      if (eventIds.length > 0) {
        const { data: eventData } = await supabase.from('events').select('name').eq('id', eventIds[0]).single()
        setEventName((eventData as { name: string } | null)?.name ?? 'ScribIA')

        const { data: lectureData } = await supabase.from('lectures')
          .select('id, title, status, duration_seconds, ebook_content, speakers(name), events(name)')
          .in('event_id', eventIds).eq('status', 'completed')
        setLectures((lectureData ?? []) as unknown as Lecture[])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (unauthorized) return <Redirect to="/login" />

  return (
    <div className="min-h-screen bg-bg">
      <PortalHeader userName={userName} eventName={eventName} />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-9">
        <div className="mb-7 md:mb-9">
          <div className="text-[13px] text-text3 mb-1.5">Bem-vindo de volta,</div>
          <h1 className="font-heading text-[22px] sm:text-[26px] md:text-[28px] font-extrabold text-text leading-tight">Minhas Palestras</h1>
          <p className="text-[13px] sm:text-[14px] text-text3 mt-1.5">Acesse os conteúdos das palestras que você assistiu</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
            <div className="flex items-center gap-2 text-[13px] text-text2">
              <span className="text-purple-light font-semibold">{lectures.length}</span> palestras assistidas
            </div>
            <div className="flex items-center gap-2 text-[13px] text-text2">
              <span className="text-purple-light font-semibold">{lectures.filter((l) => l.ebook_content).length}</span> e-books disponíveis
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-bg3 rounded-xl animate-pulse" />)}</div>
        ) : lectures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4.5 stagger-children">
            {lectures.map((lecture) => {
              const goTo = (tab?: 'player' | 'materials') =>
                navigate(`/portal/lectures/${lecture.id}${tab ? `?tab=${tab}` : ''}`)
              return (
                <div
                  key={lecture.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goTo()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo() } }}
                  className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden hover:border-border-purple transition-all animate-fade-up cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-light"
                >
                  <div className="h-1.5 bg-gradient-to-r from-purple to-purple-light" />
                  <div className="p-4 sm:p-5">
                    <h3 className="font-heading font-bold text-[14px] text-text leading-snug">{lecture.title}</h3>
                    <p className="text-[11.5px] text-text3 mt-1.5">{lecture.speakers?.name ?? 'Palestrante'}</p>
                    {formatDuration(lecture.duration_seconds) && (
                      <p className="text-[11.5px] text-text3">{formatDuration(lecture.duration_seconds)}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border-subtle">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goTo('player') }}
                        className="flex items-center gap-1.5 text-[12px] text-purple-light hover:text-purple transition-colors font-medium"
                      >
                        <Headphones className="w-3.5 h-3.5" /> Ouvir
                      </button>
                      {lecture.ebook_content && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); goTo('materials') }}
                          className="flex items-center gap-1.5 text-[12px] text-scribia-green hover:opacity-80 transition-colors font-medium"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> E-book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-text3 mx-auto mb-4" />
            <p className="text-text3 text-[13px]">Nenhuma palestra disponível ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
