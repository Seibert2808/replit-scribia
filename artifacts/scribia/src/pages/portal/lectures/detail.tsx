import { useEffect, useState } from 'react'
import { useLocation, Redirect, useSearch } from 'wouter'
import { supabase } from '@/lib/supabase'
import { PortalHeader } from '@/components/layout/portal-header'
import { AudioPlayer } from '@/components/portal/audio-player'
import { SenioritySelector } from '@/components/portal/seniority-selector'
import { ChevronLeft, BookOpen, FileText, Mic, Download, ChevronDown, Loader2, Lock, Clock } from 'lucide-react'

type SeniorityLevel = 'junior' | 'pleno' | 'senior'

interface ProfileMaterial {
  id: string
  profile_type: string
  content_type: 'ebook' | 'playbook'
  markdown_content: string | null
  status: string
  word_count: number | null
}

interface LectureData {
  id: string; title: string; status: string; duration_seconds: number | null
  audio_path: string | null; event_id: string
  ebook_content: string | null; playbook_content: string | null
  summary: string | null; topics: string[] | null; transcript_text: string | null
  speakers: { name: string } | null; events: { name: string; materials_access_days: number | null } | null
}

const PROFILE_LABELS: Record<string, string> = {
  junior_compact: 'Junior Compacto', junior_complete: 'Junior Completo',
  pleno_compact: 'Pleno Compacto', pleno_complete: 'Pleno Completo',
  senior_compact: 'Senior Compacto', senior_complete: 'Senior Completo',
}

