import { useEffect, useState } from 'react'
import { useRoute, Link } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Chip } from '@/components/ui/chip'
import { ChevronLeft, Mic } from 'lucide-react'

interface LectureDetail {
  id: string; title: string; description: string | null; status: string
  scheduled_at: string | null; duration_seconds: number | null
  transcript_text: string | null; ebook_content: string | null
  processing_progress: number; event_id: string
  speakers: { name: string; bio: string | null } | null
  events: { name: string } | null
}

const statusConfig: Record<string, { label: string; variant: 'green' | 'yellow' | 'purple' | 'red' | 'default' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  recording: { label: 'Gravando', variant: 'red' },
  processing: { label: 'Processando', variant: 'yellow' },
  completed: { label: 'Concluída', variant: 'green' },
  failed: { label: 'Falhou', variant: 'red' },
}

export default function LectureDetailPage() {
  const [, params] = useRoute('/dashboard/lectures/:id')
  const id = params?.id
  const [lecture, setLecture] = useState<LectureDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase.from('lectures')
        .select('id, title, description, status, scheduled_at, duration_seconds, transcript_text, ebook_content, processing_progress, event_id, speakers(name, bio), events(name)')
        .eq('id', id).single()
      setLecture(data as unknown as LectureDetail | null)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="max-w-4xl">
      <div className="h-8 w-48 bg-bg3 rounded animate-pulse mb-6" />
      <div className="h-32 bg-bg3 rounded-xl animate-pulse" />
    </div>
  )

  if (!lecture) return <div className="max-w-4xl"><p className="text-text3">Palestra não encontrada.</p></div>

  const { label, variant } = statusConfig[lecture.status] ?? statusConfig.scheduled

  return (
    <div className="max-w-4xl">
      <Link href={`/dashboard/events/${lecture.event_id}`} className="inline-flex items-center gap-1 text-[13px] text-text3 hover:text-purple-light transition-colors mb-4">
        <ChevronLeft className="w-3.5 h-3.5" /> Voltar ao evento
      </Link>

      <div className="bg-bg2 border border-border-subtle rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-dim border border-border-purple flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-purple-light" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-text">{lecture.title}</h1>
              <p className="text-[12px] text-text3 mt-0.5">{lecture.events?.name ?? 'Evento'} · {lecture.speakers?.name ?? 'Sem palestrante'}</p>
            </div>
          </div>
          <Chip variant={variant}>{label}</Chip>
        </div>
        {lecture.description && <p className="text-[13px] text-text2 mt-4">{lecture.description}</p>}
        {lecture.processing_progress > 0 && lecture.status === 'processing' && (
          <div className="mt-4">
            <div className="flex justify-between text-[12px] text-text3 mb-1.5">
              <span>Processando...</span>
              <span>{lecture.processing_progress}%</span>
            </div>
            <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
              <div className="h-full bg-purple transition-all" style={{ width: `${lecture.processing_progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {lecture.ebook_content && (
        <div className="bg-bg2 border border-border-subtle rounded-xl p-5 mb-6">
          <h2 className="font-heading text-[15px] font-bold text-text mb-3">Conteúdo do E-book</h2>
          <div className="prose prose-sm max-w-none text-text2 whitespace-pre-wrap text-[13px]">{lecture.ebook_content.substring(0, 500)}...</div>
        </div>
      )}

      {lecture.transcript_text && (
        <div className="bg-bg2 border border-border-subtle rounded-xl p-5">
          <h2 className="font-heading text-[15px] font-bold text-text mb-3">Transcrição</h2>
          <div className="text-[13px] text-text2 whitespace-pre-wrap">{lecture.transcript_text.substring(0, 800)}...</div>
        </div>
      )}
    </div>
  )
}
