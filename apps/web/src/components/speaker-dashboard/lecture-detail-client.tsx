'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ChangeRequestForm } from './change-request-form'
import { ChangeRequestHistory } from './change-request-history'
import { FileUpload } from './file-upload'
import { FileList, type SpeakerFile } from './file-list'
import { HighlightQuoteTab } from './highlight-quote-tab'

interface LectureDetailClientProps {
  lectureId: string
  title: string
  description: string | null
  status: string
  highlightQuote: string | null
  summary: string | null
  eventName: string
  eventDate: string | null
  speakerId: string
  speakerName: string
  speakerAvatar: string | null
  changeRequests: Array<{
    id: string; request_type: string; requested_value: string; status: string
    reason: string | null; organizer_response: string | null; created_at: string
  }>
  files: SpeakerFile[]
  hasPendingTitleRequest: boolean
  hasPendingDescriptionRequest: boolean
}

const tabs = [
  { id: 'info', label: 'Informacoes' },
  { id: 'files', label: 'Arquivos' },
  { id: 'highlight', label: 'Frase de Destaque' },
] as const

type TabId = typeof tabs[number]['id']

export function LectureDetailClient(props: LectureDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const router = useRouter()

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-500' },
    recording: { label: 'Gravando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
    processing: { label: 'Processando', color: 'bg-scribia-yellow/10 text-scribia-yellow' },
    completed: { label: 'Concluida', color: 'bg-scribia-green/10 text-scribia-green' },
    failed: { label: 'Erro', color: 'bg-red-500/10 text-red-500' },
  }

  const cfg = statusConfig[props.status] ?? statusConfig.scheduled

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Back link */}
      <Link
        href="/speaker/lectures"
        className="inline-flex items-center gap-1.5 text-[13px] text-text3 hover:text-text2 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para palestras
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">{props.title}</h1>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', cfg.color)}>
            {cfg.label}
          </span>
        </div>
        <p className="text-[13px] text-text3">{props.eventName}{props.eventDate ? ` · ${new Date(props.eventDate).toLocaleDateString('pt-BR')}` : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text3 hover:text-text2',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <ChangeRequestForm
            lectureId={props.lectureId}
            speakerId={props.speakerId}
            currentTitle={props.title}
            currentDescription={props.description}
            hasPendingTitleRequest={props.hasPendingTitleRequest}
            hasPendingDescriptionRequest={props.hasPendingDescriptionRequest}
          />
          <ChangeRequestHistory requests={props.changeRequests} />
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-6">
          <FileUpload
            lectureId={props.lectureId}
            speakerId={props.speakerId}
            currentFileCount={props.files.length}
            onUploadComplete={handleRefresh}
          />
          <FileList
            files={props.files}
            canDelete={true}
            onFileDeleted={handleRefresh}
          />
        </div>
      )}

      {activeTab === 'highlight' && (
        <HighlightQuoteTab
          lectureId={props.lectureId}
          currentQuote={props.highlightQuote}
          speakerName={props.speakerName}
          speakerAvatar={props.speakerAvatar}
          eventName={props.eventName}
          eventDate={props.eventDate}
          summary={props.summary}
        />
      )}
    </div>
  )
}
