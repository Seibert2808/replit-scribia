import { Router, type IRouter } from 'express'
import { createAdminClient, createAnonClient } from '../lib/supabase-admin.js'

const router: IRouter = Router()

router.post('/accept-invitation', async (req, res) => {
  try {
    const supabase = createAnonClient(req.headers.authorization)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { res.status(401).json({ error: 'Unauthorized' }); return }

    const { token } = req.body
    if (!token) { res.status(400).json({ error: 'Token is required' }); return }

    const adminClient = createAdminClient()

    const { data: invitation, error: fetchError } = await adminClient
      .from('invitations')
      .select('id, email, role, event_id, speaker_id, status, expires_at')
      .eq('token', token)
      .single()

    if (fetchError || !invitation) { res.status(404).json({ error: 'Convite não encontrado' }); return }

    const inv = invitation as {
      id: string; email: string; role: string; event_id: string | null
      speaker_id: string | null; status: string; expires_at: string
    }

    if (inv.status !== 'pending') {
      if (inv.status === 'accepted') {
        await ensureLinking(adminClient, user.id, inv)
        res.json({ success: true, already_accepted: true }); return
      }
      res.status(400).json({ error: 'Convite já foi utilizado' }); return
    }

    if (new Date(inv.expires_at) < new Date()) {
      res.status(400).json({ error: 'Convite expirado' }); return
    }

    const { error: updateError } = await adminClient
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() } as never)
      .eq('token', token)
      .eq('status', 'pending')

    if (updateError) { res.status(500).json({ error: updateError.message }); return }

    await ensureLinking(adminClient, user.id, inv)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureLinking(adminClient: any, userId: string, inv: {
  role: string; event_id: string | null; speaker_id: string | null; email: string
}) {
  const { data: profileData } = await adminClient
    .from('user_profiles').select('roles').eq('id', userId).single()
  const currentRoles: string[] = (profileData as { roles: string[] } | null)?.roles ?? []
  if (!currentRoles.includes(inv.role)) {
    await adminClient.from('user_profiles')
      .update({ roles: [...new Set([...currentRoles, inv.role])] })
      .eq('id', userId)
  }
  if (inv.role === 'speaker' && inv.speaker_id) {
    await adminClient.from('speakers').update({ user_id: userId })
      .eq('id', inv.speaker_id).is('user_id', null)
  }
  if (inv.role === 'speaker' && !inv.speaker_id) {
    await adminClient.from('speakers').update({ user_id: userId })
      .eq('email', inv.email).is('user_id', null)
  }
  if (inv.event_id && (inv.role === 'participant' || inv.role === 'speaker')) {
    await adminClient.from('event_participants')
      .upsert({ event_id: inv.event_id, user_id: userId }, { onConflict: 'event_id,user_id' })
  }
}

export default router
