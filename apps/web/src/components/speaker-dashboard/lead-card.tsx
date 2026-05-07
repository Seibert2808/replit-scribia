'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

export interface LeadData {
  user_id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  audio_completed: boolean
  audio_max_progress: number
  ebook_downloaded: boolean
  playbook_downloaded: boolean
  card_shared: boolean
  engagement_score: number
  lead_temperature: 'hot' | 'warm' | 'cold'
  first_interaction_at: string | null
  last_interaction_at: string | null
}

const temperatureBadge = {
  hot: { label: 'LEAD QUENTE', className: 'bg-orange-500/90 text-white', borderClass: 'border-orange-500/30' },
  warm: { label: 'LEAD MORNO', className: 'bg-scribia-yellow/90 text-black', borderClass: 'border-scribia-yellow/30' },
  cold: { label: 'LEAD FRIO', className: 'bg-bg3 text-text3', borderClass: 'border-border-subtle' },
}

export function LeadCard({ lead }: { lead: LeadData }) {
  const badge = temperatureBadge[lead.lead_temperature]
  const name = lead.full_name || lead.email.split('@')[0]
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const engagementItems = [
    {
      done: lead.audio_completed,
      label: 'Ouviu o audio completo da palestra',
      detail: lead.audio_completed
        ? '100% concluido'
        : lead.audio_max_progress > 0
          ? `${lead.audio_max_progress}% ouvido`
          : null,
    },
    {
      done: lead.ebook_downloaded,
      label: 'Baixou o livebook (PDF)',
      detail: lead.ebook_downloaded ? 'Download realizado' : null,
    },
    {
      done: lead.playbook_downloaded,
      label: 'Baixou o live book (PDF)',
      detail: lead.playbook_downloaded ? 'Download realizado' : null,
    },
    {
      done: lead.card_shared,
      label: 'Compartilhou o card nas redes sociais',
      detail: lead.card_shared ? 'Compartilhado' : null,
    },
  ]

  const doneCount = engagementItems.filter((i) => i.done).length
  const progressPercent = Math.round((doneCount / engagementItems.length) * 100)

  return (
    <div className={cn('bg-bg2 border rounded-2xl p-4 hover:shadow-lg hover:shadow-black/5 transition-all', badge.borderClass)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {lead.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={lead.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover ring-2 ring-bg3" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-2 ring-bg3">
              {initials}
            </div>
          )}
          <div>
            <div className="text-[13px] font-bold text-text">{name}</div>
            <div className="text-[11px] text-text3">Participante do evento</div>
          </div>
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold', badge.className)}>
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text3">Engajamento</span>
          <span className="text-[10px] font-medium text-text2">{doneCount}/{engagementItems.length}</span>
        </div>
        <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-scribia-green rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Engagement checklist */}
      <div className="space-y-2">
        {engagementItems.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-scribia-green mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-text3/30 mt-0.5 shrink-0" />
            )}
            <div>
              <div className={cn('text-[12px]', item.done ? 'text-text' : 'text-text3/60')}>
                {item.label}
              </div>
              {item.detail && (
                <div className="text-[10px] text-text3">{item.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
