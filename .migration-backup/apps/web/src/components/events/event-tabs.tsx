'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { LectureStatusBadge } from '@/components/lectures/lecture-status-badge'
import { LectureFormModal } from '@/components/lectures/lecture-form-modal'
import { LectureImportModal } from '@/components/lectures/lecture-import-modal'
import { SpeakerFormModal } from '@/components/speakers/speaker-form-modal'
import { ParticipantsTab } from '@/components/participants/participants-tab'
import type { LectureStatus } from '@scribia/shared'
import { AnalyticsTab } from '@/components/dashboard/analytics-tab'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Radio, RefreshCw, Upload, Loader2, FileSpreadsheet, Send, AlertTriangle, X } from 'lucide-react'

interface Speaker {
  id: string
  name: string
  email: string | null
  bio: string | null
  company: string | null
  role: string | null
}

interface Lecture {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_at: string | null
  duration_seconds: number | null
  speaker_id: string | null
  speakers: { name: string } | null
}

interface Participant {
  id: string
  user_id: string
  attended: boolean
  registered_at: string
  user_profiles: { full_name: string; email: string } | null
}

interface EventTabsProps {
  eventId: string
  lectures: Lecture[]
  speakers?: Speaker[]
  participants?: Participant[]
}

const TABS = [
  { id: 'lectures', label: 'Palestras' },
  { id: 'speakers', label: 'Palestrantes' },
  { id: 'participants', label: 'Participantes' },
  { id: 'analytics', label: 'Analytics' },
] as const