const SENIORITY_LABELS: Record<string, string> = { junior: 'Iniciante', pleno: 'Intermediário', senior: 'Avançado' }

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`
}

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: FileText },
  { id: 'player', label: 'Áudio', icon: Mic },
  { id: 'materials', label: 'Materiais', icon: BookOpen },
] as const

export default function PortalLectureDetailPage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation()
  const search = useSearch()
  const initialTab = (() => {
    const t = new URLSearchParams(search).get('tab')
    return t === 'player' || t === 'materials' || t === 'overview' ? t : 'overview'
  })()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('Participante')
  const [eventName, setEventName] = useState('ScribIA')
  const [lecture, setLecture] = useState<LectureData | null>(null)
  const [materials, setMaterials] = useState<ProfileMaterial[]>([])
  const [seniorityLevel, setSeniorityLevel] = useState<SeniorityLevel | null>(null)
  const [materialsExpired, setMaterialsExpired] = useState(false)
  const [materialsExpiresAt, setMaterialsExpiresAt] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showTranscript, setShowTranscript] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUnauthorized(true); setLoading(false); return }
      setUserId(user.id)

      const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single()
      setUserName((profile as { full_name: string } | null)?.full_name ?? user.email?.split('@')[0] ?? 'Participante')

      const { data: lec } = await supabase.from('lectures').select('id, title, status, duration_seconds, audio_path, event_id, ebook_content, playbook_content, summary, topics, transcript_text, speakers(name), events(name, materials_access_days)').eq('id', params.id).single()
      if (!lec) { setNotFound(true); setLoading(false); return }
      const l = lec as unknown as LectureData

      const { data: enrollment } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', l.event_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!enrollment) { setNotFound(true); setLoading(false); return }

      const { data: access } = await supabase
        .from('lecture_access')
        .upsert(
          { lecture_id: params.id, user_id: user.id, accessed_at: new Date().toISOString() } as never,
          { onConflict: 'lecture_id,user_id' },
        )
        .select('seniority_level')
        .single()
      const acc = access as { seniority_level: string | null } | null
      if (acc?.seniority_level) setSeniorityLevel(acc.seniority_level as SeniorityLevel)

      setLecture(l)
      setEventName(l.events?.name ?? 'ScribIA')

      if (l.events?.materials_access_days) {
        const { data: mats } = await supabase.from('lecture_materials').select('id, profile_type, content_type, markdown_content, status, word_count, updated_at').eq('lecture_id', params.id).eq('status', 'completed').order('profile_type')
        const matsArr = (mats ?? []) as Array<ProfileMaterial & { updated_at: string }>
        const latest = matsArr.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
        if (latest) {
          const expiresAt = new Date(new Date(latest.updated_at).getTime() + l.events.materials_access_days * 86400000)
          setMaterialsExpiresAt(expiresAt.toISOString())
          const expired = new Date() > expiresAt
          setMaterialsExpired(expired)
          if (!expired) setMaterials(matsArr)
        }
      } else {
        const { data: mats } = await supabase.from('lecture_materials').select('id, profile_type, content_type, markdown_content, status, word_count').eq('lecture_id', params.id).eq('status', 'completed').order('profile_type')
        setMaterials((mats ?? []) as unknown as ProfileMaterial[])
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (unauthorized) return <Redirect to="/login" />

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-center">
      <div><h1 className="font-heading text-2xl font-bold text-text mb-2">Palestra não encontrada</h1><p className="text-text3 text-sm mb-4">Você não tem acesso a esta palestra.</p><button onClick={() => navigate('/portal')} className="text-purple-light hover:underline text-sm">Voltar ao portal</button></div>
    </div>
  )

  if (!lecture) return null

  const filteredMaterials = seniorityLevel ? materials.filter(m => m.profile_type.startsWith(seniorityLevel)) : materials
  const profileGroups = filteredMaterials.reduce((acc, m) => { if (!acc[m.profile_type]) acc[m.profile_type] = {}; acc[m.profile_type][m.content_type] = m; return acc }, {} as Record<string, { ebook?: ProfileMaterial; playbook?: ProfileMaterial }>)
  const hasMultiProfile = materials.length > 0
  const chipLabel = hasMultiProfile ? `${filteredMaterials.length} materiais` : lecture.ebook_content ? 'E-book Pronto' : lecture.status === 'completed' ? 'Transcrito' : lecture.status === 'processing' ? 'Processando' : 'Agendada'
  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''

  async function handleDownload(type: 'ebook' | 'playbook', profileType?: string) {
    setDownloading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: access } = await supabase.from('lecture_access').select('download_count').eq('lecture_id', lecture!.id).eq('user_id', user.id).maybeSingle()
      const count = (access as { download_count: number } | null)?.download_count ?? 0
      await supabase.from('lecture_access').upsert(
        { lecture_id: lecture!.id, user_id: user.id, download_count: count + 1 } as never,
        { onConflict: 'lecture_id,user_id' },
      )
    }
    const profileParam = profileType ? `&profile=${profileType}` : ''
    window.open(`${apiBase}/api/materials/${lecture!.id}?type=${type}${profileParam}`, '_blank')
    setDownloading(false)
  }

  return (
    <div className="min-h-screen bg-bg">
      <PortalHeader userName={userName} eventName={eventName} />
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-9">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate('/portal')} className="inline-flex items-center gap-1.5 text-[13px] text-text3 hover:text-purple-light transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Minhas Palestras
          </button>
        </div>
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-dim text-purple-light border border-border-purple">{chipLabel}</span>
            {lecture.duration_seconds && <span className="text-[11px] text-text3">{formatDuration(lecture.duration_seconds)}</span>}
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-text leading-tight">{lecture.title}</h1>
          <p className="text-[13px] text-text3 mt-1">{lecture.speakers?.name ?? 'Palestrante'} · {eventName}</p>
        </div>

        {lecture.topics && lecture.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {lecture.topics.map((topic, i) => <span key={i} className="bg-purple-dim border border-border-purple rounded-full px-3 py-1 text-[11px] text-purple-light">{topic}</span>)}
          </div>
        )}

        <div className="flex border-b border-border-subtle mb-5 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-purple text-purple-light' : 'border-transparent text-text3 hover:text-text2'}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {lecture.summary && <div className="bg-bg2 border border-border-subtle rounded-xl p-4 sm:p-5"><h3 className="font-heading text-sm font-bold text-text mb-2">Resumo</h3><p className="text-[13px] text-text2 leading-6">{lecture.summary}</p></div>}
            {materialsExpired && <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl p-4 flex items-center gap-3"><Lock className="w-5 h-5 text-scribia-red shrink-0" /><div><div className="text-[13px] font-medium text-text">Materiais indisponíveis</div><div className="text-[11px] text-text3">O acesso expirou em {materialsExpiresAt ? new Date(materialsExpiresAt).toLocaleDateString('pt-BR') : ''}.</div></div></div>}
            {!materialsExpired && materialsExpiresAt && <div className="bg-scribia-yellow/8 border border-scribia-yellow/20 rounded-xl p-3 flex items-center gap-3"><Clock className="w-4 h-4 text-scribia-yellow shrink-0" /><div className="text-[11px] text-text3">Materiais disponíveis até {new Date(materialsExpiresAt).toLocaleDateString('pt-BR')}</div></div>}
            {lecture.status === 'processing' && <div className="bg-scribia-yellow/8 border border-scribia-yellow/20 rounded-xl p-4 flex items-center gap-3"><Loader2 className="w-5 h-5 text-scribia-yellow animate-spin shrink-0" /><div><div className="text-[13px] font-medium text-text">Conteúdo em processamento...</div><div className="text-[11px] text-text3">Os materiais estarão disponíveis em breve.</div></div></div>}
            {lecture.transcript_text && (
              <div className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden">
                <button onClick={() => setShowTranscript(!showTranscript)} className="w-full flex items-center justify-between p-4 text-left hover:bg-bg3/50 transition-colors">
                  <span className="text-[13px] font-medium text-text">Ver transcrição completa</span>
                  <ChevronDown className={`w-4 h-4 text-text3 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
                </button>
                {showTranscript && <div className="px-4 pb-4"><div className="bg-bg3 border border-border-subtle rounded-lg p-4 max-h-80 overflow-y-auto"><p className="text-[12px] text-text2 leading-relaxed whitespace-pre-wrap">{lecture.transcript_text}</p></div></div>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'player' && (
          lecture.audio_path
            ? <AudioPlayer title={lecture.title} speaker={`${lecture.speakers?.name ?? 'Palestrante'} · ${formatDuration(lecture.duration_seconds)}`} duration={formatDuration(lecture.duration_seconds)} audioUrl={`${apiBase}/api/audio/${lecture.id}`} />
            : <div className="text-center py-16"><Mic className="w-8 h-8 text-text3 mx-auto mb-3" /><p className="text-text3 text-[13px]">Áudio não disponível.</p></div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-5">
            {materialsExpired
              ? <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl p-4 flex items-center gap-3"><Lock className="w-5 h-5 text-scribia-red shrink-0" /><div><div className="text-[13px] font-medium text-text">Acesso encerrado</div><div className="text-[11px] text-text3">O período expirou em {materialsExpiresAt ? new Date(materialsExpiresAt).toLocaleDateString('pt-BR') : ''}.</div></div></div>
              : <>
                  {!seniorityLevel && hasMultiProfile && <SenioritySelector lectureId={lecture.id} userId={userId} onSelect={setSeniorityLevel} />}
                  {hasMultiProfile && seniorityLevel && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-heading text-sm font-bold text-text flex items-center gap-2"><Download className="w-4 h-4 text-purple-light" /> Materiais — {SENIORITY_LABELS[seniorityLevel]}</h3>
                        <button onClick={() => setSeniorityLevel(null)} className="text-[11px] text-text3 hover:text-purple-light transition-colors">Trocar nível</button>
                      </div>
                      {Object.keys(profileGroups).length === 0
                        ? <div className="text-center py-8 bg-bg2 border border-border-subtle rounded-xl"><p className="text-[13px] text-text3">Nenhum material para este nível.</p></div>
                        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(profileGroups).map(([profile, mats]) => (
                              <div key={profile} className="bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors">
                                <div className="text-[13px] font-semibold text-text mb-3">{PROFILE_LABELS[profile] || profile}</div>
                                <div className="space-y-2">
                                  {mats.ebook && <button onClick={() => handleDownload('ebook', profile)} disabled={downloading} className="w-full flex items-center justify-between gap-3 bg-purple-dim border border-purple/20 rounded-lg px-4 py-3 hover:bg-purple/15 transition-colors disabled:opacity-50 group"><div className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-purple-light" /><div className="text-left"><div className="text-[12px] font-medium text-text">Playbook</div>{mats.ebook.word_count && <div className="text-[10px] text-text3">{mats.ebook.word_count.toLocaleString()} palavras</div>}</div></div><div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple rounded-lg px-3 py-1.5 group-hover:bg-purple-light transition-colors"><Download className="w-3.5 h-3.5" /> PDF</div></button>}
                                  {mats.playbook && <button onClick={() => handleDownload('playbook', profile)} disabled={downloading} className="w-full flex items-center justify-between gap-3 bg-purple-dim border border-purple/20 rounded-lg px-4 py-3 hover:bg-purple/15 transition-colors disabled:opacity-50 group"><div className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-purple-light" /><div className="text-left"><div className="text-[12px] font-medium text-text">Live Book</div>{mats.playbook.word_count && <div className="text-[10px] text-text3">{mats.playbook.word_count.toLocaleString()} palavras</div>}</div></div><div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple rounded-lg px-3 py-1.5 group-hover:bg-purple-light transition-colors"><Download className="w-3.5 h-3.5" /> PDF</div></button>}
                                </div>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  )}
                  {!hasMultiProfile && (lecture.ebook_content || lecture.playbook_content) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lecture.ebook_content && <button onClick={() => handleDownload('ebook')} disabled={downloading} className="flex items-center justify-between gap-3 bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors disabled:opacity-50"><div className="flex items-center gap-2.5"><BookOpen className="w-5 h-5 text-purple-light" /><div className="text-left"><div className="text-[12px] font-medium text-text">Playbook</div><div className="text-[10px] text-text3">Baixar PDF</div></div></div><Download className="w-4 h-4 text-text3" /></button>}
                      {lecture.playbook_content && <button onClick={() => handleDownload('playbook')} disabled={downloading} className="flex items-center justify-between gap-3 bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors disabled:opacity-50"><div className="flex items-center gap-2.5"><FileText className="w-5 h-5 text-purple-light" /><div className="text-left"><div className="text-[12px] font-medium text-text">Live Book</div><div className="text-[10px] text-text3">Baixar PDF</div></div></div><Download className="w-4 h-4 text-text3" /></button>}
                    </div>
                  )}
                </>
            }
          </div>
        )}
      </div>
    </div>
  )
}
