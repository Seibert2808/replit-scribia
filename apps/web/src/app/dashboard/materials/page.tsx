import { createClient } from '@/lib/supabase-server'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { MaterialDownloadButton } from '@/components/materials/material-download-button'

const PROFILE_LABELS: Record<string, string> = {
  junior_compact: 'Junior Compacto',
  junior_complete: 'Junior Completo',
  pleno_compact: 'Pleno Compacto',
  pleno_complete: 'Pleno Completo',
  senior_compact: 'Senior Compacto',
  senior_complete: 'Senior Completo',
}

export default async function MaterialsPage() {
  const supabase = await createClient()

  // Fetch lectures that have legacy materials OR multi-profile materials
  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, event_id, ebook_url, playbook_url, status, processing_progress, events(name), speakers(name)')
    .order('updated_at', { ascending: false })

  const allLectures = (lectures ?? []) as Array<{
    id: string
    title: string
    event_id: string
    ebook_url: string | null
    playbook_url: string | null
    status: string
    processing_progress: number
    events: { name: string } | null
    speakers: { name: string } | null
  }>

  // Fetch multi-profile materials
  const { data: multiMaterials } = await supabase
    .from('lecture_materials')
    .select('lecture_id, profile_type, content_type, status, word_count')
    .eq('status', 'completed')
    .order('profile_type')

  const materials = (multiMaterials ?? []) as Array<{
    lecture_id: string
    profile_type: string
    content_type: 'ebook' | 'playbook'
    status: string
    word_count: number | null
  }>

  // Group materials by lecture_id
  const materialsByLecture = new Map<string, typeof materials>()
  for (const m of materials) {
    const existing = materialsByLecture.get(m.lecture_id) || []
    existing.push(m)
    materialsByLecture.set(m.lecture_id, existing)
  }

  // Build display items: lectures with any materials (legacy or multi-profile)
  const lectureIds = new Set<string>()
  const items: typeof allLectures = []
  const processing: typeof allLectures = []

  for (const lecture of allLectures) {
    const hasLegacy = lecture.ebook_url || lecture.playbook_url
    const hasMulti = materialsByLecture.has(lecture.id)

    if (hasLegacy || hasMulti) {
      items.push(lecture)
      lectureIds.add(lecture.id)
    } else if (lecture.status === 'processing') {
      processing.push(lecture)
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6 md:mb-9">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">Materiais</h1>
          <p className="text-[13px] text-text3 mt-0.5">Playbooks, live books e cards gerados</p>
        </div>
      </div>

      {/* Processing */}
      {processing.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[12px] text-text3 uppercase tracking-wider mb-3">Em processamento</h2>
          <div className="space-y-2">
            {processing.map((lecture) => (
              <Link
                key={lecture.id}
                href={`/dashboard/lectures/${lecture.id}`}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-bg2 border border-border-subtle rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 hover:border-border-purple transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-text font-medium truncate">{lecture.title}</p>
                  <p className="text-[11px] text-text3 truncate">{lecture.events?.name ?? 'Evento'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 sm:w-24 h-1.5 bg-bg3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple rounded-full transition-all"
                      style={{ width: `${lecture.processing_progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-purple-light font-mono w-8 text-right">
                    {lecture.processing_progress}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Materials list */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((lecture) => {
            const lectureMaterials = materialsByLecture.get(lecture.id) || []
            const profiles = [...new Set(lectureMaterials.map(m => m.profile_type))].sort()
            const hasMultiProfile = profiles.length > 0

            return (
              <div
                key={lecture.id}
                className="bg-bg2 border border-border-subtle rounded-xl px-4 sm:px-5 py-3.5 sm:py-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/lectures/${lecture.id}`}
                      className="text-[14px] text-text font-medium hover:text-purple-light transition-colors break-words"
                    >
                      {lecture.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-text3">{lecture.events?.name ?? 'Evento'}</span>
                      {lecture.speakers?.name && (
                        <>
                          <span className="text-[11px] text-text3">·</span>
                          <span className="text-[11px] text-text3">{lecture.speakers.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legacy buttons (no profile) */}
                  {!hasMultiProfile && (
                    <div className="flex flex-wrap gap-2 shrink-0 sm:ml-4">
                      {lecture.ebook_url && (
                        <MaterialDownloadButton
                          lectureId={lecture.id}
                          type="ebook"
                          label="Playbook"
                          icon="book"
                        />
                      )}
                      {lecture.playbook_url && (
                        <MaterialDownloadButton
                          lectureId={lecture.id}
                          type="playbook"
                          label="Live Book"
                          icon="file"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Multi-profile materials */}
                {hasMultiProfile && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <div className="grid gap-2">
                      {profiles.map(profile => {
                        const profileMats = lectureMaterials.filter(m => m.profile_type === profile)
                        const ebook = profileMats.find(m => m.content_type === 'ebook')
                        const playbook = profileMats.find(m => m.content_type === 'playbook')
                        const label = PROFILE_LABELS[profile] || profile

                        return (
                          <div key={profile} className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-text2 font-medium w-32 shrink-0">{label}</span>
                            {ebook && (
                              <MaterialDownloadButton
                                lectureId={lecture.id}
                                type="ebook"
                                label={`Playbook${ebook.word_count ? ` (${ebook.word_count.toLocaleString('pt-BR')} palavras)` : ''}`}
                                icon="book"
                                profile={profile}
                              />
                            )}
                            {playbook && (
                              <MaterialDownloadButton
                                lectureId={lecture.id}
                                type="playbook"
                                label={`Live Book${playbook.word_count ? ` (${playbook.word_count.toLocaleString('pt-BR')} palavras)` : ''}`}
                                icon="file"
                                profile={profile}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : processing.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-dim border border-border-purple flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-purple-light" />
          </div>
          <p className="text-text2 text-[14px]">Nenhum material gerado ainda</p>
          <p className="text-text3 text-[13px] mt-1">
            Crie palestras e processe o áudio para gerar playbooks e live books automaticamente.
          </p>
        </div>
      ) : null}
    </div>
  )
}
