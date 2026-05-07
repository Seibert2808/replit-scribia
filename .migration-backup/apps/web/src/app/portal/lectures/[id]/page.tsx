import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { LectureDetailClient } from '@/components/portal/lecture-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LectureDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify access and get seniority level
  const { data: access } = await supabase
    .from('lecture_access')
    .select('id, seniority_level')
    .eq('user_id', user.id)
    .eq('lecture_id', id)
    .single()

  if (!access) notFound()

  const seniorityLevel = (access as { id: string; seniority_level: string | null }).seniority_level

  // Mark accessed
  await supabase
    .from('lecture_access')
    .update({ accessed_at: new Date().toISOString() } as never)
    .eq('user_id', user.id)
    .eq('lecture_id', id)

  // Fetch lecture with details (include event materials_access_days)
  const { data: lecture } = await supabase
    .from('lectures')
    .select('id, title, status, duration_seconds, audio_path, event_id, ebook_content, playbook_content, summary, topics, transcript_text, speakers(name), events(name, materials_access_days)')
    .eq('id', id)
    .single()

  if (!lecture) notFound()

  type LectureData = {
    id: string; title: string; status: string; duration_seconds: number | null
    audio_path: string | null; event_id: string
    ebook_content: string | null; playbook_content: string | null
    summary: string | null; topics: string[] | null; transcript_text: string | null
    speakers: { name: string } | null; events: { name: string; materials_access_days: number | null } | null
  }

  const l = lecture as unknown as LectureData

  // Fetch multi-profile materials (admin client bypasses RLS)
  const { data: profileMaterials } = await adminClient
    .from('lecture_materials')
    .select('id, profile_type, content_type, markdown_content, status, word_count, updated_at')
    .eq('lecture_id', id)
    .eq('status', 'completed')
    .order('profile_type')

  // Calculate materials expiration
  let materialsExpired = false
  let materialsExpiresAt: string | null = null
  if (l.events?.materials_access_days) {
    const latestMaterial = (profileMaterials ?? [])
      .sort((a: { updated_at: string }, b: { updated_at: string }) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0]

    if (latestMaterial) {
      const completedAt = new Date((latestMaterial as { updated_at: string }).updated_at)
      const expiresAt = new Date(completedAt.getTime() + l.events.materials_access_days * 24 * 60 * 60 * 1000)
      materialsExpiresAt = expiresAt.toISOString()
      materialsExpired = new Date() > expiresAt
    }
  }

  // Get audio chunks from storage (admin client bypasses RLS)
  const storagePath = l.audio_path ?? `${l.event_id}/${l.id}`
  const { data: audioFiles } = await adminClient.storage
    .from('audio-files')
    .list(storagePath)

  const getChunkIndex = (name: string) => {
    const m = name.match(/chunk_(\d+)\.wav$/); return m ? parseInt(m[1], 10) : 0
  }
  const audioChunks = (audioFiles ?? [])
    .filter((f: { name: string }) => f.name.endsWith('.wav'))
    .sort((a: { name: string }, b: { name: string }) => getChunkIndex(a.name) - getChunkIndex(b.name))

  // Use concatenation API for full audio playback
  const audioUrl = audioChunks.length > 0 ? `/api/audio/${l.id}` : null

  return (
    <div className="max-w-[900px] mx-auto px-10 py-9">
      <LectureDetailClient
        lectureId={l.id}
        userId={user.id}
        title={l.title}
        speaker={l.speakers?.name ?? 'Palestrante'}
        eventName={l.events?.name ?? 'Evento'}
        eventId={l.event_id}
        duration={l.duration_seconds}
        status={l.status}
        summary={l.summary}
        topics={l.topics}
        ebookContent={materialsExpired ? null : l.ebook_content}
        playbookContent={materialsExpired ? null : l.playbook_content}
        transcript={l.transcript_text}
        audioUrl={audioUrl}
        materialsExpired={materialsExpired}
        materialsExpiresAt={materialsExpiresAt}
        seniorityLevel={seniorityLevel}
        serverMaterials={materialsExpired ? [] : (profileMaterials ?? []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          profile_type: m.profile_type as string,
          content_type: m.content_type as 'ebook' | 'playbook',
          markdown_content: m.markdown_content as string | null,
          status: m.status as string,
          word_count: m.word_count as number | null,
        }))}
      />
    </div>
  )
}
