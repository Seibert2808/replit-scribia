'use client'

import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import { EngagementStats } from './engagement-stats'
import { SpeakerIdentityCard } from './speaker-identity-card'
import { LeadCard, type LeadData } from './lead-card'
import { LectureFilter } from './lecture-filter'

interface LectureInfo {
  id: string
  title: string
  eventName: string
  highlightQuote: string | null
}

interface SpeakerDashboardClientProps {
  speakerName: string
  avatarUrl: string | null
  lectures: LectureInfo[]
  leads: (LeadData & { lecture_id: string })[]
}

export function SpeakerDashboardClient({
  speakerName,
  avatarUrl,
  lectures,
  leads,
}: SpeakerDashboardClientProps) {
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null)
  const [temperatureFilter, setTemperatureFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLeads = useMemo(() => {
    let result = leads

    if (selectedLectureId) {
      result = result.filter((l) => l.lecture_id === selectedLectureId)
    }

    if (temperatureFilter !== 'all') {
      result = result.filter((l) => l.lead_temperature === temperatureFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          (l.full_name?.toLowerCase().includes(q)) ||
          l.email.toLowerCase().includes(q),
      )
    }

    // Sort: hot first, then by score descending
    result.sort((a, b) => {
      const order = { hot: 0, warm: 1, cold: 2 }
      if (order[a.lead_temperature] !== order[b.lead_temperature]) {
        return order[a.lead_temperature] - order[b.lead_temperature]
      }
      return b.engagement_score - a.engagement_score
    })

    return result
  }, [leads, selectedLectureId, temperatureFilter, searchQuery])

  // Aggregate KPIs
  const kpiLeads = selectedLectureId
    ? leads.filter((l) => l.lecture_id === selectedLectureId)
    : leads

  // Deduplicate by user_id for aggregate stats
  const uniqueLeads = useMemo(() => {
    const map = new Map<string, typeof kpiLeads[0]>()
    for (const lead of kpiLeads) {
      const existing = map.get(lead.user_id)
      if (!existing || lead.engagement_score > existing.engagement_score) {
        map.set(lead.user_id, lead)
      }
    }
    return Array.from(map.values())
  }, [kpiLeads])

  const totalLeads = uniqueLeads.filter((l) => l.engagement_score > 0).length
  const hotLeads = uniqueLeads.filter((l) => l.lead_temperature === 'hot').length
  const totalDownloads = kpiLeads.filter((l) => l.ebook_downloaded || l.playbook_downloaded).length
  const audioCompletes = kpiLeads.filter((l) => l.audio_completed).length

  const activeLecture = selectedLectureId
    ? lectures.find((l) => l.id === selectedLectureId) ?? lectures[0]
    : lectures[0]

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text">
          Quem na plateia virou lead?
        </h1>
        <p className="text-[13px] text-text2 mt-1.5 max-w-lg leading-relaxed">
          Voce sai do palco e o ScribIA ja te diz quem na plateia continuou ouvindo, lendo e compartilhando voce.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar: Speaker card */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <SpeakerIdentityCard
            name={speakerName}
            avatarUrl={avatarUrl}
            highlightQuote={activeLecture?.highlightQuote ?? null}
            activeLectureId={activeLecture?.id ?? null}
          />

          {/* Quick tip */}
          {!avatarUrl && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-[11px] text-primary/80 leading-relaxed">
                Adicione uma foto de perfil em{' '}
                <a href="/speaker/profile" className="underline font-medium hover:text-primary">
                  Meu Perfil
                </a>{' '}
                para aparecer nos cards de compartilhamento.
              </p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="space-y-5">
          {/* KPIs */}
          <EngagementStats
            totalLeads={totalLeads}
            hotLeads={hotLeads}
            totalDownloads={totalDownloads}
            audioCompletes={audioCompletes}
          />

          {/* Filters */}
          <div className="bg-bg2 border border-border-subtle rounded-2xl p-4">
            <LectureFilter
              lectures={lectures}
              selectedLectureId={selectedLectureId}
              temperatureFilter={temperatureFilter}
              searchQuery={searchQuery}
              leadCount={filteredLeads.length}
              onLectureChange={setSelectedLectureId}
              onTemperatureChange={setTemperatureFilter}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Leads grid */}
          {filteredLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLeads.slice(0, 20).map((lead) => (
                <LeadCard key={`${lead.lecture_id}-${lead.user_id}`} lead={lead} />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 bg-bg2 border border-border-subtle rounded-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary/50" />
              </div>
              <p className="text-text2 text-sm font-medium">
                Nenhum participante interagiu com suas palestras ainda
              </p>
              <p className="text-text3 text-[12px] mt-1 max-w-xs mx-auto">
                Os leads aparecerão aqui conforme o público acessar os materiais.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 bg-bg2 border border-border-subtle rounded-2xl">
              <p className="text-text3 text-sm">
                Nenhum lead encontrado com os filtros selecionados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