export function EventTabs({ eventId, lectures, speakers: initialSpeakers = [], participants: initialParticipants = [] }: EventTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('lectures')
  const [showLectureModal, setShowLectureModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSpeakerModal, setShowSpeakerModal] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null)
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string; isLink?: boolean } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const refresh = useCallback(() => {
    router.refresh()
    setShowLectureModal(false)
    setShowSpeakerModal(false)
    setEditingLecture(null)
    setEditingSpeaker(null)
  }, [router])

  async function loadSpeakers() {
    const { data } = await supabase.from('speakers').select('*')
    if (data) setSpeakers(data as unknown as Speaker[])
  }

  async function deleteLecture(id: string) {
    if (!confirm('Excluir esta palestra?')) return
    await supabase.from('lectures').delete().eq('id', id)
    refresh()
  }

  async function deleteSpeaker(id: string) {
    if (!confirm('Excluir este palestrante e desvincular suas palestras?')) return
    // Unlink lectures from this speaker
    await supabase.from('lectures').update({ speaker_id: null } as never).eq('speaker_id', id)
    // Delete speaker via admin API (bypasses RLS on invitations)
    const res = await fetch('/api/delete-speaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speakerId: id }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(`Erro ao excluir: ${data.error}`)
    }
    refresh()
  }

  async function resendInvite(speaker: Speaker) {
    if (!speaker.email) return
    setResendingId(speaker.id)
    setInviteMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setInviteMsg({ type: 'error', text: 'Sessão expirada. Faça login novamente.' })
      setResendingId(null)
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: speaker.email,
        role: 'speaker',
        event_id: eventId,
        speaker_name: speaker.name,
        origin: window.location.origin,
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setInviteMsg({ type: 'error', text: data?.error || `Erro ao enviar convite para ${speaker.email}` })
    } else if (data?.email_sent) {
      setInviteMsg({ type: 'success', text: `Convite enviado para ${speaker.email}` })
    } else if (data?.invite_link) {
      setInviteMsg({ type: 'success', text: data.invite_link, isLink: true })
    } else {
      setInviteMsg({ type: 'success', text: data?.message || `Convite processado para ${speaker.email}` })
    }

    setResendingId(null)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function reprocessSelected() {
    for (const lectureId of selected) {
      await supabase.from('lectures').update({ status: 'processing', processing_progress: 0 } as never).eq('id', lectureId)
    }
    setSelected(new Set())
    refresh()
  }

  // --- Audio Upload ---
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
  const [uploadingLecture, setUploadingLecture] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function handleUploadClick(lectureId: string) {
    uploadTargetRef.current = lectureId
    setUploadError(null)
    fileInputRef.current?.click()
  }

  async function handleAudioFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const lectureId = uploadTargetRef.current
    if (!file || !lectureId) return
    e.target.value = ''

    const MAX_SIZE_MB = 500
    const VALID_EXTENSIONS = ['.mp3', '.wav', '.webm', '.m4a', '.ogg']
    const VALID_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/vorbis']

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidFormat = VALID_EXTENSIONS.includes(ext) || VALID_MIME_TYPES.some(mime => file.type.startsWith(mime)) || file.type === ''

    if (!isValidFormat) {
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'desconhecido'
      setUploadError(`O arquivo "${file.name}" está no formato ${fileExt}, que não é suportado para transcrição. Envie o áudio em MP3, WAV, WebM, M4A ou OGG.`)
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`O arquivo é muito grande (${Math.round(file.size / 1024 / 1024)}MB). O tamanho máximo permitido é ${MAX_SIZE_MB}MB.`)
      return
    }

    setUploadError(null)

    setUploadingLecture(lectureId)
    setUploadProgress(10)

    try {
      const uploadPath = `audio-files/${eventId}/${lectureId}/final.webm`
      setUploadProgress(30)

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(uploadPath, file, { contentType: file.type, upsert: true })

      if (uploadError) throw uploadError
      setUploadProgress(60)

      // Get audio duration
      const audioDuration = await new Promise<number>((resolve) => {
        const audio = new Audio()
        audio.addEventListener('loadedmetadata', () => {
          resolve(Math.round(audio.duration))
          URL.revokeObjectURL(audio.src)
        })
        audio.addEventListener('error', () => {
          resolve(Math.round(file.size / 176000))
          URL.revokeObjectURL(audio.src)
        })
        audio.src = URL.createObjectURL(file)
      })

      await supabase
        .from('lectures')
        .update({
          status: 'processing',
          audio_path: `${eventId}/${lectureId}`,
          audio_duration_seconds: audioDuration,
          processing_progress: 0,
        } as never)
        .eq('id', lectureId)

      setUploadProgress(80)

      // Create processing jobs
      const jobTypes = ['transcription', 'summary', 'ebook', 'playbook', 'card']
      for (const type of jobTypes) {
        await supabase
          .from('processing_jobs')
          .insert({ lecture_id: lectureId, type, status: 'queued' } as never)
      }

      setUploadProgress(100)
      setTimeout(() => {
        setUploadingLecture(null)
        setUploadProgress(0)
        refresh()
      }, 1500)
    } catch (err) {
      alert(`Erro no upload: ${err}`)
      setUploadingLecture(null)
      setUploadProgress(0)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-border-subtle overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'speakers') loadSpeakers() }}
            className={`px-3 sm:px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple text-purple-light'
                : 'border-transparent text-text3 hover:text-text2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {/* ===== LECTURES TAB ===== */}
        {activeTab === 'lectures' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <span className="text-[13px] text-text3">{lectures.length} palestras</span>
              <div className="flex flex-wrap gap-2">
                {selected.size > 0 && (
                  <button
                    onClick={reprocessSelected}
                    className="inline-flex items-center gap-1.5 text-[12px] bg-scribia-yellow/10 border border-scribia-yellow/25 text-scribia-yellow rounded-lg px-3 py-1.5 hover:bg-scribia-yellow/20 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reprocessar ({selected.size})
                  </button>
                )}
                <button
                  onClick={() => { loadSpeakers(); setShowImportModal(true) }}
                  className="inline-flex items-center gap-1.5 text-[12px] bg-transparent border border-border-subtle text-text2 rounded-lg px-3 py-1.5 hover:border-border-purple hover:text-purple-light transition-all"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  Importar Programação
                </button>
                <button
                  onClick={() => { loadSpeakers(); setEditingLecture(null); setShowLectureModal(true) }}
                  className="inline-flex items-center gap-1.5 text-[12px] bg-purple text-white rounded-lg px-3 py-1.5 hover:bg-purple-light glow-purple transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Nova Palestra
                </button>
              </div>
            </div>

            {/* Hidden file input for audio upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.webm,.m4a,.ogg"
              className="hidden"
              onChange={handleAudioFileSelected}
            />

            {/* Upload error banner */}
            {uploadError && (
              <div className="mb-3 bg-scribia-red/8 border border-scribia-red/20 rounded-xl p-3.5 animate-fade-up">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-scribia-red shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-scribia-red font-medium mb-1">Formato de áudio não suportado</p>
                    <p className="text-[12px] text-text2 leading-relaxed">{uploadError}</p>
                  </div>
                  <button
                    onClick={() => setUploadError(null)}
                    className="p-1 rounded-md text-text3 hover:text-text hover:bg-bg3 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload progress banner */}
            {uploadingLecture && (
              <div className="mb-3 bg-purple-dim border border-border-purple rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] text-purple-light font-medium flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {uploadProgress < 100 ? 'Enviando áudio...' : 'Upload concluído!'}
                  </span>
                  <span className="text-[12px] text-purple-light font-mono">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-bg4 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-purple rounded-sm transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {lectures.length > 0 ? (
              <div className="space-y-2">
                {lectures.map((lecture) => {
                  const isUploading = uploadingLecture === lecture.id
                  const canUpload = lecture.status === 'scheduled' || lecture.status === 'recording'

                  return (
                    <div
                      key={lecture.id}
                      className={`flex flex-wrap sm:flex-nowrap items-center gap-3 bg-bg2 border border-border-subtle rounded-xl p-3.5 transition-all hover:border-border-purple ${isUploading ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(lecture.id)}
                        onChange={() => toggleSelect(lecture.id)}
                        className="h-4 w-4 rounded border-border-subtle bg-bg3 accent-purple shrink-0"
                      />
                      <Link href={`/dashboard/lectures/${lecture.id}`} className="flex-1 min-w-0 cursor-pointer order-3 sm:order-none w-full sm:w-auto">
                        <p className="font-heading font-semibold text-[13px] text-text hover:text-purple-light transition-colors break-words">
                          {lecture.title}
                        </p>
                        <p className="text-[12px] text-text3 mt-0.5 break-words">
                          {lecture.speakers?.name ?? 'Sem palestrante'}
                          {lecture.scheduled_at && ` — ${new Date(lecture.scheduled_at).toLocaleString('pt-BR')}`}
                          {lecture.duration_seconds && ` (${Math.round(lecture.duration_seconds / 60)}min)`}
                        </p>
                      </Link>
                      <LectureStatusBadge status={lecture.status as LectureStatus} />
                      <div className="flex gap-1.5 ml-auto sm:ml-0">
                        {canUpload && (
                          <button
                            onClick={() => handleUploadClick(lecture.id)}
                            disabled={isUploading}
                            className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-scribia-green/40 hover:bg-scribia-green/8 hover:text-scribia-green transition-all"
                            title="Importar arquivo de áudio"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => { loadSpeakers(); setEditingLecture(lecture); setShowLectureModal(true) }}
                          className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-border-purple hover:bg-purple-dim hover:text-purple-light transition-all"
                          title="Editar"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteLecture(lecture.id)}
                          className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-scribia-red/40 hover:bg-scribia-red/8 hover:text-scribia-red transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <a
                          href={`scribia://capture/${eventId}/${lecture.id}`}
                          className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-border-purple hover:bg-purple-dim hover:text-purple-light transition-all"
                          title="Abrir no desktop para gravação"
                        >
                          <Radio className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-purple-dim border border-border-purple flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-5 h-5 text-purple-light" />
                </div>
                <p className="text-text3 text-[13px]">
                  Nenhuma palestra cadastrada.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== SPEAKERS TAB ===== */}
        {activeTab === 'speakers' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <span className="text-[13px] text-text3">{speakers.length} palestrantes</span>
              <button
                onClick={() => { setEditingSpeaker(null); setShowSpeakerModal(true) }}
                className="inline-flex items-center gap-1.5 text-[12px] bg-purple text-white rounded-lg px-3 py-1.5 hover:bg-purple-light glow-purple transition-all"
              >
                <Plus className="w-3 h-3" />
                Novo Palestrante
              </button>
            </div>

            {/* Invite feedback */}
            {inviteMsg && (
              <div className={`rounded-xl px-4 py-3 mb-4 text-[13px] ${
                inviteMsg.type === 'success'
                  ? 'bg-green-500/8 border border-green-500/20 text-green-400'
                  : 'bg-scribia-red/8 border border-scribia-red/20 text-scribia-red'
              }`}>
                {inviteMsg.isLink ? (
                  <div>
                    <p className="flex items-center gap-2 mb-2">
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      Email nao enviado (rate limit). Copie o link e envie manualmente:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={inviteMsg.text}
                        className="flex-1 bg-bg1 border border-border-subtle rounded px-2.5 py-1.5 text-[12px] text-text2 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(inviteMsg.text)}
                        className="px-3 py-1.5 rounded bg-purple text-white text-[12px] font-medium hover:bg-purple-light transition-all shrink-0"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {inviteMsg.type === 'success' ? <Send className="w-3.5 h-3.5 shrink-0" /> : null}
                    {inviteMsg.text}
                  </div>
                )}
              </div>
            )}

            {speakers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="flex items-center gap-3 bg-bg2 border border-border-subtle rounded-xl p-3.5 transition-all hover:border-border-purple"
                  >
                    <div className="w-9 h-9 rounded-full bg-purple-dim border border-border-purple flex items-center justify-center text-[11px] font-heading font-bold text-purple-light shrink-0">
                      {speaker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] text-text">{speaker.name}</p>
                      <p className="text-[11px] text-text3 truncate">
                        {[speaker.role, speaker.company].filter(Boolean).join(' — ') || 'Sem informações'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {speaker.email && (
                        <button
                          onClick={() => resendInvite(speaker)}
                          disabled={resendingId === speaker.id}
                          className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-green-500/40 hover:bg-green-500/8 hover:text-green-400 transition-all disabled:opacity-50"
                          title={`Reenviar convite para ${speaker.email}`}
                        >
                          {resendingId === speaker.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Send className="w-3 h-3" />
                          }
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingSpeaker(speaker); setShowSpeakerModal(true) }}
                        className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-border-purple hover:bg-purple-dim hover:text-purple-light transition-all"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteSpeaker(speaker.id)}
                        className="w-7 h-7 rounded-md bg-bg3 border border-border-subtle flex items-center justify-center text-text2 hover:border-scribia-red/40 hover:bg-scribia-red/8 hover:text-scribia-red transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text3 text-center py-12 text-[13px]">
                Nenhum palestrante cadastrado.
              </p>
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <ParticipantsTab
            eventId={eventId}
            participants={initialParticipants}
            lectureIds={lectures.map((l) => l.id)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab eventId={eventId} />
        )}
      </div>

      {/* ===== MODALS ===== */}
      {showLectureModal && (
        <LectureFormModal
          eventId={eventId}
          speakers={speakers}
          lecture={editingLecture ? {
            id: editingLecture.id,
            title: editingLecture.title,
            description: editingLecture.description,
            speaker_id: editingLecture.speaker_id,
            scheduled_at: editingLecture.scheduled_at,
            duration_seconds: editingLecture.duration_seconds,
          } : undefined}
          onClose={() => setShowLectureModal(false)}
          onSaved={refresh}
          onCreateSpeaker={() => { setShowLectureModal(false); setEditingSpeaker(null); setShowSpeakerModal(true) }}
        />
      )}

      {showSpeakerModal && (
        <SpeakerFormModal
          speaker={editingSpeaker ?? undefined}
          eventId={eventId}
          onClose={() => setShowSpeakerModal(false)}
          onSaved={() => { loadSpeakers(); refresh() }}
        />
      )}

      {showImportModal && (
        <LectureImportModal
          eventId={eventId}
          existingSpeakers={speakers}
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); refresh() }}
        />
      )}
    </div>
  )
}
