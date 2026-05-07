import { useEffect, useState } from 'react'
import { Link, Redirect } from 'wouter'
import { supabase } from '@/lib/supabase'
import { SpeakerSidebar } from '@/components/layout/speaker-sidebar'
import { Mic2, Users, FileText, ChevronRight } from 'lucide-react'

interface Lecture {
  id: string; title: string; status: string; scheduled_at: string | null
  events: { name: string; start_date: string } | null
  leadCount: number; fileCount: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-500' },
  recording: { label: 'Gravando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
  processing: { label: 'Processando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
  completed: { label: 'Concluída', color: 'bg-scribia-green/10 text-scribia-green' },
  failed: { label: 'Erro', color: 'bg-red-500/10 text-red-500' },
}

export default function SpeakerLecturesPage() {
  const [speakerName, setSpeakerName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSpeakerName('__unauthorized__'); setLoading(false); return }

      const { data: speaker } = await supabase.from('speakers').select('id, name, profile_photo_url, avatar_url').eq('user_id', user.id).single()
      if (!speaker) { setLoading(false); return }
      const s = speaker as { id: string; name: string; profile_photo_url: string | null; avatar_url: string | null }
      setSpeakerName(s.name)
      setAvatarUrl(s.profile_photo_url || s.avatar_url)

      const { data: lecData } = await supabase.from('lectures').select('id, title, status, scheduled_at, events(name, start_date)').eq('speaker_id', s.id).order('scheduled_at', { ascending: false })
      const lecs = (lecData ?? []) as unknown as Omit<Lecture, 'leadCount' | 'fileCount'>[]

      const lectureIds = lecs.map((l) => l.id)
      const leadCounts = new Map<string, number>()
      if (lectureIds.length > 0) {
        const { data: leads } = await supabase.from('lecture_leads').select('lecture_id').in('lecture_id', lectureIds)
        for (const l of (leads ?? []) as Array<{ lecture_id: string }>) {
          leadCounts.set(l.lecture_id, (leadCounts.get(l.lecture_id) ?? 0) + 1)
        }
      }

      setLectures(lecs.map((l) => ({ ...l, leadCount: leadCounts.get(l.id) ?? 0, fileCount: 0 })))
      setLoading(false)
    }
    load()
  }, [])

  if (speakerName === '__unauthorized__') return <Redirect to="/login" />

  return (
    <div className="min-h-screen bg-bg">
      <SpeakerSidebar userName={speakerName || 'Palestrante'} avatarUrl={avatarUrl} />
      <main className="lg:pl-64 pt-14 lg:pt-0 p-4 sm:p-6 md:p-8 min-h-screen">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Minhas Palestras</h1>
            <p className="text-[13px] text-text3 mt-1">Gerencie suas palestras, envie arquivos e solicite alterações.</p>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-bg3 rounded-xl animate-pulse" />)}</div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
              <Mic2 className="w-10 h-10 text-text3 mx-auto mb-3" />
              <p className="text-text2">Você ainda não tem palestras atribuídas.</p>
              <p className="text-text3 text-sm mt-1">Entre em contato com o organizador do evento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lectures.map((lecture) => {
                const cfg = statusConfig[lecture.status] ?? statusConfig.scheduled
                const eventDate = lecture.events?.start_date ? new Date(lecture.events.start_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : null
                return (
                  <Link key={lecture.id} href={`/speaker/lectures/${lecture.id}`}>
                    <div className="flex items-center justify-between bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-primary/30 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mic2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-text truncate">{lecture.title}</div>
                          <div className="text-[12px] text-text3 truncate">{lecture.events?.name ?? 'Evento'}{eventDate ? ` · ${eventDate}` : ''}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                            {lecture.leadCount > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-text3"><Users className="w-3 h-3" /> {lecture.leadCount} leads</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text3 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
