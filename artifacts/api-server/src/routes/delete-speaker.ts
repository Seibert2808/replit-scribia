import { Router, type IRouter } from 'express'
import { createAdminClient, createAnonClient } from '../lib/supabase-admin.js'

const router: IRouter = Router()

router.post('/delete-speaker', async (req, res) => {
  try {
    const supabase = createAnonClient(req.headers.authorization)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { res.status(401).json({ error: 'Unauthorized' }); return }

    const { data: profile } = await supabase
      .from('user_profiles').select('roles').eq('id', user.id).single()
    const roles = (profile as { roles: string[] } | null)?.roles ?? []
    if (!roles.includes('super_admin') && !roles.includes('organizer')) {
      res.status(403).json({ error: 'Forbidden' }); return
    }

    const { speakerId } = req.body
    if (!speakerId) { res.status(400).json({ error: 'speakerId is required' }); return }

    const adminClient = createAdminClient()
    await adminClient.from('invitations').delete().eq('speaker_id', speakerId)
    const { error: deleteError } = await adminClient.from('speakers').delete().eq('id', speakerId)

    if (deleteError) { res.status(500).json({ error: deleteError.message }); return }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
