import { useEffect, useState, useCallback } from 'react'
import { useLocation, Redirect } from 'wouter'
import { supabase } from '@/lib/supabase'
import { SpeakerSidebar } from '@/components/layout/speaker-sidebar'
import { ChangeRequestForm } from '@/components/speaker-dashboard/change-request-form'
import { ChangeRequestHistory } from '@/components/speaker-dashboard/change-request-history'
import { FileUpload } from '@/components/speaker-dashboard/file-upload'
import { FileList, type SpeakerFile } from '@/components/speaker-dashboard/file-list'
import { HighlightQuoteTab } from '@/components/speaker-dashboard/highlight-quote-tab'
import { ArrowLeft } from 'lucide-react'

interface ChangeRequest {
  id: string; request_type: string; requested_value: string; status: string
  reason: string | null; organizer_response: string | null; created_at: string
}

interface LectureData {
  id: string; title: string; description: string | null; status: string
  highlight_quote: string | null; summary: string | null
  events: { name: string; start_date: string } | null
}

interface SpeakerRecord {
  id: string; name: string; avatar_url: string | null; profile_photo_url: string | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-500' },
  recording: { label: 'Gravando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
  processing: { label: 'Processando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
  completed: { label: 'Concluída', color: 'bg-scribia-green/10 text-scribia-green' },
  failed: { label: 'Erro', color: 'bg-red-500/10 text-red-500' },
}

const tabs = [
  { id: 'info', label: 'Informações' },
  { id: 'files', label: 'Arquivos' },
  { id: 'highlight', label: 'Frase de Destaque' },
] as const

type TabId = typeof tabs[number]['id']

export default function SpeakerLectureDetailPage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation()
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [speaker, setSpeaker] = useState<SpeakerRecord | null>(null)
  const [lecture, setLecture] = useState<LectureData | null>(null)
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [files, setFiles] = useState<SpeakerFile[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('info')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUnauthorized(true); setLoading(false); return }

    const { data: spk } = await supabase.from('speakers').select('id, name, avatar_url, profile_photo_url').eq('user_id', user.id).single()
    if (!spk) { navigate('/speaker/dashboard'); return }
    const s = spk as SpeakerRecord
    setSpeaker(s)

    const { data: lec } = await supabase.from('lectures').select('id, title, description, status, highlight_quote, summary, events(name, start_date)').eq('id', params.id).eq('speaker_id', s.id).single()
    if (!lec) { navigate('/speaker/lectures'); return }
    setLecture(lec as unknown as LectureData)

    const { data: crData } = await supabase.from('lecture_change_requests').select('*').eq('lecture_id', params.id).eq('speaker_id', s.id).order('created_at', { ascending: false })
    setChangeRequests((crData ?? []) as unknown as ChangeRequest[])

    const { data: filesData } = await supabase.from('speaker_files').select('*').eq('lecture_id', params.id).eq('speaker_id', s.id).order('created_at', { ascending: false })
    setFiles((filesData ?? []) as unknown as SpeakerFile[])
    setLoading(false)
  }, [params.id, navigate])

  useEffect(() => { loadData() }, [loadData])

  if (unauthorized) return <Redirect to="/login" />

  if (loading) return (
    <div className="min-h-screen bg-bg lg:pl-64 pt-14 lg:pt-0 flex items-center justify-center">
      <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
    </div>
  )

  if (!lecture || !speaker) return null

  const cfg = statusConfig[lecture.status] ?? statusConfig.scheduled
  const hasPendingTitleRequest = changeRequests.some(r => r.request_type === 'title_change' && r.status === 'pending')
  const hasPendingDescriptionRequest = changeRequests.some(r => r.request_type === 'description_change' && r.status === 'pending')
  const avatarUrl = speaker.profile_photo_url || speaker.avatar_url

  return (
    <div className="min-h-screen bg-bg">
      <SpeakerSidebar userName={speaker.name} avatarUrl={avatarUrl} />
      <main className="lg:pl-64 pt-14 lg:pt-0 p-4 sm:p-6 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/speaker/lectures')} className="inline-flex items-center gap-1.5 text-[13px] text-text3 hover:text-text2 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para palestras
          </button>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">{lecture.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-[13px] text-text3">{lecture.events?.name ?? 'Evento'}{lecture.events?.start_date ? ` · ${new Date(lecture.events.start_date).toLocaleDateString('pt-BR')}` : ''}</p>
          </div>

          <div className="flex gap-1 mb-6 border-b border-border-subtle">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-purple text-purple-light' : 'border-transparent text-text3 hover:text-text2'}`}>{tab.label}</button>
            ))}
          </div>

          {activeTab === 'info' && (
            <div className="space-y-6">
              <ChangeRequestForm lectureId={lecture.id} speakerId={speaker.id} currentTitle={lecture.title} currentDescription={lecture.description} hasPendingTitleRequest={hasPendingTitleRequest} hasPendingDescriptionRequest={hasPendingDescriptionRequest} />
              <ChangeRequestHistory requests={changeRequests} />
            </div>
          )}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <FileUpload lectureId={lecture.id} speakerId={speaker.id} currentFileCount={files.length} onUploadComplete={loadData} />
              <FileList files={files} canDelete={true} onFileDeleted={loadData} />
            </div>
          )}
          {activeTab === 'highlight' && (
            <HighlightQuoteTab lectureId={lecture.id} currentQuote={lecture.highlight_quote} speakerName={speaker.name} speakerAvatar={avatarUrl} eventName={lecture.events?.name ?? 'Evento'} eventDate={lecture.events?.start_date ?? null} summary={lecture.summary} />
          )}
        </div>
      </main>
    </div>
  )
}
