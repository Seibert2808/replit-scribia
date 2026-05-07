import { Router, type IRouter } from 'express'
import { createAdminClient, createAnonClient } from '../lib/supabase-admin.js'

const router: IRouter = Router()

router.post('/delete-user', async (req, res) => {
  try {
    const supabase = createAnonClient(req.headers.authorization)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { res.status(401).json({ error: 'Unauthorized' }); return }

    const { data: profile } = await supabase
      .from('user_profiles').select('roles').eq('id', user.id).single()
    const roles = (profile as { roles: string[] } | null)?.roles ?? []
    if (!roles.includes('super_admin')) {
      res.status(403).json({ error: 'Apenas super_admin pode deletar usuários' }); return
    }

    const { userId } = req.body
    if (!userId) { res.status(400).json({ error: 'userId is required' }); return }
    if (userId === user.id) {
      res.status(400).json({ error: 'Você não pode deletar sua própria conta' }); return
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient.rpc('delete_user_completely' as never, {
      target_user_id: userId,
    } as never)

    if (error) { res.status(500).json({ error: error.message }); return }

    const result = data as { success?: boolean; error?: string; deleted_user?: string }
    if (result?.error) { res.status(404).json({ error: result.error }); return }

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
