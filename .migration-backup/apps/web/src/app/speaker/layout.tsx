import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SpeakerSidebar } from '@/components/speaker-dashboard/speaker-sidebar'

export default async function SpeakerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url, roles')
    .eq('id', user.id)
    .single()

  const roles = (profile as { roles: string[] } | null)?.roles ?? []
  if (!roles.includes('speaker')) redirect('/login')

  const userName = (profile as { full_name: string } | null)?.full_name || user.email?.split('@')[0] || 'Palestrante'
  const avatarUrl = (profile as { avatar_url: string | null } | null)?.avatar_url ?? null

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <SpeakerSidebar userName={userName} avatarUrl={avatarUrl} />
        <main className="flex-1 min-h-screen lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}
