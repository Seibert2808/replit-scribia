'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { LectureStatusBadge } from './lecture-status-badge'
import type { LectureStatus } from '@scribia/shared'
import {
  CheckCircle,
  RefreshCw,
  FileText,
  BookOpen,
  Clock,
  Mic,
  User,
  Sparkles,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { ProfileSelection, DEFAULT_PROFILES } from './profile-selection'
import { ProfileMaterialsView } from './profile-materials-view'
import { CardPreview } from './card-preview'
import { AudioEditor } from './audio-editor'

interface LectureData {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_at: string | null
  duration_seconds: number | null
  audio_path: string | null
  audio_duration_seconds: number | null
  transcript_text: string | null
  summary: string | null
  topics: string[] | null
  ebook_url: string | null
  playbook_url: string | null
  card_image_url: string | null
  card_images: string[] | null
  processing_progress: number
  event_id: string
  speaker_id: string | null
  speakers: { name: string; email: string | null } | null
  events: { id: string; name: string } | null
}

interface SpeakerOption {
  id: string
  name: string
}

interface Props {
  lecture: LectureData
  audioUrl: string | null
  audioChunkCount: number
  eventId: string
  speakers?: SpeakerOption[]
}

export function LectureDetailClient({ lecture, audioUrl, audioChunkCount, eventId: _eventId, speakers = [] }: Props) {
  const [currentStatus, setCurrentStatus] = useState(lecture.status)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [genProgress, setGenProgress] = useState(lecture.processing_progress)
  const [genError, setGenError] = useState<string | null>(null)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(DEFAULT_PROFILES)
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({
    transcribe: !!lecture.transcript_text,
    summarize: !!lecture.summary,
    ebook: !!lecture.ebook_url,
    playbook: !!lecture.playbook_url,
  })
  // Inline editing state
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function saveField(field: string, value?: string | null) {
    const val = value !== undefined ? value : editValue
    const payload: Record<string, unknown> = {}

    if (field === 'duration_seconds') {
      const n = Number(val)
      payload[field] = val === '' || isNaN(n) || n <= 0 ? null : n
    } else if (field === 'speaker_id') {
      payload[field] = val || null
    } else {
      payload[field] = val || null
    }

    await supabase.from('lectures').update(payload as never).eq('id', lecture.id)
    setEditing(null)
    router.refresh()
  }

  function startEdit(field: string, currentValue: string) {
    setEditing(field)
    setEditValue(currentValue || '')
  }

  const handleMarkComplete = useCallback(async () => {
    setLoading(true)
    await supabase
      .from('lectures')
      .update({ status: 'completed', processing_progress: 100 } as never)
      .eq('id', lecture.id)
    setCurrentStatus('completed')
    setLoading(false)
    router.refresh()
  }, [supabase, lecture.id, router])

  const handleReprocess = async () => {
    // Reset status and trigger full processing pipeline
    setLoading(true)
    await supabase
      .from('lectures')
      .update({ status: 'processing', processing_progress: 0 } as never)
      .eq('id', lecture.id)
    setCurrentStatus('processing')
    setLoading(false)
    // Trigger the actual processing
    handleGenerateAll()
  }



  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sessão expirada. Faça login novamente.')
    return session
  }, [supabase])

  const callProcessLecture = useCallback(async (session: { access_token: string }, body: Record<string, unknown>) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const res = await fetch(`${supabaseUrl}/functions/v1/process-lecture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    if (!res.ok) {
      if (res.status === 546) throw new Error('Timeout: a geração demorou demais. Tente novamente.')
      throw new Error(data.error || `Erro ${res.status}`)
    }
    return data
  }, [])

  const handleTranscribe = useCallback(async () => {
    setGenerating(true)
    setActiveStep('transcribe')
    setGenError(null)
    setCurrentStatus('processing')
    try {
      const session = await getSession()
      let chunkStart = 0
      let hasMore = true
      let totalChunks = audioChunkCount || 100

      while (hasMore) {
        console.log(`Transcribing chunk ${chunkStart + 1}...`)
        setGenProgress(Math.round((chunkStart / totalChunks) * 100))
        const result = await callProcessLecture(session, {
          lecture_id: lecture.id,
          steps: ['transcribe'],
          chunk_start: chunkStart,
          chunk_end: chunkStart + 1, // 1 chunk per call
        })
        console.log('transcribe result:', result)
        if (result.total_chunks) totalChunks = result.total_chunks

        if (result.partial) {
          chunkStart = result.next_chunk_start
        } else {
          hasMore = false
        }
      }

      setGenProgress(100)
      setStepsDone(prev => ({ ...prev, transcribe: true }))
      setCurrentStatus('processing')
      // Reload to show updated data from server
      window.location.reload()
    } catch (e) {
      console.error('transcribe error:', e)
      setGenError(`Transcrição: ${e instanceof Error ? e.message : e}`)
      setCurrentStatus('failed')
    }
    setGenerating(false)
    setActiveStep(null)
  }, [getSession, callProcessLecture, lecture.id, audioChunkCount])

  const handleSummarize = useCallback(async () => {
    setGenerating(true)
    setActiveStep('summarize')
    setGenError(null)
    setGenProgress(0)
    setCurrentStatus('processing')
    try {
      const session = await getSession()
      let chunkStart = 0
      let hasMore = true

      while (hasMore) {
        console.log(`Summarizing chunk ${chunkStart}...`)
        setGenProgress(Math.round((chunkStart / Math.max(chunkStart + 1, 1)) * 80))
        const result = await callProcessLecture(session, {
          lecture_id: lecture.id,
          steps: ['summarize'],
          chunk_start: chunkStart,
        })
        console.log('summarize result:', result)

        if (result.partial) {
          chunkStart = result.next_chunk_start
          setGenProgress(Math.round((chunkStart / result.total_chunks) * 80))
        } else {
          hasMore = false
        }
      }

      setGenProgress(100)
      setStepsDone(prev => ({ ...prev, summarize: true }))
      window.location.reload()
    } catch (e) {
      console.error('summarize error:', e)
      setGenError(`Resumo: ${e instanceof Error ? e.message : e}`)
      setCurrentStatus('failed')
    }
    setGenerating(false)
    setActiveStep(null)
  }, [getSession, callProcessLecture, lecture.id])

  const handleGenerateProfiles = useCallback(async () => {
    // Build queue locally from selected profiles — no backend round-trip needed
    const profilesToUse = selectedProfiles.length > 0 ? selectedProfiles : DEFAULT_PROFILES
    const queue: Array<{ profileType: string; contentType: 'ebook' | 'playbook' }> = []
    for (const profile of profilesToUse) {
      queue.push({ profileType: profile, contentType: 'ebook' })
      queue.push({ profileType: profile, contentType: 'playbook' })
    }

    setGenerating(true)
    setActiveStep('ebook')
    setGenError(null)
    setGenProgress(0)
    setCurrentStatus('processing')
    try {
      const session = await getSession()

      // Iterate through queue: one call per profile/type
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i]
        console.log(`Generating: ${item.profileType} / ${item.contentType} (${i + 1}/${queue.length})...`)
        setActiveStep(item.contentType === 'ebook' ? 'ebook' : 'playbook')

        const result = await callProcessLecture(session, {
          lecture_id: lecture.id,
          steps: ['generate_profile'],
          profile_type: item.profileType,
          content_type: item.contentType,
          selected_profiles: profilesToUse,
        })

        setGenProgress(Math.round(((i + 1) / queue.length) * 100))

        if (!result.success && result.profile_result?.error) {
          console.warn(`Warning: ${item.profileType}/${item.contentType} failed:`, result.profile_result.error)
        }
      }

      setGenProgress(100)
      setStepsDone(prev => ({ ...prev, ebook: true, playbook: true }))
      setCurrentStatus('completed')
      window.location.reload()
    } catch (e) {
      console.error('Profile generation error:', e)
      setGenError(`Geracao de livebooks: ${e instanceof Error ? e.message : e}`)
      setCurrentStatus('failed')
    }
    setGenerating(false)
    setActiveStep(null)
  }, [getSession, callProcessLecture, lecture.id, selectedProfiles])

  const handleGenerateAll = useCallback(async () => {
    setGenError(null)

    if (!stepsDone.transcribe) {
      await handleTranscribe()
      if (genError) return
    }

    if (!stepsDone.summarize) {
      await handleSummarize()
      if (genError) return
    }

    // Use multi-profile pipeline
    await handleGenerateProfiles()
  }, [stepsDone, handleTranscribe, handleSummarize, handleGenerateProfiles, genError])

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}min ${s}s`
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Não agendada'
    return new Date(dateStr).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-up">
      {/* Header — editable */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing === 'title' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-heading text-[20px] sm:text-[22px] font-extrabold text-text bg-transparent border-b-2 border-purple outline-none flex-1 min-w-0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveField('title')}
              />
              <button onClick={() => saveField('title')} className="p-1.5 rounded-lg bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg bg-bg3 text-text3 hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h1
              className="font-heading text-[20px] sm:text-[22px] md:text-[24px] font-extrabold text-text leading-tight break-words cursor-pointer hover:text-purple-light transition-colors"
              onClick={() => startEdit('title', lecture.title)}
              title="Clique para editar título"
            >
              {lecture.title}
              <Pencil className="w-3.5 h-3.5 inline ml-2 opacity-30" />
            </h1>
          )}
          {editing === 'description' ? (
            <div className="mt-2">
              <textarea
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value)
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = el.scrollHeight + 'px'
                }}
                ref={(el) => {
                  if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
                }}
                className="w-full bg-bg2 border border-purple/30 rounded-xl p-3 text-text text-[13px] leading-relaxed outline-none focus:border-purple/60 resize-none"
                autoFocus
              />
              <div className="flex gap-3 mt-2">
                <button onClick={() => saveField('description')} className="inline-flex items-center gap-1.5 bg-purple-dim text-purple-light rounded-lg px-3 py-1.5 text-[12px] font-medium hover:bg-purple/20 transition-colors">
                  <Check className="w-3.5 h-3.5" /> Salvar
                </button>
                <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 text-[12px] text-text3 hover:text-text rounded-lg px-3 py-1.5 transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p
              className="text-[13px] text-text3 mt-1 cursor-pointer hover:text-purple-light transition-colors"
              onClick={() => startEdit('description', lecture.description || '')}
              title="Clique para editar descrição"
            >
              {lecture.description || 'Adicionar descrição...'}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <LectureStatusBadge status={currentStatus as LectureStatus} />
        </div>
      </div>

      {/* Metadata cards — editable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Speaker — editable */}
        <div
          className="bg-bg2 border border-border-subtle rounded-xl p-3 sm:p-4 cursor-pointer hover:border-border-purple transition-all"
          onClick={() => {
            if (editing !== 'speaker_id') {
              setEditing('speaker_id')
              setEditValue(lecture.speaker_id || '')
            }
          }}
          title="Clique para trocar palestrante"
        >
          <div className="flex items-center gap-2 text-text3 mb-2">
            <User className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Palestrante</span>
          </div>
          {editing === 'speaker_id' ? (
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-bg3 border border-border-subtle rounded-lg px-2 py-1.5 text-[12px] text-text outline-none focus:border-border-purple"
                autoFocus
              >
                <option value="">Sem palestrante</option>
                {speakers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <button onClick={() => saveField('speaker_id')} className="p-1 rounded-md bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditing(null)} className="p-1 rounded-md bg-bg3 text-text3 hover:text-text transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-text font-medium flex items-center gap-1">
              {lecture.speakers?.name ?? 'Não atribuído'}
              <Pencil className="w-3 h-3 opacity-30" />
            </p>
          )}
        </div>

        {/* Scheduled date — editable */}
        <div
          className="bg-bg2 border border-border-subtle rounded-xl p-3 sm:p-4 cursor-pointer hover:border-border-purple transition-all"
          onClick={() => {
            if (editing !== 'scheduled_at') {
              setEditing('scheduled_at')
              setEditValue(lecture.scheduled_at?.slice(0, 16) || '')
            }
          }}
          title="Clique para editar data/hora"
        >
          <div className="flex items-center gap-2 text-text3 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Agendada</span>
          </div>
          {editing === 'scheduled_at' ? (
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="datetime-local"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-bg3 border border-border-subtle rounded-lg px-2 py-1.5 text-[12px] text-text outline-none focus:border-border-purple"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button onClick={() => saveField('scheduled_at')} className="p-1 rounded-md bg-purple-dim text-purple-light hover:bg-purple/20 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditing(null)} className="p-1 rounded-md bg-bg3 text-text3 hover:text-text transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-text font-medium flex items-center gap-1">
              {formatDate(lecture.scheduled_at)}
              <Pencil className="w-3 h-3 opacity-30" />
            </p>
          )}
        </div>

        {/* Audio — read-only */}
        <div className="bg-bg2 border border-border-subtle rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-text3 mb-2">
            <Mic className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Áudio</span>
          </div>
          <p className="text-[13px] text-text font-medium">
            {audioChunkCount > 0 ? `${audioChunkCount} chunks` : 'Sem áudio'}
          </p>
        </div>

        {/* Progress — read-only */}
        <div className="bg-bg2 border border-border-subtle rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-text3 mb-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Progresso</span>
          </div>
          <p className="text-[13px] text-text font-medium">{lecture.processing_progress}%</p>
        </div>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
          <div className="font-heading text-[14px] font-bold text-text mb-4 flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-light" />
            Áudio da palestra
          </div>
          <audio
            src={audioUrl}
            controls
            className="w-full"
            style={{ filter: 'invert(1) hue-rotate(180deg)', opacity: 0.8 }}
          />
          <p className="text-[11px] text-text3 mt-2">
            {audioChunkCount} chunks concatenados · Duração estimada: {formatDuration(lecture.audio_duration_seconds)}
          </p>
        </div>
      )}

      {/* Audio editor: manage/replace/delete */}
      {audioChunkCount > 0 && (
        <AudioEditor
          lectureId={lecture.id}
          eventId={lecture.event_id}
          hasAudio={audioChunkCount > 0}
          onAudioDeleted={() => window.location.reload()}
        />
      )}

      {!audioUrl && audioChunkCount === 0 && (
        <div className="bg-bg2 border border-border-subtle rounded-2xl p-6 sm:p-8 text-center">
          <Mic className="w-8 h-8 text-text3 mx-auto mb-3" />
          <p className="text-[13px] text-text3">Nenhum áudio gravado ainda.</p>
          <p className="text-[11px] text-text3 mt-1">O palestrante precisa gravar pelo app desktop ou faça upload manualmente.</p>
          <div className="mt-4">
            <AudioEditor
              lectureId={lecture.id}
              eventId={lecture.event_id}
              hasAudio={false}
            />
          </div>
        </div>
      )}

      {/* Transcript */}
      {lecture.transcript_text && (
        <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
          <div className="font-heading text-[14px] font-bold text-text mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-light" />
            Transcrição
          </div>
          <div className="bg-bg3 border border-border-subtle rounded-xl p-4 max-h-64 overflow-y-auto">
            <p className="text-[13px] text-text2 leading-relaxed whitespace-pre-wrap">
              {lecture.transcript_text}
            </p>
          </div>
        </div>
      )}

      {/* Summary + Topics */}
      {lecture.summary && (
        <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
          <div className="font-heading text-[14px] font-bold text-text mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-light" />
            Resumo
          </div>
          <p className="text-[13px] text-text2 leading-relaxed">{lecture.summary}</p>
          {lecture.topics && lecture.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {lecture.topics.map((topic, i) => (
                <span key={i} className="bg-purple-dim border border-border-purple rounded-full px-3 py-1 text-[11px] text-purple-light">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unified AI Processing Card */}
      {audioChunkCount > 0 && (
        <div className="bg-bg2 border border-border-subtle rounded-2xl p-4 sm:p-6">
          <div className="font-heading text-[14px] font-bold text-text mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-light" />
            Processamento com IA
          </div>

          {/* Progress bar */}
          {generating && activeStep && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[12px] text-text2">
                  {activeStep === 'transcribe' && 'Transcrevendo audio...'}
                  {activeStep === 'summarize' && 'Gerando resumo...'}
                  {activeStep === 'ebook' && 'Gerando playbooks...'}
                  {activeStep === 'playbook' && 'Gerando live books...'}
                </span>
                <span className="text-[12px] text-purple-light font-mono">{genProgress}%</span>
              </div>
              <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple rounded-full transition-all duration-500"
                  style={{ width: `${genProgress}%` }}
                />
              </div>
            </div>
          )}

          {genError && (
            <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl px-4 py-3 mb-4 text-[12px] text-scribia-red">
              {genError}
            </div>
          )}

          {/* Step 1 & 2: Transcription + Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            <button
              onClick={handleTranscribe}
              disabled={generating}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium transition-all cursor-pointer disabled:opacity-50 text-left ${
                stepsDone.transcribe
                  ? 'bg-scribia-green/10 border border-scribia-green/30 text-scribia-green'
                  : 'bg-purple/10 border border-purple/30 text-purple-light hover:bg-purple/20'
              }`}
            >
              {activeStep === 'transcribe' ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : stepsDone.transcribe ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 shrink-0" />
              )}
              <div>
                <div>{stepsDone.transcribe ? 'Transcricao concluida' : 'Gerar transcricao'}</div>
                <div className="text-[10px] opacity-70">{audioChunkCount} chunks de audio</div>
              </div>
            </button>

            <button
              onClick={handleSummarize}
              disabled={generating || !stepsDone.transcribe}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium transition-all cursor-pointer disabled:opacity-50 text-left ${
                stepsDone.summarize
                  ? 'bg-scribia-green/10 border border-scribia-green/30 text-scribia-green'
                  : stepsDone.transcribe
                    ? 'bg-purple/10 border border-purple/30 text-purple-light hover:bg-purple/20'
                    : 'bg-bg3 border border-border-subtle text-text3'
              }`}
            >
              {activeStep === 'summarize' ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : stepsDone.summarize ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 shrink-0" />
              )}
              <div>
                <div>{stepsDone.summarize ? 'Resumo concluido' : 'Gerar resumo'}</div>
                <div className="text-[10px] opacity-70">Resumo + topicos da palestra</div>
              </div>
            </button>
          </div>

          {/* Divider: Livebook Configuration (only visible after summary) */}
          {stepsDone.summarize && (
            <>
              <div className="border-t border-border-subtle my-4" />
              <div className="text-[12px] text-text3 uppercase tracking-wider mb-3">Configuração dos Materiais</div>

              {/* Profile Selection — inline */}
              <ProfileSelection
                lectureId={lecture.id}
                disabled={generating}
                onProfilesLoaded={setSelectedProfiles}
              />

              {/* Generate button */}
              <div className="mt-5">
                <button
                  onClick={handleGenerateAll}
                  disabled={generating || selectedProfiles.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple to-purple-light text-white px-5 py-3.5 rounded-xl text-[13px] font-semibold shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-40 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {generating && (activeStep === 'ebook' || activeStep === 'playbook') ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generating ? 'Gerando...' : `Gerar Materiais (${selectedProfiles.length} ${selectedProfiles.length === 1 ? 'perfil' : 'perfis'})`}
                </button>
              </div>

              {/* Profile Materials — inline results */}
              <div className="mt-4">
                <ProfileMaterialsView
                  lectureId={lecture.id}
                  selectedProfiles={selectedProfiles}
                />
              </div>

              {/* Cards de Divulgação */}
              <div className="mt-4">
                <CardPreview
                  lectureId={lecture.id}
                  lectureTitle={lecture.title}
                  speakerName={lecture.speakers?.name ?? ''}
                  cardImageUrl={lecture.card_image_url}
                  cardImages={lecture.card_images}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
        {(currentStatus === 'processing' || currentStatus === 'scheduled' || currentStatus === 'recording') && audioChunkCount > 0 && (
          <button
            onClick={handleMarkComplete}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-scribia-green text-white px-5 py-2.5 rounded-xl text-[13px] font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Marcar como Concluída'}
          </button>
        )}

        {currentStatus === 'completed' && (
          <button
            onClick={handleReprocess}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-scribia-yellow/15 border border-scribia-yellow/30 text-scribia-yellow px-5 py-2.5 rounded-xl text-[13px] font-medium hover:bg-scribia-yellow/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Reprocessando...' : 'Reprocessar'}
          </button>
        )}

        {currentStatus === 'failed' && (
          <button
            onClick={handleReprocess}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-scribia-red/15 border border-scribia-red/30 text-scribia-red px-5 py-2.5 rounded-xl text-[13px] font-medium hover:bg-scribia-red/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Reprocessando...' : 'Tentar novamente'}
          </button>
        )}
      </div>
    </div>
  )
}
