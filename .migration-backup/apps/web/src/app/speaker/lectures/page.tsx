import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Mic2, Users, FileText, ChevronRight } from 'lucide-react'

export default async function SpeakerLecturesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: speaker } = await supabase
    .from('speakers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!speaker) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-text2">Perfil de palestrante nao encontrado.</p>
      </div>
    )
  }

  const speakerRecord = speaker as { id: string }

  // Get lectures with event info and counts
  const { data: lectureData } = await supabase
    .from('lectures')
    .select('id, title, status, scheduled_at, events(name, start_date)')
    .eq('speaker_id', speakerRecord.id)
    .order('scheduled_at', { ascending: false })

  const lectures = (lectureData ?? []) as unknown as Array<{
    id: string; title: string; status: string; scheduled_at: string | null
    events: { name: string; start_date: string } | null
  }>

  // Get file counts per lecture
  const { data: fileCounts } = await supabase
    .from('speaker_files')
    .select('lecture_id')
    .eq('speaker_id', speakerRecord.id)

  const fileCountMap = new Map<string, number>()
  for (const f of (fileCounts ?? []) as Array<{ lecture_id: string }>) {
    fileCountMap.set(f.lecture_id, (fileCountMap.get(f.lecture_id) ?? 0) + 1)
  }

  // Get lead counts per lecture from lecture_leads view
  const lectureIds = lectures.map((l) => l.id)
  const leadCountMap = new Map<string, number>()
  if (lectureIds.length > 0) {
    const { data: leadCounts } = await supabase
      .from('lecture_leads')
      .select('lecture_id')
      .in('lecture_id', lectureIds)

    for (const l of (leadCounts ?? []) as Array<{ lecture_id: string }>) {
      leadCountMap.set(l.lecture_id, (leadCountMap.get(l.lecture_id) ?? 0) + 1)
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-500' },
    recording: { label: 'Gravando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
    processing: { label: 'Processando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
    completed: { label: 'Concluida', color: 'bg-scribia-green/10 text-scribia-green' },
    failed: { label: 'Erro', color: 'bg-red-500/10 text-red-500' },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Minhas Palestras</h1>
        <p className="text-[13px] text-text3 mt-1">Gerencie suas palestras, envie arquivos e solicite alteracoes.</p>
      </div>

      {lectures.length === 0 ? (
        <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-xl">
          <Mic2 className="w-10 h-10 text-text3 mx-auto mb-3" />
          <p className="text-text2">Voce ainda nao tem palestras atribuidas.</p>
          <p className="text-text3 text-sm mt-1">Entre em contato com o organizador do evento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture) => {
            const cfg = statusConfig[lecture.status] ?? statusConfig.scheduled
            const leads = leadCountMap.get(lecture.id) ?? 0
            const files = fileCountMap.get(lecture.id) ?? 0
            const eventDate = lecture.events?.start_date
              ? new Date(lecture.events.start_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
              : null

            return (
              <Link
                key={lecture.id}
                href={`/speaker/lectures/${lecture.id}`}
                className="flex items-center justify-between bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mic2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text truncate">{lecture.title}</div>
                    <div className="text-[12px] text-text3 truncate">
                      {lecture.events?.name ?? 'Evento'}{eventDate ? ` · ${eventDate}` : ''}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {leads > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-text3">
                          <Users className="w-3 h-3" /> {leads} leads
                        </span>
                      )}
                      {files > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-text3">
                          <FileText className="w-3 h-3" /> {files} arquivos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text3 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
