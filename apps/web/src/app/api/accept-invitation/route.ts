import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Validate token exists, is pending, and not expired
    const { data: invitation, error: fetchError } = await adminClient
      .from('invitations')
      .select('id, email, role, event_id, speaker_id, status, expires_at')
      .eq('token', token)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Convite nao encontrado' }, { status: 404 })
    }

    const inv = invitation as {
      id: string; email: string; role: string; event_id: string | null;
      speaker_id: string | null; status: string; expires_at: string
    }

    if (inv.status !== 'pending') {
      // Even if already accepted, still ensure linking is done
      if (inv.status === 'accepted') {
        await ensureLinking(adminClient, user.id, inv)
        return NextResponse.json({ success: true, already_accepted: true })
      }
      return NextResponse.json({ error: 'Convite ja foi utilizado' }, { status: 400 })
    }

    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 })
    }

    // Accept the invitation
    const { error: updateError } = await adminClient
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() } as never)
      .eq('token', token)
      .eq('status', 'pending')

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Ensure all linking is done
    await ensureLinking(adminClient, user.id, inv)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureLinking(adminClient: any, userId: string, inv: {
  role: string; event_id: string | null; speaker_id: string | null; email: string
}) {
  // 1. Update user_profiles.roles to include the invited role
  const { data: profileData } = await adminClient
    .from('user_profiles')
    .select('roles')
    .eq('id', userId)
    .single()

  const currentRoles: string[] = (profileData as { roles: string[] } | null)?.roles ?? []

  if (!currentRoles.includes(inv.role)) {
    const updatedRoles = [...new Set([...currentRoles, inv.role])]
    await adminClient
      .from('user_profiles')
      .update({ roles: updatedRoles })
      .eq('id', userId)
  }

  // 2. Link speaker record to this user
  if (inv.role === 'speaker' && inv.speaker_id) {
    await adminClient
      .from('speakers')
      .update({ user_id: userId })
      .eq('id', inv.speaker_id)
      .is('user_id', null) // Only if not already linked
  }

  // 3. Also try to link by email if speaker_id wasn't in the invitation
  if (inv.role === 'speaker' && !inv.speaker_id) {
    await adminClient
      .from('speakers')
      .update({ user_id: userId })
      .eq('email', inv.email)
      .is('user_id', null)
  }

  // 4. Register as event participant
  if (inv.event_id && (inv.role === 'participant' || inv.role === 'speaker')) {
    await adminClient
      .from('event_participants')
      .upsert(
        { event_id: inv.event_id, user_id: userId },
        { onConflict: 'event_id,user_id' }
      )
  }
}
