import { Router, type IRouter } from 'express'
import { createAdminClient, createAnonClient } from '../lib/supabase-admin.js'

const router: IRouter = Router()

router.post('/manage-speaker-account', async (req, res) => {
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

    const { email, action, password } = req.body
    if (!email || !action) { res.status(400).json({ error: 'email and action are required' }); return }

    const adminClient = createAdminClient()

    const { data: { users } } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1, filter: email } as never)
    const targetUser = (users as { id: string }[] | undefined)?.[0]
    if (!targetUser) {
      res.status(404).json({ error: 'Usuário não encontrado. Envie um convite primeiro.' }); return
    }

    switch (action) {
      case 'set-password': {
        if (!password || (password as string).length < 6) {
          res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' }); return
        }
        const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, { password })
        if (updateError) { res.status(500).json({ error: updateError.message }); return }
        res.json({ success: true, message: 'Senha definida com sucesso!' }); return
      }
      case 'confirm-email': {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        } as never)
        if (updateError) { res.status(500).json({ error: updateError.message }); return }
        res.json({ success: true, message: 'Email confirmado!' }); return
      }
      default:
        res.status(400).json({ error: 'Ação inválida' })
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
