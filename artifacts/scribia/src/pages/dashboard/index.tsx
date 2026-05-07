import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/stat-card'
import { RecentLecturesTable } from '@/components/dashboard/recent-lectures-table'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ProcessingOverview } from '@/components/dashboard/processing-overview'
import { Plus, Download } from 'lucide-react'

interface Event {
  id: string; name: string; start_date: string; end_date: string; status: string
}
interface Lecture {
  id: string; title: string; status: string; duration_seconds: number | null
  ebook_content: string | null; speakers: { name: string } | null
}

export default function DashboardPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [stats, setStats] = useState({ totalLectures: 0, completedLectures: 0, totalHours: 0, ebooksGenerated: 0, downloads: 0, transcribed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: eventData } = await supabase.from('events').select('*').eq('status', 'active').order('start_date', { ascending: false }).limit(1)
      let activeEvent = (eventData as unknown as Event[])?.[0]
      if (!activeEvent) {
        const { data: anyEvent } = await supabase.from('events').select('*').order('start_date', { ascending: false }).limit(1)
        activeEvent = (anyEvent as unknown as Event[])?.[0]
      }
      setEvent(activeEvent || null)

      if (!activeEvent) { setLoading(false); return }

      const { data: lectureData } = await supabase.from('lectures')
        .select('id, title, status, duration_seconds, ebook_content, speakers(name)')
        .eq('event_id', activeEvent.id).order('scheduled_at', { ascending: false })

      const lecs = (lectureData ?? []) as unknown as Lecture[]
      setLectures(lecs)

      const completed = lecs.filter((l) => l.status === 'completed').length
      const hours = Math.round(lecs.filter((l) => l.status === 'completed').reduce((acc, l) => acc + (l.duration_seconds ?? 0), 0) / 3600)
      const ebooks = lecs.filter((l) => l.ebook_content).length

      const lectureIds = lecs.map((l) => l.id)
      let transcribed = completed
      if (lectureIds.length > 0) {
        const { data: jobs } = await supabase.from('processing_jobs').select('type, status').in('lecture_id', lectureIds).eq('status', 'completed')
        const completedJobs = (jobs ?? []) as Array<{ type: string; status: string }>
        transcribed = completedJobs.filter((j) => j.type === 'transcription').length || completed
      }

      const { count: downloadCount } = await supabase.from('lecture_access').select('*', { count: 'exact', head: true })

      setStats({ totalLectures: lecs.length, completedLectures: completed, totalHours: hours, ebooksGenerated: ebooks, downloads: downloadCount ?? 0, transcribed })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="h-8 w-48 bg-bg3 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-bg3 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-[13px] text-text3 mt-0.5">Bem-vindo ao ScribIA</p>
          </div>
        </div>
        <div className="mt-12 sm:mt-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-dim border border-border-purple flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-purple-light" />
          </div>
          <p className="text-lg text-text2">Nenhum evento criado.</p>
          <p className="mt-2 text-text3">
            <Link href="/dashboard/events/new" className="text-purple-light hover:text-purple transition-colors">Crie seu primeiro evento!</Link>
          </p>
        </div>
      </div>
    )
  }

  const startDate = new Date(event.start_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  const endDate = new Date(event.end_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  const engagementRate = stats.totalLectures > 0 ? Math.round((stats.downloads / Math.max(stats.totalLectures, 1)) * 100) : 0
  const recentLectures = lectures.slice(0, 5)

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7 md:mb-9">
        <div className="min-w-0">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-[13px] text-text3 mt-0.5 break-words">{event.name} · {startDate}–{endDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button className="inline-flex items-center gap-1.5 bg-transparent border border-border-subtle text-text2 px-3 sm:px-4 py-2.5 rounded-lg text-[13px] transition-all hover:border-border-purple hover:text-purple-light">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar relatório</span>
            <span className="sm:hidden">Exportar</span>
          </button>
          <Link href={`/dashboard/events/${event.id}`} className="inline-flex items-center gap-1.5 bg-purple text-white px-3 sm:px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:bg-purple-light">
            <Plus className="w-3.5 h-3.5" />
            Nova palestra
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-7 stagger-children">
        <StatCard label="Palestras" value={stats.totalLectures} sub={`${stats.completedLectures} concluídas`} badge={stats.completedLectures > 0 ? `${stats.completedLectures} processadas` : undefined} badgeVariant="green" accent="purple" />
        <StatCard label="Áudio convertido" value={`${stats.totalHours}h`} sub="horas transcritas" badge={stats.transcribed > 0 ? `${Math.round((stats.transcribed / Math.max(stats.totalLectures, 1)) * 100)}% processado` : undefined} badgeVariant="green" accent="green" />
        <StatCard label="E-books gerados" value={stats.ebooksGenerated} sub={stats.completedLectures - stats.ebooksGenerated > 0 ? `${stats.completedLectures - stats.ebooksGenerated} aguardando revisão` : 'todos gerados'} accent="yellow" />
        <StatCard label="Downloads" value={stats.downloads} sub={`taxa: ${engagementRate}% de engajamento`} badge={stats.downloads > 0 ? `▲ ativo` : undefined} badgeVariant="green" accent="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 md:gap-5">
        <RecentLecturesTable lectures={recentLectures} eventId={event.id} />
        <div className="flex flex-col gap-4 md:gap-5">
          <QuickActions eventId={event.id} />
          <ProcessingOverview eventId={event.id} totalLectures={stats.totalLectures} transcribed={stats.transcribed} ebooksGenerated={stats.ebooksGenerated} cardsGenerated={0} playbooksGenerated={0} />
        </div>
      </div>
    </div>
  )
}
