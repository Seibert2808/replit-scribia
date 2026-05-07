import { Router, type IRouter } from 'express'
import { createAdminClient, createAnonClient } from '../lib/supabase-admin.js'

const router: IRouter = Router()

router.post('/reset-speaker-password', async (req, res) => {
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

    const { email } = req.body
    if (!email) { res.status(400).json({ error: 'email is required' }); return }

    const adminClient = createAdminClient()
    const siteUrl = process.env.SITE_URL
      ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://scribia.app')
    const redirectTo = `${siteUrl}/auth/set-password`

    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, { redirectTo })

    if (resetError) {
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery', email, options: { redirectTo },
      })
      if (linkError || !(linkData as { properties?: { hashed_token?: string } })?.properties?.hashed_token) {
        res.status(500).json({ error: 'Erro ao gerar link de senha' }); return
      }
      const lData = linkData as { properties: { hashed_token: string } }
      const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
      const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${lData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`
      res.json({ success: true, email_sent: false, reset_link: verifyUrl, message: 'Email não enviado (rate limit). Use o link direto.' }); return
    }

    res.json({ success: true, email_sent: true, message: 'Email para redefinir senha enviado!' })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
