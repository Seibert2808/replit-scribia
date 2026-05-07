import { Router, type IRouter } from 'express'
import { createAdminClient } from '../lib/supabase-admin.js'

const router: IRouter = Router()

router.post('/resend-invite', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) { res.status(400).json({ error: 'Token is required' }); return }

    const adminClient = createAdminClient()

    const { data: invitation, error: fetchError } = await adminClient
      .from('invitations').select('id, email, status, expires_at').eq('token', token).single()

    if (fetchError || !invitation) { res.status(404).json({ error: 'Convite não encontrado' }); return }

    const inv = invitation as { id: string; email: string; status: string; expires_at: string }

    if (new Date(inv.expires_at) < new Date()) {
      res.status(400).json({ error: 'Convite expirado. Solicite um novo ao organizador.' }); return
    }

    const siteUrl = process.env.SITE_URL ?? process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://scribia.app'
    const redirectTo = `${siteUrl}/auth/set-password?token=${token}`

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: inv.email,
      options: { redirectTo },
    })

    if (linkError || !(linkData as { properties?: { hashed_token?: string } })?.properties?.hashed_token) {
      res.status(500).json({ error: 'Erro ao gerar novo link' }); return
    }

    const lData = linkData as { properties: { hashed_token: string } }
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${lData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`

    res.json({ redirect_url: verifyUrl })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
