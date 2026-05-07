import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SpeakerDashboardClient } from '@/components/speaker-dashboard/speaker-dashboard-client'

export default async function SpeakerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get speaker record
  const { data: speaker } = await supabase
    .from('speakers')
    .select('id, name, avatar_url, profile_photo_url')
    .eq('user_id', user.id)
    .single()

  if (!speaker) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <p className="text-text2">Voce ainda nao tem um perfil de palestrante vinculado.</p>
        <p className="text-text3 text-sm mt-1">Entre em contato com o organizador do evento.</p>
      </div>
    )
  }

  const speakerRecord = speaker as { id: string; name: string; avatar_url: string | null; profile_photo_url: string | null }

  // Get lectures for this speaker
  const { data: lectureData } = await supabase
    .from('lectures')
    .select('id, title, highlight_quote, events(name)')
    .eq('speaker_id', speakerRecord.id)

  const lectures = ((lectureData ?? []) as unknown as Array<{
    id: string; title: string; highlight_quote: string | null; events: { name: string } | null
  }>).map((l) => ({
    id: l.id,
    title: l.title,
    eventName: l.events?.name ?? 'Evento',
    highlightQuote: l.highlight_quote,
  }))

  if (lectures.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-text mb-2">Quem na plateia virou lead?</h1>
        <p className="text-text2">Voce ainda nao tem palestras atribuidas.</p>
        <p className="text-text3 text-sm mt-1">Entre em contato com o organizador do evento.</p>
      </div>
    )
  }

  // Fetch leads from the lecture_leads view for all speaker lectures
  const lectureIds = lectures.map((l) => l.id)
  const { data: leadsData } = await supabase
    .from('lecture_leads')
    .select('*')
    .in('lecture_id', lectureIds)

  const leads = ((leadsData ?? []) as unknown as Array<{
    lecture_id: string
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
    lead_temperature: string
    first_interaction_at: string | null
    last_interaction_at: string | null
  }>).map((l) => ({
    ...l,
    lead_temperature: l.lead_temperature as 'hot' | 'warm' | 'cold',
  }))

  const avatarUrl = speakerRecord.profile_photo_url || speakerRecord.avatar_url

  return (
    <SpeakerDashboardClient
      speakerName={speakerRecord.name}
      avatarUrl={avatarUrl}
      lectures={lectures}
      leads={leads}
    />
  )
}
