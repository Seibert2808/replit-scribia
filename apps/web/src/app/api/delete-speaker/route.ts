import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    // Verify caller is authenticated organizer or super_admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    const roles = (profile as { roles: string[] } | null)?.roles ?? []
    if (!roles.includes('super_admin') && !roles.includes('organizer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { speakerId } = await request.json()
    if (!speakerId) {
      return NextResponse.json({ error: 'speakerId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Delete linked invitations first (bypasses RLS)
    await adminClient.from('invitations').delete().eq('speaker_id', speakerId)

    // Delete the speaker
    const { error: deleteError } = await adminClient.from('speakers').delete().eq('id', speakerId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
