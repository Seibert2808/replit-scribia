import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { LectureDetailClient } from '@/components/speaker-dashboard/lecture-detail-client'

export default async function SpeakerLectureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: lectureId } = await params
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

  if (!speaker) redirect('/speaker')
  const speakerRecord = speaker as { id: string; name: string; avatar_url: string | null; profile_photo_url: string | null }

  // Get lecture with event info
  const { data: lecture } = await supabase
    .from('lectures')
    .select('id, title, description, status, highlight_quote, summary, events(name, start_date)')
    .eq('id', lectureId)
    .eq('speaker_id', speakerRecord.id)
    .single()

  if (!lecture) redirect('/speaker/lectures')

  const lectureData = lecture as unknown as {
    id: string; title: string; description: string | null; status: string
    highlight_quote: string | null; summary: string | null
    events: { name: string; start_date: string } | null
  }

  // Get change requests
  const { data: changeRequests } = await supabase
    .from('lecture_change_requests')
    .select('*')
    .eq('lecture_id', lectureId)
    .eq('speaker_id', speakerRecord.id)
    .order('created_at', { ascending: false })

  const requests = (changeRequests ?? []) as unknown as Array<{
    id: string; request_type: string; requested_value: string; status: string
    reason: string | null; organizer_response: string | null; created_at: string
  }>

  const hasPendingTitleRequest = requests.some(
    (r) => r.request_type === 'title_change' && r.status === 'pending',
  )
  const hasPendingDescriptionRequest = requests.some(
    (r) => r.request_type === 'description_change' && r.status === 'pending',
  )

  // Get speaker files
  const { data: filesData } = await supabase
    .from('speaker_files')
    .select('*')
    .eq('lecture_id', lectureId)
    .eq('speaker_id', speakerRecord.id)
    .order('created_at', { ascending: false })

  const files = (filesData ?? []) as unknown as Array<{
    id: string; file_name: string; file_url: string; file_type: string
    file_size_bytes: number | null; description: string | null; created_at: string
  }>

  const avatarUrl = speakerRecord.profile_photo_url || speakerRecord.avatar_url

  return (
    <LectureDetailClient
      lectureId={lectureData.id}
      title={lectureData.title}
      description={lectureData.description}
      status={lectureData.status}
      highlightQuote={lectureData.highlight_quote}
      summary={lectureData.summary}
      eventName={lectureData.events?.name ?? 'Evento'}
      eventDate={lectureData.events?.start_date ?? null}
      speakerId={speakerRecord.id}
      speakerName={speakerRecord.name}
      speakerAvatar={avatarUrl}
      changeRequests={requests}
      files={files}
      hasPendingTitleRequest={hasPendingTitleRequest}
      hasPendingDescriptionRequest={hasPendingDescriptionRequest}
    />
  )
}
