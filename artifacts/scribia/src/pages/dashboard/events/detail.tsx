import { useEffect, useState } from 'react'
import { useRoute, Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Chip } from '@/components/ui/chip'
import { ChevronLeft, Calendar, MapPin, Mic, Users, Plus } from 'lucide-react'

interface EventDetail {
  id: string; name: string; description: string | null
  start_date: string; end_date: string; location: string | null; status: string
}

interface Lecture {
  id: string; title: string; status: string; scheduled_at: string | null
  duration_seconds: number | null; speakers: { name: string } | null
}

const statusMap: Record<string, { label: string; variant: 'green' | 'yellow' | 'purple' | 'red' | 'default' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  recording: { label: 'Gravando', variant: 'red' },
  processing: { label: 'Processando', variant: 'yellow' },
  completed: { label: 'Concluída', variant: 'green' },
  failed: { label: 'Falhou', variant: 'red' },
}

export default function EventDetailPage() {
  const [, params] = useRoute('/dashboard/events/:id')
  const id = params?.id
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'lectures' | 'participants'>('lectures')

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(data as EventDetail | null)
      const { data: lecData } = await supabase.from('lectures')
        .select('id, title, status, scheduled_at, duration_seconds, speakers(name)')
        .eq('event_id', id).order('scheduled_at', { ascending: true })
      setLectures((lecData ?? []) as unknown as Lecture[])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="max-w-6xl">
      <div className="h-8 w-48 bg-bg3 rounded animate-pulse mb-6" />
      <div className="h-32 bg-bg3 rounded-xl animate-pulse" />
    </div>
  )

  if (!event) return (
    <div className="max-w-6xl">
      <p className="text-text3">Evento não encontrado.</p>
    </div>
  )

  return (
    <div className="max-w-6xl">
      <Link href="/dashboard/events" className="inline-flex items-center gap-1 text-[13px] text-text3 hover:text-purple-light transition-colors mb-4">
        <ChevronLeft className="w-3.5 h-3.5" /> Eventos
      </Link>

      <div className="bg-bg2 border border-border-subtle rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">{event.name}</h1>
            {event.description && <p className="text-[13px] text-text3 mt-1">{event.description}</p>}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-[12px] text-text3">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(event.start_date).toLocaleDateString('pt-BR')} – {new Date(event.end_date).toLocaleDateString('pt-BR')}
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5 text-[12px] text-text3">
                  <MapPin className="w-3.5 h-3.5" /> {event.location}
                </div>
              )}
            </div>
          </div>
          <Chip variant={event.status === 'active' ? 'green' : 'default'}>{event.status === 'active' ? 'Ativo' : event.status}</Chip>
        </div>
      </div>

      <div className="flex gap-1 mb-5">
        {[{ id: 'lectures', label: 'Palestras', icon: Mic }, { id: 'participants', label: 'Participantes', icon: Users }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as 'lectures' | 'participants')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${activeTab === tab.id ? 'bg-purple-dim text-purple-light border border-border-purple' : 'text-text2 hover:bg-bg3 border border-transparent'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lectures' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[15px] font-bold text-text">{lectures.length} palestras</h2>
          </div>
          {lectures.length > 0 ? (
            <div className="space-y-2">
              {lectures.map((lecture) => {
                const { label, variant } = statusMap[lecture.status] ?? statusMap.scheduled
                return (
                  <Link key={lecture.id} href={`/dashboard/lectures/${lecture.id}`}>
                    <div className="flex items-center gap-3 bg-bg2 border border-border-subtle rounded-xl p-4 transition-all hover:border-border-purple cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-purple-dim border border-border-purple flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4 text-purple-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-[13px] text-text">{lecture.title}</p>
                        <p className="text-[11px] text-text3 mt-0.5">{lecture.speakers?.name ?? 'Sem palestrante'}</p>
                      </div>
                      <Chip variant={variant}>{label}</Chip>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-bg2 border border-border-subtle rounded-xl">
              <Mic className="w-10 h-10 text-text3 mx-auto mb-3" />
              <p className="text-text2 text-[13px]">Nenhuma palestra criada ainda.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="text-center py-12 bg-bg2 border border-border-subtle rounded-xl">
          <Users className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2 text-[13px]">Gerencie participantes via convites.</p>
        </div>
      )}
    </div>
  )
}
