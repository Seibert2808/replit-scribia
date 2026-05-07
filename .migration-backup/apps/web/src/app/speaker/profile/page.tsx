import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SpeakerProfileForm } from '@/components/speakers/speaker-profile-form'

export default async function SpeakerProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify speaker role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, roles')
    .eq('id', user.id)
    .single()

  const roles = (profile as { roles: string[] } | null)?.roles ?? []
  if (!roles.includes('speaker')) redirect('/login')

  // Get speaker record
  const { data: speaker } = await supabase
    .from('speakers')
    .select('id, name, email, bio, company, role, mini_bio, formation, expertise_tags, featured_publications, linkedin_url, lattes_url, orcid, pronouns, profile_photo_url, avatar_url')
    .eq('user_id', user.id)
    .single()

  if (!speaker) redirect('/speaker')

  return (
    <div className="min-h-screen bg-bg1 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading text-[22px] font-extrabold text-text">Meu Perfil</h1>
          <p className="text-[13px] text-text3 mt-1">
            Suas informacoes profissionais serao incluidas nos livebooks gerados.
          </p>
        </div>
        <SpeakerProfileForm speaker={speaker as Record<string, unknown>} />
      </div>
    </div>
  )
}
