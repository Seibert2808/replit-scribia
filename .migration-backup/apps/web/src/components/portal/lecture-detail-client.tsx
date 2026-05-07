'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { AudioPlayer } from './audio-player'
import { Chip } from '@/components/ui/chip'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Mic,
  Download,
  ChevronDown,
  Loader2,
  Lock,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { SenioritySelector } from './seniority-selector'

type SeniorityLevel = 'junior' | 'pleno' | 'senior'

interface LectureDetailClientProps {
  lectureId: string
  userId: string
  title: string
  speaker: string
  eventName: string
  eventId: string
  duration: number | null
  status: string
  summary: string | null
  topics: string[] | null
  ebookContent: string | null
  playbookContent: string | null
  transcript: string | null
  audioUrl: string | null
  materialsExpired?: boolean
  materialsExpiresAt?: string | null
  seniorityLevel?: string | null
  serverMaterials?: ProfileMaterial[]
}

interface ProfileMaterial {
  id: string
  profile_type: string
  content_type: 'ebook' | 'playbook'
  markdown_content: string | null
  status: string
  word_count: number | null
}

const PROFILE_LABELS: Record<string, string> = {
  junior_compact: 'Junior Compacto',
  junior_complete: 'Junior Completo',
  pleno_compact: 'Pleno Compacto',
  pleno_complete: 'Pleno Completo',
  senior_compact: 'Senior Compacto',
  senior_complete: 'Senior Completo',
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`
  return `${m}min`
}

const TABS = [
  { id: 'overview', label: 'Visao Geral', icon: FileText },
  { id: 'player', label: 'Audio', icon: Mic },
  { id: 'materials', label: 'Materiais', icon: BookOpen },
] as const

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Iniciante',
  pleno: 'Intermediário',
  senior: 'Avançado',
}

export function LectureDetailClient({
  lectureId,
  userId,
  title,
  speaker,
  eventName,
  eventId: _eventId,
  duration,
  status,
  summary,
  topics,
  ebookContent,
  playbookContent,
  transcript,
  audioUrl,
  materialsExpired = false,
  materialsExpiresAt,
  seniorityLevel: initialSeniorityLevel,
  serverMaterials = [],
}: LectureDetailClientProps) {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [showTranscript, setShowTranscript] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [seniority, setSeniority] = useState<SeniorityLevel | null>(
    (initialSeniorityLevel as SeniorityLevel) ?? null
  )
  const supabase = createClient()

  // Use server-provided materials (fetched with admin client, bypasses RLS)
  const allMaterials = serverMaterials

  // Filter materials by seniority level
  const materials = useMemo(() => {
    if (!seniority) return allMaterials
    return allMaterials.filter((m) => m.profile_type.startsWith(seniority))
  }, [allMaterials, seniority])

  // Group materials by profile
  const profileGroups = useMemo(() => {
    const groups: Record<string, { ebook?: ProfileMaterial; playbook?: ProfileMaterial }> = {}
    for (const m of materials) {
      if (!groups[m.profile_type]) groups[m.profile_type] = {}
      groups[m.profile_type][m.content_type] = m
    }
    return groups
  }, [materials])

  const hasMultiProfile = allMaterials.length > 0

  const chipVariant = hasMultiProfile ? 'purple' : ebookContent ? 'purple' : status === 'completed' ? 'green' : status === 'processing' ? 'yellow' : 'default'
  const chipLabel = hasMultiProfile ? `${materials.length} materiais` : ebookContent ? 'E-book Pronto' : status === 'completed' ? 'Transcrito' : status === 'processing' ? 'Processando' : 'Agendada'

  async function handleDownload(type: 'ebook' | 'playbook', profileType?: string) {
    setDownloading(true)
    try {
      // Track download — fetch current count and increment
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: access } = await supabase
          .from('lecture_access')
          .select('download_count')
          .eq('lecture_id', lectureId)
          .eq('user_id', user.id)
          .single()
        const currentCount = (access as { download_count: number } | null)?.download_count ?? 0
        await supabase
          .from('lecture_access')
          .update({ download_count: currentCount + 1 } as never)
          .eq('lecture_id', lectureId)
          .eq('user_id', user.id)
      }
      // Open PDF
      const profileParam = profileType ? `&profile=${profileType}` : ''
      window.open(`/api/materials/${lectureId}?type=${type}${profileParam}`, '_blank')
    } catch (e) {
      console.error('Download error:', e)
    }
    setDownloading(false)
  }

  return (
    <div className="animate-fade-up">
      {/* Back navigation */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-[13px] text-text3 hover:text-purple-light transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Minhas Palestras
        </Link>
        <nav className="hidden sm:flex items-center gap-1.5 text-[11px] text-text3">
          <Link href="/portal" className="hover:text-purple-light transition-colors">Portal</Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[120px]">{eventName}</span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-text2 truncate max-w-[200px]">{title}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Chip variant={chipVariant}>{chipLabel}</Chip>
          {duration && <span className="text-[11px] text-text3">{formatDuration(duration)}</span>}
        </div>
        <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-text leading-tight break-words">{title}</h1>
        <p className="text-[13px] text-text3 mt-1 break-words">
          {speaker} · {eventName}
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-bg2 border border-border-subtle rounded-xl p-4 sm:p-5 mb-4">
          <h3 className="font-heading text-sm font-bold text-text mb-2">Resumo</h3>
          <p className="text-[13px] text-text2 leading-6">{summary}</p>
        </div>
      )}

      {/* Topics */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {topics.map((topic, i) => (
            <span key={i} className="bg-purple-dim border border-border-purple rounded-full px-3 py-1 text-[11px] text-purple-light">
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle mb-5 sm:mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple text-purple-light'
                : 'border-transparent text-text3 hover:text-text2'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Audio preview */}
          {audioUrl && (
            <AudioPlayer
              title={title}
              speaker={`${speaker} · ${formatDuration(duration)}`}
              duration={formatDuration(duration)}
              audioUrl={audioUrl}
            />
          )}

          {/* Materials expiration notice */}
          {materialsExpired && (
            <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-scribia-red shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-text">Materiais indisponíveis</div>
                <div className="text-[11px] text-text3">
                  O acesso aos materiais expirou em {materialsExpiresAt ? new Date(materialsExpiresAt).toLocaleDateString('pt-BR') : ''}.
                </div>
              </div>
            </div>
          )}
          {!materialsExpired && materialsExpiresAt && (
            <div className="bg-scribia-yellow/8 border border-scribia-yellow/20 rounded-xl p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-scribia-yellow shrink-0" />
              <div className="text-[11px] text-text3">
                Materiais disponíveis até {new Date(materialsExpiresAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}

          {/* Materials cards */}
          {!materialsExpired && (hasMultiProfile || ebookContent || playbookContent) && (
            <div className="bg-bg2 border border-border-subtle rounded-xl p-4 sm:p-5">
              <h3 className="font-heading text-sm font-bold text-text mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-light" />
                Materiais disponiveis
                {seniority && (
                  <span className="text-[11px] font-normal text-text3">— {SENIORITY_LABELS[seniority]}</span>
                )}
              </h3>
              {hasMultiProfile && !seniority ? (
                <div className="text-center py-3">
                  <p className="text-[12px] text-text3 mb-2">Escolha seu nível para ver os materiais personalizados</p>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-purple-light bg-purple-dim rounded-lg px-4 py-2 hover:bg-purple/20 transition-colors cursor-pointer"
                  >
                    Escolher meu perfil
                  </button>
                </div>
              ) : hasMultiProfile && seniority ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(profileGroups).map(([profile, mats]) => (
                    <div key={profile} className="bg-bg3 border border-border-subtle rounded-lg p-3">
                      <div className="text-[12px] font-medium text-text mb-2">{PROFILE_LABELS[profile] || profile}</div>
                      <div className="flex gap-2">
                        {mats.ebook && (
                          <button
                            onClick={() => setActiveTab('materials')}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] text-purple-light bg-purple-dim rounded-md px-2 py-1.5 hover:bg-purple/20 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" /> Playbook
                          </button>
                        )}
                        {mats.playbook && (
                          <button
                            onClick={() => setActiveTab('materials')}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] text-purple-light bg-purple-dim rounded-md px-2 py-1.5 hover:bg-purple/20 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3" /> Live Book
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ebookContent && (
                    <button
                      onClick={() => setActiveTab('materials')}
                      className="flex items-center gap-3 bg-bg3 border border-border-subtle rounded-lg p-3 hover:border-border-purple transition-all cursor-pointer text-left"
                    >
                      <BookOpen className="w-5 h-5 text-purple-light shrink-0" />
                      <div>
                        <div className="text-[12px] font-medium text-text">Playbook</div>
                        <div className="text-[10px] text-text3">Ler ou baixar PDF</div>
                      </div>
                    </button>
                  )}
                  {playbookContent && (
                    <button
                      onClick={() => setActiveTab('materials')}
                      className="flex items-center gap-3 bg-bg3 border border-border-subtle rounded-lg p-3 hover:border-border-purple transition-all cursor-pointer text-left"
                    >
                      <FileText className="w-5 h-5 text-purple-light shrink-0" />
                      <div>
                        <div className="text-[12px] font-medium text-text">Live Book</div>
                        <div className="text-[10px] text-text3">Interativo com checklist</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Processing status */}
          {status === 'processing' && (
            <div className="bg-scribia-yellow/8 border border-scribia-yellow/20 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-scribia-yellow animate-spin shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-text">Conteudo em processamento...</div>
                <div className="text-[11px] text-text3">Os materiais estarao disponiveis em breve.</div>
              </div>
            </div>
          )}

          {/* Transcript expandable */}
          {transcript && (
            <div className="bg-bg2 border border-border-subtle rounded-xl overflow-hidden">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-bg3/50 transition-colors"
              >
                <span className="text-[13px] font-medium text-text">Ver transcricao completa</span>
                <ChevronDown className={`w-4 h-4 text-text3 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
              </button>
              {showTranscript && (
                <div className="px-4 pb-4">
                  <div className="bg-bg3 border border-border-subtle rounded-lg p-4 max-h-80 overflow-y-auto">
                    <p className="text-[12px] text-text2 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* === AUDIO TAB === */}
      {activeTab === 'player' && (
        <div>
          {audioUrl ? (
            <AudioPlayer
              title={title}
              speaker={`${speaker} · ${formatDuration(duration)}`}
              duration={formatDuration(duration)}
              audioUrl={audioUrl}
            />
          ) : (
            <div className="text-center py-16">
              <Mic className="w-8 h-8 text-text3 mx-auto mb-3" />
              <p className="text-text3 text-[13px]">Audio nao disponivel.</p>
            </div>
          )}
        </div>
      )}

      {/* === MATERIALS TAB === */}
      {activeTab === 'materials' && materialsExpired && (
        <div className="bg-scribia-red/8 border border-scribia-red/20 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-scribia-red shrink-0" />
          <div>
            <div className="text-[13px] font-medium text-text">Acesso aos materiais encerrado</div>
            <div className="text-[11px] text-text3">
              O período de acesso expirou em {materialsExpiresAt ? new Date(materialsExpiresAt).toLocaleDateString('pt-BR') : ''}.
              Seu histórico de eventos continua disponível.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && !materialsExpired && (
        <div className="space-y-5">
          {/* Seniority selector — shown when participant hasn't chosen a level yet */}
          {!seniority && hasMultiProfile && (
            <SenioritySelector
              lectureId={lectureId}
              userId={userId}
              onSelect={(level) => setSeniority(level)}
            />
          )}

          {/* Summary */}
          {summary && (
            <div className="bg-bg2 border border-border-subtle rounded-xl p-4 sm:p-5">
              <h3 className="font-heading text-sm font-bold text-text mb-2">Resumo da palestra</h3>
              <p className="text-[13px] text-text2 leading-6">{summary}</p>
            </div>
          )}

          {/* Multi-profile download cards (filtered by seniority) */}
          {hasMultiProfile && seniority && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-sm font-bold text-text flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-light" />
                  Materiais para você — {SENIORITY_LABELS[seniority]}
                </h3>
                <button
                  onClick={() => setSeniority(null)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-text3 hover:text-purple-light transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Trocar nível
                </button>
              </div>
              {Object.keys(profileGroups).length === 0 ? (
                <div className="bg-bg2 border border-border-subtle rounded-xl p-5 text-center">
                  <BookOpen className="w-6 h-6 text-text3 mx-auto mb-2" />
                  <p className="text-[13px] text-text3">Nenhum material disponível para o nível {SENIORITY_LABELS[seniority]}.</p>
                  <button
                    onClick={() => setSeniority(null)}
                    className="mt-2 text-[12px] text-purple-light hover:underline cursor-pointer"
                  >
                    Escolher outro nível
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(profileGroups).map(([profile, mats]) => (
                  <div key={profile} className="bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors">
                    <div className="text-[13px] font-semibold text-text mb-3">{PROFILE_LABELS[profile] || profile}</div>
                    <div className="space-y-2">
                      {mats.ebook && (
                        <button
                          onClick={() => handleDownload('ebook', profile)}
                          disabled={downloading}
                          className="w-full flex items-center justify-between gap-3 bg-purple-dim border border-purple/20 rounded-lg px-4 py-3 hover:bg-purple/15 transition-colors cursor-pointer disabled:opacity-50 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-purple-light" />
                            <div className="text-left">
                              <div className="text-[12px] font-medium text-text">Playbook</div>
                              {mats.ebook.word_count && (
                                <div className="text-[10px] text-text3">{mats.ebook.word_count.toLocaleString()} palavras</div>
                              )}
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple rounded-lg px-3 py-1.5 group-hover:bg-purple-light transition-colors shadow-sm">
                            <Download className="w-3.5 h-3.5" />
                            Exportar PDF
                          </div>
                        </button>
                      )}
                      {mats.playbook && (
                        <button
                          onClick={() => handleDownload('playbook', profile)}
                          disabled={downloading}
                          className="w-full flex items-center justify-between gap-3 bg-purple-dim border border-purple/20 rounded-lg px-4 py-3 hover:bg-purple/15 transition-colors cursor-pointer disabled:opacity-50 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-purple-light" />
                            <div className="text-left">
                              <div className="text-[12px] font-medium text-text">Live Book</div>
                              {mats.playbook.word_count && (
                                <div className="text-[10px] text-text3">{mats.playbook.word_count.toLocaleString()} palavras</div>
                              )}
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple rounded-lg px-3 py-1.5 group-hover:bg-purple-light transition-colors shadow-sm">
                            <Download className="w-3.5 h-3.5" />
                            Exportar PDF
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Legacy single ebook/playbook download */}
          {!hasMultiProfile && (ebookContent || playbookContent) && (
            <div>
              <h3 className="font-heading text-sm font-bold text-text mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 text-purple-light" />
                Materiais para download
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ebookContent && (
                  <button
                    onClick={() => handleDownload('ebook')}
                    disabled={downloading}
                    className="flex items-center justify-between gap-3 bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors cursor-pointer disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-purple-light" />
                      <div className="text-left">
                        <div className="text-[13px] font-medium text-text">Playbook</div>
                        <div className="text-[10px] text-text3">Material completo da palestra</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple rounded-lg px-3 py-1.5 group-hover:bg-purple-light transition-colors shadow-sm shrink-0">
                      <Download className="w-3.5 h-3.5" />
                      Exportar PDF
                    </div>
                  </button>
                )}
                {playbookContent && (
                  <button
                    onClick={() => handleDownload('playbook')}
                    disabled={downloading}
                    className="flex items-center justify-between gap-3 bg-bg2 border border-border-subtle rounded-xl p-4 hover:border-border-purple transition-colors cursor-pointer disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-purple-light" />
                      <div className="text-left">
                        <div className="text-[13px] font-medium text-text">Live Book</div>
                        <div className="text-[10px] text-text3">Guia interativo com checklist</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple rounded-lg px-3 py-1.5 group-hover:bg-purple-light transition-colors shadow-sm shrink-0">
                      <Download className="w-3.5 h-3.5" />
                      Exportar PDF
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasMultiProfile && !ebookContent && !playbookContent && (
            <div className="text-center py-16">
              <BookOpen className="w-8 h-8 text-text3 mx-auto mb-3" />
              <p className="text-text3 text-[13px]">Conteúdo em processamento...</p>
              <p className="text-text3 text-[11px] mt-1">Os materiais estarão disponíveis em breve.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
